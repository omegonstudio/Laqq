from django.contrib import admin
from django.utils.safestring import mark_safe

from .models import Attachment


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'role', 'content_type_str', 'size_bytes', 'attachable_type', 'attachable_id', 'created_by', 'created_at']
    search_fields = ['file_name', 'attachable_type', 'attachable_id', 'role']
    list_filter = ['content_type_str', 'attachable_type', 'created_by', 'role']
    ordering = ['-created_at']

    readonly_fields = ('size_bytes', 'content_type_str', 'created_at', 'file_preview')

    fieldsets = (
        (None, {
            'fields': ('file', 'file_name', 'role', 'attachable_type', 'attachable_id', 'created_by')
        }),
        ('Metadata', {
            'fields': ('size_bytes', 'content_type_str', 'created_at', 'file_preview'),
        }),
    )

    def save_model(self, request, obj, form, change):
        """
        Asignar created_by si no existe (útil en creación desde admin).
        Los metadatos del archivo se manejan automáticamente en el modelo.
        """
        if not obj.created_by:
            obj.created_by = request.user
        obj.save()

    def file_preview(self, obj):
        """
        Muestra preview si es imagen y existe file.url
        """
        if not obj or not getattr(obj, 'file', None):
            return ''
        try:
            url = obj.file.url
        except Exception:
            url = None
        if url and obj.content_type_str and obj.content_type_str.startswith('image/'):
            return mark_safe(f'<img src="{url}" style="max-height:150px; max-width:300px;"/>')
        if url:
            return mark_safe(f'<a href="{url}" target="_blank">Ver archivo</a>')
        return ''
    file_preview.short_description = 'Preview'