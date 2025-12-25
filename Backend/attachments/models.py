import uuid
from django.conf import settings
from django.db import models

class Attachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file_name = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100, blank=True, null=True)
    size_bytes = models.IntegerField(blank=True, null=True)
    data = models.BinaryField(blank=True, null=True)
    attachable_type = models.CharField(max_length=100, blank=True, null=True)
    attachable_id = models.UUIDField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, blank=True, null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['attachable_type', 'attachable_id'], name='idx_attachments_attachable'),
            models.Index(fields=['file_name'], name='idx_attachments_file_name'),
        ]

    def __str__(self):
        return self.file_name or str(self.id)