from rest_framework import serializers
from drf_yasg.utils import swagger_serializer_method
from django.contrib.contenttypes.models import ContentType
from .models import Brand, Category, Product, ProductSpec, ProductRelation, ProductSpecification
from attachments.models import Attachment
from attachments.serializers import AttachmentSerializer

class BrandSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Brand
        fields = ['id', 'name', 'description', 'logo_attachment', 'logo_url', 'created_at', 'updated_at']
        read_only_fields = ['id', 'logo_url', 'created_at', 'updated_at']

    def get_logo_url(self, obj):
        """
        Devuelve URL absoluta del logo si existe logo_attachment.
        """
        if obj.logo_attachment:
            url = getattr(obj.logo_attachment, 'url', None)
            request = self.context.get('request')
            if url and request:
                return request.build_absolute_uri(url)
            return url
        return None

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSpecSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSpec
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class ProductSpecificationSerializer(serializers.ModelSerializer):
    """Serializer para especificaciones DINÁMICAS (clave-valor)"""

    # Permitimos recibir el ID para actualizar y el producto al crear vía API directa
    id = serializers.UUIDField(required=False)
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), required=False)

    class Meta:
        model = ProductSpecification
        fields = [
            'id',
            'product',
            'key',
            'value',
            'unit',
            'display_order',
            'is_visible',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class ProductRelationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductRelation
        fields = ['id', 'from_product', 'to_product', 'relation_type', 'created_at']
        read_only_fields = ['id', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    # Especificaciones FIJAS (campos predefinidos: volume, dimensions, etc.)
    fixed_specs = ProductSpecSerializer(many=True, read_only=True)

    # Especificaciones DINÁMICAS (clave-valor personalizadas)
    specifications = ProductSpecificationSerializer(source='dynamic_specifications', many=True, read_only=True)

    # Alias de escritura/lectura para specs dinámicas (compatibilidad con frontend)
    # Separamos en dos campos para evitar problemas con Swagger:
    # - specs: para lectura (SerializerMethodField con decorador para Swagger)
    # - specs_data: para escritura (JSONField simple, usado en create/update)
    specs = serializers.SerializerMethodField(read_only=True)
    specs_data = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True,
        help_text='Array de especificaciones dinámicas: [{"key": "Voltaje", "value": "220V", "unit": "V", "display_order": 0, "is_visible": true}]'
    )

    # Brand as name for reading, ID for writing
    brand = serializers.CharField(source='brand.name', read_only=True)
    brand_id = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(),
        source='brand',
        required=False
    )

    # Category as name for reading, ID for writing
    category = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        required=False
    )

    # keep the old related_product_ids (by PK) for clients that use UUIDs
    related_product_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Product.objects.all(),
        source='related_products',
        required=False,
        write_only=True
    )

    # allow related by product_code (more user-friendly)
    related_product_codes = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )

    related_products = serializers.SerializerMethodField(read_only=True)
    related = serializers.SerializerMethodField(read_only=True)

    # Mantengo image_attachment como FK (imagen principal opcional)
    image_url = serializers.SerializerMethodField(read_only=True)

    # Nuevo: lista de attachments asociados al producto (read-only)
    attachments = serializers.SerializerMethodField(read_only=True)

    # ✨ NUEVOS: Para manejar múltiples attachments en PUT/POST
    attachments_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
        help_text='Lista de archivos a subir: [file1, file2, ...]'
    )
    
    attachments_existing = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        help_text='IDs de attachments a MANTENER. Los no mencionados se eliminarán.'
    )

    class Meta:
        model = Product
        fields = [
            'id', 'product_code', 'name', 'brand', 'brand_id', 'category', 'category_id', 'description',
            'image_attachment', 'image_url', 'attachments', 'is_active', 'is_featured', 'created_at', 'updated_at',
            'fixed_specs', 'specifications', 'specs', 'specs_data', 'related_product_ids', 'related_product_codes', 
            'related_products', 'related', 'attachments_files', 'attachments_existing'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'related_products', 'fixed_specs', 'specifications', 'specs', 'related', 'image_url', 'attachments']
        extra_kwargs = {
            'product_code': {'required': False, 'allow_blank': True}
        }

    def get_related_products(self, obj):
        return [{
            'id': str(r.to_product.id),
            'product_code': r.to_product.product_code,
            'name': r.to_product.name,
            'brand': getattr(r.to_product.brand, 'name', None),
            'relation_type': r.relation_type
        } for r in obj.from_relations.select_related('to_product__brand').all()]

    def get_related(self, obj):
        # Alias para compatibilidad con el frontend actual
        return self.get_related_products(obj)

    def get_image_url(self, obj):
        """
        Devuelve URL absoluta de la imagen si existe image_attachment.
        Requiere que Attachment tenga una propiedad/url accesible (p.ej. Attachment.file.url o Attachment.url).
        """
        if obj.image_attachment:
            url = getattr(obj.image_attachment, 'url', None)
            request = self.context.get('request')
            if url and request:
                return request.build_absolute_uri(url)
            return url
        return None

    def get_attachments(self, obj):
        # Busca attachments vinculados: attachable_type='product' y attachable_id=obj.id
        qs = Attachment.objects.filter(attachable_type='product', attachable_id=obj.id).order_by('-created_at')
        return AttachmentSerializer(qs, many=True, context=self.context).data

    @swagger_serializer_method(serializer_or_field=ProductSpecificationSerializer)
    def get_specs(self, obj):
        """Retorna las especificaciones dinámicas del producto (mismo que 'specifications')"""
        return ProductSpecificationSerializer(obj.dynamic_specifications.all(), many=True).data

    def _create_relations_by_codes(self, from_product, codes):
        if not codes:
            return
        # fetch all target products
        targets = {p.product_code: p for p in Product.objects.filter(product_code__in=codes)}
        for code in codes:
            if code == from_product.product_code:
                continue
            target = targets.get(code)
            if target:
                ProductRelation.objects.get_or_create(from_product=from_product, to_product=target)

    def _process_attachments_files(self, product, files):
        """✨ Crea attachments a partir de archivos subidos"""
        if not files:
            return
        
        product_ct = ContentType.objects.get_for_model(Product)
        first_image = True

        for file_obj in files:
            if not file_obj:
                continue
                
            role = 'image' if file_obj.content_type and file_obj.content_type.startswith('image/') else 'other'
            
            attachment = Attachment.objects.create(
                file=file_obj,
                role=role,
                content_type_str=file_obj.content_type or 'application/octet-stream',
                content_type=product_ct,
                object_id=product.id,
                attachable_type='product',
                attachable_id=product.id,
                created_by=self.context.get('request').user if self.context.get('request') and self.context.get('request').user.is_authenticated else None
            )
            
            # Solo la primera imagen se asigna como principal si no hay
            if role == 'image' and first_image and not product.image_attachment:
                product.image_attachment = attachment
                product.save()
                first_image = False

    def _sync_attachments(self, product, files_to_add, ids_to_keep):
        """
        ✨ Sincroniza attachments:
        - Si ids_to_keep viene, elimina los NO mencionados
        - Si files_to_add viene, crea nuevos
        """
        # Eliminar attachments que NO están en la lista de "mantener"
        if ids_to_keep is not None:
            ids_to_keep_set = set(str(id) for id in ids_to_keep)
            current_attachments = Attachment.objects.filter(
                attachable_type='product',
                attachable_id=product.id
            )
            for att in current_attachments:
                if str(att.id) not in ids_to_keep_set:
                    # Si era la imagen principal, quitarla
                    if product.image_attachment and product.image_attachment.id == att.id:
                        product.image_attachment = None
                        product.save()
                    # Eliminar archivo físico
                    if att.file:
                        try:
                            att.file.delete()
                        except Exception:
                            pass
                    att.delete()

        # Agregar nuevos archivos
        if files_to_add:
            self._process_attachments_files(product, files_to_add)

    def validate(self, data):
        """
        Validación condicional: brand y category son obligatorios solo si is_active=True.
        """
        is_active = data.get('is_active', True)  # Default es True si no se especifica

        # Si estamos actualizando, verificar el estado actual
        if self.instance:
            # En actualización, si no se especifica is_active, usar el valor actual
            is_active = data.get('is_active', self.instance.is_active)

        # Si el producto está activo, brand y category son obligatorios
        if is_active:
            if not data.get('brand'):
                raise serializers.ValidationError({
                    'brand_id': 'Brand is required for active products'
                })
            if not data.get('category'):
                raise serializers.ValidationError({
                    'category_id': 'Category is required for active products'
                })

        return data

    def create(self, validated_data):
        # handle both related_products (instances via PK) and related_product_codes
        related_codes = validated_data.pop('related_product_codes', None)
        related_instances = validated_data.pop('related_products', None)  # source -> related_products
        # specs_data viene del campo write_only 'specs_data' del serializer
        specs_data = validated_data.pop('specs_data', None)
        
        # ✨ NUEVO: Manejar attachments al crear
        attachments_files = validated_data.pop('attachments_files', None)
        attachments_existing = validated_data.pop('attachments_existing', None)

        product = super().create(validated_data)

        if related_instances:
            for rel_prod in related_instances:
                if rel_prod.pk != product.pk:
                    ProductRelation.objects.get_or_create(from_product=product, to_product=rel_prod)

        if related_codes:
            self._create_relations_by_codes(product, related_codes)

        # Crear especificaciones dinámicas si vienen en payload
        if specs_data:
            for order, spec in enumerate(specs_data):
                spec.pop('id', None)
                spec_product = spec.pop('product', None) or product

                # 🔑 evitar duplicar display_order
                display_order = spec.pop('display_order', order)

                ProductSpecification.objects.create(
                    product=spec_product,
                    display_order=display_order,
                    **spec
                )

        # ✨ NUEVO: Procesar archivos al crear
        if attachments_files or attachments_existing is not None:
            self._sync_attachments(product, attachments_files, attachments_existing)

        return product

    def update(self, instance, validated_data):
        related_codes = validated_data.pop('related_product_codes', None)
        related_instances = validated_data.pop('related_products', None)
        # specs_data viene del campo write_only 'specs_data' del serializer
        specs_data = validated_data.pop('specs_data', None)
        
        # ✨ NUEVO: Manejar attachments al actualizar
        attachments_files = validated_data.pop('attachments_files', None)
        attachments_to_keep = validated_data.pop('attachments_existing', None)

        product = super().update(instance, validated_data)

        if related_instances is not None:
            # sync by PKs
            current_to_ids = set(instance.from_relations.values_list('to_product_id', flat=True))
            new_ids = set([p.pk for p in related_instances if p.pk != instance.pk])
            to_delete = current_to_ids - new_ids
            if to_delete:
                ProductRelation.objects.filter(from_product=instance, to_product_id__in=to_delete).delete()
            for pid in new_ids - current_to_ids:
                ProductRelation.objects.get_or_create(from_product=instance, to_product_id=pid)

        if related_codes is not None:
            # replace relations created_by codes: remove all existing and recreate from codes
            ProductRelation.objects.filter(from_product=instance).delete()
            self._create_relations_by_codes(instance, related_codes)

        # Sincronizar especificaciones dinámicas solo si vienen en el request
        if specs_data is not None:
            existing_specs = {str(s.id): s for s in instance.dynamic_specifications.all()}
            kept_ids = set()

            for order, spec in enumerate(specs_data):
                spec_id = spec.pop('id', None)
                spec_product = spec.pop('product', None) or instance
                display_order = spec.pop('display_order', order)
                payload = {**spec, 'display_order': display_order}

                if spec_id and str(spec_id) in existing_specs:
                    ProductSpecification.objects.filter(
                        id=spec_id,
                        product=instance
                    ).update(**payload)
                    kept_ids.add(str(spec_id))
                else:
                    created = ProductSpecification.objects.create(
                        product=spec_product,
                        **payload
                    )
                    kept_ids.add(str(created.id))

            # eliminar las que no vinieron en payload (permite borrar)
            ProductSpecification.objects.filter(product=instance).exclude(id__in=kept_ids).delete()

        # ✨ NUEVO: Sincronizar attachments solo si vienen en el request
        if attachments_files is not None or attachments_to_keep is not None:
            self._sync_attachments(instance, attachments_files, attachments_to_keep)

        return product