from rest_framework import serializers
from .models import ContactState, Contact, Message

class ContactStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactState
        fields = '__all__'

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'