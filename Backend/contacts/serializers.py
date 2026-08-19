from rest_framework import serializers
from .models import ContactState, Contact, Message
import re

class ContactStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactState
        fields = '__all__'

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'

    def validate_email(self, value):
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, value):
            raise serializers.ValidationError("Invalid email format")
        return value

    def validate_phone(self, value):
        if value and len(value) < 7:
            raise serializers.ValidationError("Phone number must be at least 7 characters")
        return value

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'

    def _require_text(self, value):
        if value is None or not str(value).strip():
            raise serializers.ValidationError("This field is required")
        return str(value).strip()

    def validate_first_name(self, value):
        return self._require_text(value)

    def validate_last_name(self, value):
        return self._require_text(value)

    def validate_email(self, value):
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not value or not re.match(email_regex, value):
            raise serializers.ValidationError("Invalid email format")
        return value

    def validate_phone(self, value):
        if not value or len(str(value).strip()) < 7:
            raise serializers.ValidationError("Phone number must be at least 7 characters")
        return str(value).strip()

    def validate_message(self, value):
        if not value or len(value.strip()) < 10:
            raise serializers.ValidationError("Message must be at least 10 characters long")
        return value