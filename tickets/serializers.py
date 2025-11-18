from rest_framework import serializers
from .models import ServiceTicket
from datetime import datetime

class ServiceTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceTicket
        fields = '__all__'
        read_only_fields = ['ticket_number']

    def validate_description(self, value):
        if len(value.strip()) < 20:
            raise serializers.ValidationError("Description must be at least 20 characters long")
        return value

    def create(self, validated_data):
        # Auto-generate ticket_number
        if not validated_data.get('ticket_number'):
            year = datetime.now().year
            last_ticket = ServiceTicket.objects.filter(ticket_number__startswith=f'T-{year}').order_by('-created_at').first()
            if last_ticket and last_ticket.ticket_number:
                try:
                    last_number = int(last_ticket.ticket_number.split('-')[-1])
                    new_number = last_number + 1
                except (ValueError, IndexError):
                    new_number = 1
            else:
                new_number = 1
            validated_data['ticket_number'] = f'T-{year}-{new_number:05d}'
        return super().create(validated_data)