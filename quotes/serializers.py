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