from rest_framework import serializers
from .models import Attachment, ROLE_IMAGE, ROLE_MANUAL, ROLE_DATASHEET, ROLE_OTHER

class AttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Attachment
        fields = [
            'id', 'file_name', 'content_type', 'size_bytes', 'file', 'url',
            'role', 'attachable_type', 'attachable_id', 'created_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'url', 'size_bytes', 'file_name', 'created_by']

    def get_url(self, obj):
        request = self.context.get('request')
        url = obj.url
        if not url:
            return None
        if request is not None:
            return request.build_absolute_uri(url)
        return url

    def validate_role(self, value):
        # si quieres más reglas, agrégalas aquí
        return value