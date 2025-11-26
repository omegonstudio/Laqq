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
        
class ProductRelationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductRelation
        fields = ['id', 'from_product', 'to_product', 'relation_type', 'created_at']
        read_only_fields = ['id', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    specs = ProductSpecSerializer(source='productspec_set', many=True, read_only=True)
    # aceptamos una lista de UUIDs para productos relacionados
    related_product_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Product.objects.all(),
        source='related_products',
        required=False,
        write_only=True
    )
    related_products = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand', 'category', 'description',
            'image_attachment', 'is_active', 'created_at', 'updated_at',
            'specs', 'related_product_ids', 'related_products'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'related_products']

    def get_related_products(self, obj):
        # devolver una lista simple de dicts con id, name
        return [{'id': str(r.to_product.id), 'name': r.to_product.name, 'relation_type': r.relation_type}
                for r in obj.from_relations.select_related('to_product').all()]

    def create(self, validated_data):
        related = validated_data.pop('related_products', None)  # source -> related_products
        product = super().create(validated_data)
        if related:
            # crear relaciones evitando duplicados/autorreferencias
            for rel_prod in related:
                if rel_prod.pk != product.pk:
                    ProductRelation.objects.get_or_create(from_product=product, to_product=rel_prod)
        return product

    def update(self, instance, validated_data):
        related = validated_data.pop('related_products', None)
        product = super().update(instance, validated_data)
        if related is not None:
            # sincronizar: borrar relaciones que no están y agregar faltantes
            current_to_ids = set(instance.from_relations.values_list('to_product_id', flat=True))
            new_ids = set([p.pk for p in related if p.pk != instance.pk])
            # borrar los que ya no están
            to_delete = current_to_ids - new_ids
            if to_delete:
                ProductRelation.objects.filter(from_product=instance, to_product_id__in=to_delete).delete()
            # crear nuevos
            for pid in new_ids - current_to_ids:
                ProductRelation.objects.get_or_create(from_product=instance, to_product_id=pid)
        return product
