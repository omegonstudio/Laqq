from rest_framework import serializers
from .models import Brand, Category, Product, ProductSpec, ProductRelation

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSpecSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSpec
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

class ProductRelationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductRelation
        fields = ['id', 'from_product', 'to_product', 'relation_type', 'created_at']
        read_only_fields = ['id', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    specs = ProductSpecSerializer(source='productspec_set', many=True, read_only=True)

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

    class Meta:
        model = Product
        fields = [
            'id', 'product_code', 'name', 'brand', 'category', 'description',
            'image_attachment', 'is_active', 'created_at', 'updated_at',
            'specs', 'related_product_ids', 'related_product_codes', 'related_products'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'related_products']

    def get_related_products(self, obj):
        return [{'id': str(r.to_product.id), 'product_code': r.to_product.product_code, 'name': r.to_product.name, 'relation_type': r.relation_type}
                for r in obj.from_relations.select_related('to_product').all()]

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