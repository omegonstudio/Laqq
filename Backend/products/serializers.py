from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator
from django.contrib.contenttypes.models import ContentType
from .models import (
    Brand, Category, Product, ProductVariant, ProductRelation,
    TechnicalSpec, ProductTechnicalSpec, VariantTechnicalSpec,
)
from attachments.models import Attachment
from attachments.serializers import AttachmentSerializer
from drf_yasg import openapi

class BrandSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Brand
        fields = ['id', 'name', 'description', 'logo_attachment', 'logo_url', 'created_at', 'updated_at']
        read_only_fields = ['id', 'logo_url', 'created_at', 'updated_at']

    def get_logo_url(self, obj):
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


class TechnicalSpecSerializer(serializers.ModelSerializer):
    """Serializer para especificaciones técnicas dinámicas (clave-valor)"""

    id = serializers.UUIDField(required=False)

    class Meta:
        model = TechnicalSpec
        fields = ['id', 'key', 'value', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ProductVariantSerializer(serializers.ModelSerializer):
    """Serializer para variantes de producto (code, name, dimensions + specs técnicas propias)"""

    technical_specs = TechnicalSpecSerializer(many=True, required=False)

    class Meta:
        model = ProductVariant
        fields = ['id', 'product', 'code', 'name', 'dimensions', 'technical_specs', 'created_at']
        read_only_fields = ['id', 'created_at']
        validators = [
            UniqueTogetherValidator(
                queryset=ProductVariant.objects.all(),
                fields=['product', 'code'],
                message='Ya existe una variante con este código para este producto.'
            )
        ]

    def _save_specs(self, variant, specs_data, replace=False):
        if replace:
            VariantTechnicalSpec.objects.filter(variant=variant).delete()
        for spec in specs_data:
            spec.pop('id', None)
            tech_spec = TechnicalSpec.objects.create(
                **{k: v for k, v in spec.items() if k in ('key', 'value')}
            )
            VariantTechnicalSpec.objects.create(variant=variant, technical_spec=tech_spec)

    def create(self, validated_data):
        specs_data = validated_data.pop('technical_specs', [])
        variant = super().create(validated_data)
        self._save_specs(variant, specs_data)
        return variant

    def update(self, instance, validated_data):
        specs_data = validated_data.pop('technical_specs', None)
        variant = super().update(instance, validated_data)
        if specs_data is not None:
            self._save_specs(variant, specs_data, replace=True)
        return variant


class ProductRelationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductRelation
        fields = ['id', 'from_product', 'to_product', 'relation_type', 'created_at']
        read_only_fields = ['id', 'created_at']

class SwaggerFriendlyFileField(serializers.FileField):
    class Meta:
        swagger_schema_fields = {
            'type': openapi.TYPE_STRING,
            'format': openapi.FORMAT_BINARY,
        }

class ProductSerializer(serializers.ModelSerializer):
    # Variantes del producto
    variants = ProductVariantSerializer(many=True, read_only=True)

    # Especificaciones técnicas dinámicas del producto (clave-valor)
    specifications = TechnicalSpecSerializer(source='technical_specs', many=True, read_only=True)

    # Escritura de specs técnicas del producto
    specs_data = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True,
        help_text='Array de especificaciones técnicas: [{"key": "Voltaje", "value": "220V", "unit": "V", "display_order": 0, "is_visible": true}]'
    )

    brand = serializers.CharField(source='brand.name', read_only=True)
    brand_id = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(),
        source='brand',
        required=False
    )

    category = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        required=False
    )

    related_product_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Product.objects.all(),
        source='related_products',
        required=False,
        write_only=True
    )

    related_product_codes = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )

    related_products = serializers.SerializerMethodField(read_only=True)
    related = serializers.SerializerMethodField(read_only=True)

    image_url = serializers.SerializerMethodField(read_only=True)
    attachments = serializers.SerializerMethodField(read_only=True)

    attachments_files = serializers.ListField(
        child=serializers.UUIDField(),
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
            'variants', 'specifications', 'specs_data',
            'related_product_ids', 'related_product_codes',
            'related_products', 'related',
            'attachments_files', 'attachments_existing',
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at',
            'related_products', 'variants', 'specifications', 'related', 'image_url', 'attachments',
        ]
        extra_kwargs = {
            'product_code': {'required': False, 'allow_blank': True}
        }
        swagger_schema_fields = {
            "properties": {
                "attachments_files": {
                    "type": "array",
                    "items": {"type": "string", "format": "binary"},
                    "writeOnly": True,
                }
            }
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
        return self.get_related_products(obj)

    def get_image_url(self, obj):
        if obj.image_attachment:
            url = getattr(obj.image_attachment, 'url', None)
            request = self.context.get('request')
            if url and request:
                return request.build_absolute_uri(url)
            return url
        return None

    def get_attachments(self, obj):
        qs = Attachment.objects.filter(attachable_type='product', attachable_id=obj.id).order_by('-created_at')
        return AttachmentSerializer(qs, many=True, context=self.context).data

    def _create_relations_by_codes(self, from_product, codes):
        if not codes:
            return
        targets = {p.product_code: p for p in Product.objects.filter(product_code__in=codes)}
        for code in codes:
            if code == from_product.product_code:
                continue
            target = targets.get(code)
            if target:
                ProductRelation.objects.get_or_create(from_product=from_product, to_product=target)

    def _process_attachments_files(self, product, files):
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

            if role == 'image' and first_image and not product.image_attachment:
                product.image_attachment = attachment
                product.save()
                first_image = False

    def _sync_attachments(self, product, files_to_add, ids_to_keep):
        if ids_to_keep is not None:
            ids_to_keep_set = set(str(id) for id in ids_to_keep)
            current_attachments = Attachment.objects.filter(
                attachable_type='product',
                attachable_id=product.id
            )
            for att in current_attachments:
                if str(att.id) not in ids_to_keep_set:
                    if product.image_attachment and product.image_attachment.id == att.id:
                        product.image_attachment = None
                        product.save()
                    if att.file:
                        try:
                            att.file.delete()
                        except Exception:
                            pass
                    att.delete()

        if files_to_add:
            self._process_attachments_files(product, files_to_add)

    def validate(self, data):
        is_active = data.get('is_active', True)

        if self.instance:
            is_active = data.get('is_active', self.instance.is_active)

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
        related_codes = validated_data.pop('related_product_codes', None)
        related_instances = validated_data.pop('related_products', None)
        specs_data = validated_data.pop('specs_data', None)
        attachments_files = validated_data.pop('attachments_files', None)
        attachments_existing = validated_data.pop('attachments_existing', None)

        product = super().create(validated_data)

        if related_instances:
            for rel_prod in related_instances:
                if rel_prod.pk != product.pk:
                    ProductRelation.objects.get_or_create(from_product=product, to_product=rel_prod)

        if related_codes:
            self._create_relations_by_codes(product, related_codes)

        if specs_data:
            for spec in specs_data:
                spec.pop('id', None)
                spec.pop('product', None)
                tech_spec = TechnicalSpec.objects.create(**spec)
                ProductTechnicalSpec.objects.create(product=product, technical_spec=tech_spec)

        if attachments_files or attachments_existing is not None:
            self._sync_attachments(product, attachments_files, attachments_existing)

        return product

    def update(self, instance, validated_data):
        related_codes = validated_data.pop('related_product_codes', None)
        related_instances = validated_data.pop('related_products', None)
        specs_data = validated_data.pop('specs_data', None)
        attachments_files = validated_data.pop('attachments_files', None)
        attachments_to_keep = validated_data.pop('attachments_existing', None)

        product = super().update(instance, validated_data)

        if related_instances is not None:
            current_to_ids = set(instance.from_relations.values_list('to_product_id', flat=True))
            new_ids = set([p.pk for p in related_instances if p.pk != instance.pk])
            to_delete = current_to_ids - new_ids
            if to_delete:
                ProductRelation.objects.filter(from_product=instance, to_product_id__in=to_delete).delete()
            for pid in new_ids - current_to_ids:
                ProductRelation.objects.get_or_create(from_product=instance, to_product_id=pid)

        if related_codes is not None:
            ProductRelation.objects.filter(from_product=instance).delete()
            self._create_relations_by_codes(instance, related_codes)

        if specs_data is not None:
            existing_links = {
                str(link.technical_spec.id): link
                for link in instance.product_technical_specs.select_related('technical_spec')
            }
            kept_ids = set()

            for spec in specs_data:
                spec_id = spec.pop('id', None)
                spec.pop('product', None)
                payload = {k: v for k, v in spec.items() if k in ('key', 'value')}

                if spec_id and str(spec_id) in existing_links:
                    TechnicalSpec.objects.filter(id=spec_id).update(**payload)
                    kept_ids.add(str(spec_id))
                else:
                    tech_spec = TechnicalSpec.objects.create(**payload)
                    ProductTechnicalSpec.objects.create(product=instance, technical_spec=tech_spec)
                    kept_ids.add(str(tech_spec.id))

            # Eliminar specs que no vinieron en el payload
            for spec_id, link in existing_links.items():
                if spec_id not in kept_ids:
                    link.technical_spec.delete()  # cascade elimina el link también

        if attachments_files is not None or attachments_to_keep is not None:
            self._sync_attachments(instance, attachments_files, attachments_to_keep)

        return product
