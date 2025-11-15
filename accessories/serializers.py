from rest_framework import serializers
from .models import Accessory, ProductAccessory

class AccessorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Accessory
        fields = '__all__'

class ProductAccessorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductAccessory
        fields = '__all__'