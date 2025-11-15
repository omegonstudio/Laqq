from rest_framework import serializers
from .models import QuoteType, QuoteState, Quote, QuoteItem

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

class QuoteSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True, read_only=True, source='quoteitem_set')
    class Meta:
        model = Quote
        fields = '__all__'