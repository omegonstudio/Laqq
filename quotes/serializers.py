from rest_framework import serializers
from .models import QuoteType, QuoteState, Quote, QuoteItem
from datetime import datetime
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

    def validate_total_amount(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Total amount cannot be negative")
        return value

    def create(self, validated_data):
        # Auto-generate quote_number
        if not validated_data.get('quote_number'):
            year = datetime.now().year
            last_quote = Quote.objects.filter(quote_number__startswith=f'Q-{year}').order_by('-created_at').first()
            if last_quote and last_quote.quote_number:
                try:
                    last_number = int(last_quote.quote_number.split('-')[-1])
                    new_number = last_number + 1
                except (ValueError, IndexError):
                    new_number = 1
            else:
                new_number = 1
            validated_data['quote_number'] = f'Q-{year}-{new_number:05d}'

        # Create quote
        quote = super().create(validated_data)

        # Send email notifications (non-blocking - don't fail if email fails)
        try:
            from .emails import send_quote_created_email
            email_results = send_quote_created_email(quote)
            if email_results['business']:
                logger.info(f"Quote #{quote.quote_number}: Business email sent successfully")
            if email_results['customer']:
                logger.info(f"Quote #{quote.quote_number}: Customer email sent successfully")
            if email_results['errors']:
                for error in email_results['errors']:
                    logger.warning(f"Quote #{quote.quote_number}: {error}")
        except Exception as e:
            # Log error but don't fail the quote creation
            logger.error(f"Quote #{quote.quote_number}: Failed to send emails - {str(e)}")

        return quote