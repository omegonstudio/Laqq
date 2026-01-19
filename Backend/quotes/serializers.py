from rest_framework import serializers
from .models import QuoteType, QuoteState, Quote, QuoteItem
import logging

logger = logging.getLogger(__name__)

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
        # Auto-calculate subtotal if not provided
        if 'subtotal' not in validated_data or validated_data['subtotal'] is None:
            quantity = validated_data.get('quantity', 1)
            unit_price = validated_data.get('unit_price', 0) or 0
            validated_data['subtotal'] = quantity * unit_price
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Auto-calculate subtotal if not provided
        if 'subtotal' not in validated_data or validated_data['subtotal'] is None:
            quantity = validated_data.get('quantity', instance.quantity)
            unit_price = validated_data.get('unit_price', instance.unit_price) or 0
            validated_data['subtotal'] = quantity * unit_price
        return super().update(instance, validated_data)

class QuoteSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True, read_only=True, source='quoteitem_set')

    class Meta:
        model = Quote
        fields = '__all__'
        read_only_fields = ['quote_number']
        extra_kwargs = {
            'quote_number': {'required': False, 'allow_blank': True}
        }

    def validate_total_amount(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Total amount cannot be negative")
        return value

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
        """Validar cada item en el array"""
        for item in value:
            item_id = item.get('id')

            # Si tiene ID, es actualización - validar solo los campos presentes
            if item_id:
                # Validar que el ID existe
                if not QuoteItem.objects.filter(id=item_id).exists():
                    raise serializers.ValidationError(
                        f"QuoteItem with id {item_id} does not exist"
                    )
                # Para actualización, no son requeridos quote y product
                pass
            else:
                # Si no tiene ID, es creación - validar campos requeridos
                if 'quote' not in item:
                    raise serializers.ValidationError(
                        "Field 'quote' is required for creating new items"
                    )
                if 'product' not in item:
                    raise serializers.ValidationError(
                        "Field 'product' is required for creating new items"
                    )

            # Validar quantity si está presente
            quantity = item.get('quantity')
            if quantity is not None and quantity <= 0:
                raise serializers.ValidationError(
                    "Quantity must be greater than 0"
                )

            # Validar unit_price si está presente
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
            # Auto-calculate subtotal if not provided
            quantity = item_data.get('quantity', 1)
            unit_price = item_data.get('unit_price', 0)
            if unit_price is None:
                unit_price = 0
            else:
                unit_price = float(unit_price)

            if 'subtotal' not in item_data or item_data['subtotal'] is None:
                item_data['subtotal'] = quantity * unit_price

            # Si tiene ID, actualizar; si no, crear
            item_id = item_data.pop('id', None)

            if item_id:
                # Actualizar item existente
                item = QuoteItem.objects.get(id=item_id)

                # Solo actualizar campos proporcionados
                for key, value in item_data.items():
                    # Convertir foreign keys de string a instancia
                    if key == 'quote' and isinstance(value, str):
                        value = Quote.objects.get(id=value)
                    elif key == 'product' and isinstance(value, str):
                        value = Product.objects.get(id=value)

                    setattr(item, key, value)
                item.save()
                updated_items.append(item)
            else:
                # Crear nuevo item - convertir FKs
                if 'quote' in item_data and isinstance(item_data['quote'], str):
                    item_data['quote'] = Quote.objects.get(id=item_data['quote'])
                if 'product' in item_data and isinstance(item_data['product'], str):
                    item_data['product'] = Product.objects.get(id=item_data['product'])

                item = QuoteItem.objects.create(**item_data)
                created_items.append(item)

        return {'created': created_items, 'updated': updated_items}

    def to_representation(self, instance):
        """
        Retorna la lista de items creados y actualizados serializados.
        """
        if isinstance(instance, dict):
            return {
                'created': QuoteItemSerializer(instance.get('created', []), many=True).data,
                'updated': QuoteItemSerializer(instance.get('updated', []), many=True).data,
            }
        return QuoteItemSerializer(instance, many=True).data