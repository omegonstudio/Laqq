import uuid
import os
from django.conf import settings
from django.db import models
from django.utils.text import get_valid_filename

ROLE_IMAGE = 'image'
ROLE_MANUAL = 'manual'
ROLE_DATASHEET = 'datasheet'
ROLE_OTHER = 'other'

ROLE_CHOICES = [
    (ROLE_IMAGE, 'Image'),
    (ROLE_MANUAL, 'Manual'),
    (ROLE_DATASHEET, 'Datasheet'),
    (ROLE_OTHER, 'Other'),
]

def attachment_upload_to(instance, filename):
    # Sanitiza y evita colisiones prefijando con uuid
    base_name = os.path.basename(filename)
    safe_name = get_valid_filename(base_name)
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    atype = (instance.attachable_type or 'global').replace(' ', '_')
    aid = str(instance.attachable_id) if instance.attachable_id else 'unattached'
    return f'attachments/{atype}/{aid}/{unique_name}'

class Attachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file_name = models.CharField(max_length=255, blank=True)
    content_type = models.CharField(max_length=100, blank=True, null=True)
    size_bytes = models.IntegerField(blank=True, null=True)

    file = models.FileField(upload_to=attachment_upload_to, blank=True, null=True)

    # Clasificación del archivo (imagen/manual/datasheet/otro)
    role = models.CharField(max_length=32, choices=ROLE_CHOICES, blank=True, null=True)

    # mantenemos attachable meta para relaciones genéricas
    attachable_type = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    attachable_id = models.UUIDField(blank=True, null=True, db_index=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, blank=True, null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['attachable_type', 'attachable_id'], name='idx_attachments_attachable'),
            models.Index(fields=['file_name'], name='idx_attachments_file_name'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return self.file_name or str(self.id)

    @property
    def url(self):
        if self.file:
            try:
                return self.file.url
            except Exception:
                return None
        return None

    def save(self, *args, **kwargs):
        # sincroniza file_name/size/content_type con file si está presente
        if self.file:
            self.file_name = os.path.basename(self.file.name)
            try:
                self.size_bytes = self.file.size
            except Exception:
                pass
        super().save(*args, **kwargs)