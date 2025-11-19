from django.contrib import admin
from .models import Attachment

@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'content_type', 'size_bytes', 'attachable_type', 'created_by', 'created_at']
    search_fields = ['file_name', 'attachable_type']
    list_filter = ['content_type', 'attachable_type', 'created_by']
    ordering = ['-created_at']
