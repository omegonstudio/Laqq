from rest_framework import serializers
from .models import QuoteType, QuoteState, Quote, QuoteItem
from contacts.models import Contact, ContactState
from products.models import Product, ProductVariant
from products.serializers import ProductSerializer, ProductVariantSerializer
from contacts.serializers import ContactSerializer
import logging

logger = logging.getLogger(__name__)

# Estructura fija de "condiciones generales de la oferta" que viaja en Quote.specs.
# El front arma el PDF de la cotización con estos datos, así que toda cotización
# (nueva o vieja) debe exponer siempre estas claves, aunque estén vacías.
QUOTE_SPECS_DEFAULTS = {
    'validity': '',
    'validity_date': '',
    'payment_terms': '',
    'cash_price_label': '',
    'iva_label': '',
    'currency': '',
    'delivery_terms': '',
    'warranty': '',
    'extra_conditions': '',
}

class QuoteTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteType
        fields = '__all__'

class QuoteStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteState
        fields = '__all__'

class QuoteItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteItem
        fields = '__all__'

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")
        return value

    def validate_unit_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Unit price cannot be negative")
        return value

    def validate_subtotal(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Subtotal cannot be negative")
        return value

    def create(self, validated_data):
        if 'subtotal' not in validated_data or validated_data['subtotal'] is None:
            quantity = validated_data.get('quantity', 1)
            unit_price = validated_data.get('unit_price', 0) or 0
            validated_data['subtotal'] = quantity * unit_price
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'subtotal' not in validated_data or validated_data['subtotal'] is None:
            quantity = validated_data.get('quantity', instance.quantity)
            unit_price = validated_data.get('unit_price', instance.unit_price) or 0
            validated_data['subtotal'] = quantity * unit_price
        return super().update(instance, validated_data)

class QuoteItemDetailSerializer(serializers.ModelSerializer):
    """
    Serializer para QuoteItem que incluye todos los detalles del producto y su variante.
    Usado en respuestas donde se necesita información completa del producto.
    """
    product = ProductSerializer(read_only=True)
    variant = ProductVariantSerializer(read_only=True)

    class Meta:
        model = QuoteItem
        fields = '__all__'

class QuoteSerializer(serializers.ModelSerializer):
    """
    Serializer estándar para Quote con detalles completos de contact y products.
    Usado en endpoints de listado y detalle de cotizaciones.
    """
    contact = ContactSerializer(read_only=True)
    contact_id = serializers.PrimaryKeyRelatedField(
        queryset=Contact.objects.all(),
        source='contact',
        write_only=True,
        required=True
    )

    items = QuoteItemDetailSerializer(many=True, read_only=True, source='quoteitem_set')

    class Meta:
        model = Quote
        fields = '__all__'
        read_only_fields = ['quote_number', 'contact', 'items']
        extra_kwargs = {
            'quote_number': {'required': False, 'allow_blank': True}
        }

    def validate_total_amount(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Total amount cannot be negative")
        return value

    def validate_specs(self, value):
        if value in (None, ''):
            return dict(QUOTE_SPECS_DEFAULTS)
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                'specs debe ser un objeto JSON con las condiciones generales de la cotización '
                f'(claves esperadas: {", ".join(QUOTE_SPECS_DEFAULTS.keys())}).'
            )
        merged = dict(QUOTE_SPECS_DEFAULTS)
        merged.update(value)
        return merged

    def to_representation(self, instance):
        data = super().to_representation(instance)
        merged = dict(QUOTE_SPECS_DEFAULTS)
        merged.update(instance.specs or {})
        data['specs'] = merged
        return data

class BulkQuoteItemSerializer(serializers.Serializer):
    """
    Serializer para creación y actualización masiva de items de cotización.
    Acepta un array de items en el campo 'data'.

    Para crear: No incluir 'id' en los items
    Para actualizar: Incluir 'id' en los items que se quieren actualizar
    Puede mezclar items nuevos (sin id) y existentes (con id) en el mismo request
    """
    data = serializers.ListField(child=serializers.DictField())

    def validate_data(self, value):
        for item in value:
            item_id = item.get('id')

            if item_id:
                if not QuoteItem.objects.filter(id=item_id).exists():
                    raise serializers.ValidationError(
                        f"QuoteItem with id {item_id} does not exist"
                    )
            else:
                if 'quote' not in item:
                    raise serializers.ValidationError(
                        "Field 'quote' is required for creating new items"
                    )
                if 'product' not in item:
                    raise serializers.ValidationError(
                        "Field 'product' is required for creating new items"
                    )

            quantity = item.get('quantity')
            if quantity is not None and quantity <= 0:
                raise serializers.ValidationError(
                    "Quantity must be greater than 0"
                )

            unit_price = item.get('unit_price')
            if unit_price is not None and float(unit_price) < 0:
                raise serializers.ValidationError(
                    "Unit price cannot be negative"
                )

        return value

    def create(self, validated_data):
        from products.models import Product
        from .models import Quote

        items_data = validated_data.get('data', [])
        created_items = []
        updated_items = []

        for item_data in items_data:
            quantity = item_data.get('quantity', 1)
            unit_price = item_data.get('unit_price', 0)
            if unit_price is None:
                unit_price = 0
            else:
                unit_price = float(unit_price)

            if 'subtotal' not in item_data or item_data['subtotal'] is None:
                item_data['subtotal'] = quantity * unit_price

            item_id = item_data.pop('id', None)

            if item_id:
                item = QuoteItem.objects.get(id=item_id)

                for key, value in item_data.items():
                    if key == 'quote' and isinstance(value, str):
                        value = Quote.objects.get(id=value)
                    elif key == 'product' and isinstance(value, str):
                        value = Product.objects.get(id=value)
                    elif key == 'variant' and isinstance(value, str):
                        value = ProductVariant.objects.get(id=value)

                    setattr(item, key, value)
                item.save()
                updated_items.append(item)
            else:
                if 'quote' in item_data and isinstance(item_data['quote'], str):
                    item_data['quote'] = Quote.objects.get(id=item_data['quote'])
                if 'product' in item_data and isinstance(item_data['product'], str):
                    item_data['product'] = Product.objects.get(id=item_data['product'])
                if 'variant' in item_data and isinstance(item_data['variant'], str):
                    item_data['variant'] = ProductVariant.objects.get(id=item_data['variant'])

                item = QuoteItem.objects.create(**item_data)
                created_items.append(item)

        return {'created': created_items, 'updated': updated_items}

    def to_representation(self, instance):
        if isinstance(instance, dict):
            return {
                'created': QuoteItemSerializer(instance.get('created', []), many=True).data,
                'updated': QuoteItemSerializer(instance.get('updated', []), many=True).data,
            }
        return QuoteItemSerializer(instance, many=True).data

class QuotePackageSerializer(serializers.Serializer):
    """
    Serializer para crear una cotización completa con contacto e items.

    FUNCIONALIDAD:
    1. Busca un contacto existente por email
    2. Si el contacto existe, lo asocia a la nueva cotización
    3. Si no existe, crea un nuevo contacto con los datos proporcionados
    4. Crea la cotización asociada al contacto
    5. Crea los items de la cotización
    6. Calcula automáticamente subtotales y el total de la cotización

    CAMPOS OBLIGATORIOS:
    - contact.email: Email del contacto (debe ser válido)
    - contact.first_name: Nombre del contacto
    - contact.last_name: Apellido del contacto
    - items[].product: UUID del producto (si hay items)
    - items[].quantity: Cantidad (debe ser > 0, si hay items)

    CAMPOS OPCIONALES:
    - contact.company_name: Nombre de la empresa
    - contact.phone: Teléfono del contacto
    - contact.country: País del contacto
    - contact.message: Mensaje del contacto
    - quote.quote_type: ID del tipo de cotización (default: "standard")
    - quote.state: ID del estado de la cotización (default: "pending")
    - quote.user: UUID del usuario asignado
    - quote.message: Mensaje de la cotización
    - items[].unit_price: Precio unitario
    - items[].variant: UUID de la variante del producto (opcional)
    - items: Array de items (puede estar vacío o no incluirse)
    """
    contact = serializers.DictField()
    quote = serializers.DictField()
    items = serializers.ListField(child=serializers.DictField(), required=False, allow_empty=True)

    def validate_contact(self, value):
        required_fields = ['email', 'first_name', 'last_name']
        for field in required_fields:
            if field not in value or not value[field]:
                raise serializers.ValidationError(
                    f"Field '{field}' is required in contact data"
                )

        import re
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, value['email']):
            raise serializers.ValidationError("Invalid email format")

        return value

    def validate_quote(self, value):
        if 'quote_type' in value and value['quote_type'] is not None:
            if not QuoteType.objects.filter(id=value['quote_type']).exists():
                raise serializers.ValidationError(
                    f"QuoteType with id '{value['quote_type']}' does not exist"
                )

        if 'state' in value and value['state'] is not None:
            if not QuoteState.objects.filter(id=value['state']).exists():
                raise serializers.ValidationError(
                    f"QuoteState with id '{value['state']}' does not exist"
                )

        return value

    def validate_items(self, value):
        if not value:
            return value

        for item in value:
            if 'product' not in item:
                raise serializers.ValidationError(
                    "Field 'product' is required for each item"
                )
            if 'quantity' not in item:
                raise serializers.ValidationError(
                    "Field 'quantity' is required for each item"
                )

            if not Product.objects.filter(id=item['product']).exists():
                raise serializers.ValidationError(
                    f"Product with id '{item['product']}' does not exist"
                )

            # Validar variant si está presente (ignorar strings vacíos)
            if 'variant' in item and item['variant']:
                if isinstance(item['variant'], str) and not item['variant'].strip():
                    item['variant'] = None
                elif not ProductVariant.objects.filter(id=item['variant']).exists():
                    logger.warning(
                        f"ProductVariant with id '{item['variant']}' does not exist. "
                        f"Item will be created without variant."
                    )
                    item['variant'] = None

            if item['quantity'] <= 0:
                raise serializers.ValidationError(
                    "Quantity must be greater than 0"
                )

            if 'unit_price' in item and item['unit_price'] is not None:
                if float(item['unit_price']) < 0:
                    raise serializers.ValidationError(
                        "Unit price cannot be negative"
                    )

        return value

    def create(self, validated_data):
        contact_data = validated_data['contact']
        quote_data = validated_data['quote']
        items_data = validated_data.get('items', [])

        # 1. Buscar o crear contacto por email o teléfono
        email = contact_data['email']
        phone = contact_data.get('phone', '').strip()
        contact = Contact.objects.filter(email__iexact=email).first()
        if not contact and phone:
            contact = Contact.objects.filter(phone=phone).first()

        if contact:
            logger.info(f"Contact found with email/phone {email}/{phone}: {contact.id}")
        else:
            default_state = ContactState.objects.filter(id='new').first()
            if not default_state:
                default_state = ContactState.objects.first()

            if not default_state:
                raise serializers.ValidationError(
                    "No ContactState available. Please create at least one ContactState."
                )

            contact = Contact.objects.create(
                email=email,
                first_name=contact_data['first_name'],
                last_name=contact_data['last_name'],
                company_name=contact_data.get('company_name', ''),
                phone=contact_data.get('phone', ''),
                country=contact_data.get('country', ''),
                message=contact_data.get('message', ''),
                state=default_state
            )
            logger.info(f"New contact created with email {email}: {contact.id}")

        # 2. Crear la cotización
        quote_create_data = {
            'contact': contact,
            'user_id': quote_data.get('user'),
            'message': quote_data.get('message', '')
        }

        if 'quote_type' in quote_data and quote_data['quote_type']:
            quote_type = QuoteType.objects.filter(id=quote_data['quote_type']).first()
            if not quote_type:
                raise serializers.ValidationError(
                    f"QuoteType '{quote_data['quote_type']}' does not exist."
                )
            quote_create_data['quote_type'] = quote_type
        else:
            default_quote_type = QuoteType.objects.first()
            if not default_quote_type:
                raise serializers.ValidationError(
                    "No QuoteType available. Please create at least one QuoteType."
                )
            quote_create_data['quote_type'] = default_quote_type
            logger.warning("No quote_type provided, using default: %s", default_quote_type.id)

        if 'state' in quote_data and quote_data['state']:
            quote_state = QuoteState.objects.filter(id=quote_data['state']).first()
            if not quote_state:
                raise serializers.ValidationError(
                    f"QuoteState '{quote_data['state']}' does not exist."
                )
            quote_create_data['state'] = quote_state
        else:
            default_quote_state = QuoteState.objects.filter(id='pending').first()
            if not default_quote_state:
                raise serializers.ValidationError(
                    "No QuoteState available. Please create at least one QuoteState."
                )
            quote_create_data['state'] = default_quote_state
            logger.warning("No state provided, using default: %s", default_quote_state.id)

        from django.db.models.signals import post_save
        from .signals import send_quote_notification
        from .emails import send_quote_created_email as _send_quote_created_email

        post_save.disconnect(send_quote_notification, sender=Quote)
        try:
            quote = Quote.objects.create(**quote_create_data)
            logger.info(f"Quote created: {quote.quote_number} (ID: {quote.id})")

            # 3. Crear los items de la cotización
            created_items = []
            total_amount = 0

            for item_data in items_data:
                product = Product.objects.get(id=item_data['product'])
                quantity = item_data['quantity']
                unit_price = item_data.get('unit_price')
                variant_id = item_data.get('variant')

                if isinstance(variant_id, str) and not variant_id.strip():
                    variant_id = None

                variant = None
                if variant_id:
                    try:
                        variant = ProductVariant.objects.get(id=variant_id)
                    except ProductVariant.DoesNotExist:
                        logger.warning(f"ProductVariant {variant_id} not found")

                if unit_price is None:
                    unit_price = product.price if hasattr(product, 'price') else 0
                else:
                    unit_price = float(unit_price)

                subtotal = quantity * unit_price

                quote_item = QuoteItem.objects.create(
                    quote=quote,
                    product=product,
                    variant=variant,
                    quantity=quantity,
                    unit_price=unit_price,
                    subtotal=subtotal
                )
                created_items.append(quote_item)
                total_amount += subtotal
                logger.info(f"QuoteItem created for product {product.id}, variant: {variant_id}, quantity: {quantity}")

            # 4. Actualizar el total de la cotización
            quote.total_amount = total_amount
            quote.save()
            logger.info(f"Quote total_amount updated: {total_amount}")
        finally:
            post_save.connect(send_quote_notification, sender=Quote)

        try:
            results = _send_quote_created_email(quote)
            if results['business']:
                logger.info("Email enviado al negocio para cotizacion #%s", quote.quote_number)
            else:
                logger.warning("No se pudo enviar email al negocio para cotizacion #%s", quote.quote_number)
            if results['customer']:
                logger.info("Email enviado al cliente para cotizacion #%s", quote.quote_number)
            else:
                logger.warning("No se pudo enviar email al cliente para cotizacion #%s", quote.quote_number)
            if results['errors']:
                for error in results['errors']:
                    logger.error("Error en email de cotizacion: %s", error)
        except Exception as e:
            logger.exception("Error al enviar emails para cotizacion #%s: %s", quote.quote_number, e)

        return {
            'contact': contact,
            'quote': quote,
            'items': created_items
        }

    def to_representation(self, instance):
        context = {'request': self.context.get('request')}

        return {
            'contact': ContactSerializer(instance['contact'], context=context).data,
            'quote': QuoteSerializer(instance['quote'], context=context).data,
            'items': QuoteItemDetailSerializer(instance['items'], many=True, context=context).data
        }
