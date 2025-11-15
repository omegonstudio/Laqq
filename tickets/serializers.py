from rest_framework import serializers
from .models import ServiceTicket

class ServiceTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceTicket
        fields = '__all__'