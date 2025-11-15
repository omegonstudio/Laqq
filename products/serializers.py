from rest_framework import serializers
from .models import Brand, Category, Product, ProductSpec

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

class ProductSerializer(serializers.ModelSerializer):
    specs = ProductSpecSerializer(many=True, read_only=True, source='productspec_set')
    class Meta:
        model = Product
        fields = '__all__'