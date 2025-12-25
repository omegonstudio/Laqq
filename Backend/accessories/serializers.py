from rest_framework import serializers
from .models import Accessory, ProductAccessory

class AccessorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Accessory
        fields = '__all__'

    def validate_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Price cannot be negative")
        return value

    def validate_code(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Code must be at least 3 characters long")
        return value

class ProductAccessorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductAccessory
        fields = '__all__'