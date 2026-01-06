from rest_framework import serializers
from .models import Brand, Category, Product, ProductSpec, ProductRelation, ProductSpecification
from attachments.models import Attachment
from attachments.serializers import AttachmentSerializer

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSpecSerializer(serializers.ModelSerializer):
    """Serializer para especificaciones FIJAS (campos predefinidos)"""
    class Meta:
        model = ProductSpec
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class ProductSpecificationSerializer(serializers.ModelSerializer):
    """Serializer para especificaciones DINÁMICAS (clave-valor)"""
    class Meta:
        model = ProductSpecification
        fields = ['id', 'key', 'value', 'unit', 'display_order', 'is_visible', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

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

    # Brand as name for reading, ID for writing
    brand = serializers.CharField(source='brand.name', read_only=True)
    brand_id = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(),
        source='brand',
        write_only=True,
        required=False
    )

    # Category as name for reading, ID for writing
    category = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
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

    # Mantengo image_attachment como FK (imagen principal opcional)
    image_url = serializers.SerializerMethodField(read_only=True)

    # Nuevo: lista de attachments asociados al producto (read-only)
    attachments = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'product_code', 'name', 'brand', 'brand_id', 'category', 'category_id', 'description',
            'image_attachment', 'image_url', 'attachments', 'is_active', 'created_at', 'updated_at',
            'fixed_specs', 'specifications', 'related_product_ids', 'related_product_codes', 'related_products'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'related_products', 'fixed_specs', 'specifications', 'image_url', 'attachments']
        extra_kwargs = {
            'product_code': {'required': False, 'allow_blank': True}
        }

    def get_related_products(self, obj):
        return [{'id': str(r.to_product.id), 'product_code': r.to_product.product_code, 'name': r.to_product.name, 'relation_type': r.relation_type}
                for r in obj.from_relations.select_related('to_product').all()]

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

    def create(self, validated_data):
        # handle both related_products (instances via PK) and related_product_codes
        related_codes = validated_data.pop('related_product_codes', None)
        related_instances = validated_data.pop('related_products', None)  # source -> related_products

        product = super().create(validated_data)

        if related_instances:
            for rel_prod in related_instances:
                if rel_prod.pk != product.pk:
                    ProductRelation.objects.get_or_create(from_product=product, to_product=rel_prod)

        if related_codes:
            self._create_relations_by_codes(product, related_codes)

        return product

    def update(self, instance, validated_data):
        related_codes = validated_data.pop('related_product_codes', None)
        related_instances = validated_data.pop('related_products', None)

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

        return product