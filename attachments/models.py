from django.db import models
from django.contrib.auth.models import User
import uuid

class Attachment(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    file_name = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100, blank=True, null=True)
    size_bytes = models.IntegerField(blank=True, null=True)
    data = models.BinaryField(blank=True, null=True)
    attachable_type = models.CharField(max_length=100, blank=True, null=True)
    attachable_id = models.UUIDField(blank=True, null=True)
    created_by = models.ForeignKey(User, blank=True, null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)