from django import forms
from django.contrib import admin, messages
from django.utils.translation import gettext_lazy as _
from django.utils.safestring import mark_safe
import mimetypes

from .models import Attachment

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB


class AttachmentAdminForm(forms.ModelForm):
    # Campo de subida visible sólo en el admin; no persiste directamente en el modelo salvo que lo copiemos en save()
    uploaded_file = forms.FileField(
        required=False,
        label=_("Archivo"),
        help_text=_("Sube imagen o documento. Máx 10 MB.")
    )

    class Meta:
        model = Attachment
        # incluir todos los campos del modelo para edición manual si se desea
        fields = '__all__'

    def clean_uploaded_file(self):
        f = self.cleaned_data.get('uploaded_file')
        if f:
            if f.size > MAX_UPLOAD_SIZE:
                raise forms.ValidationError(
                    _("El archivo excede el tamaño máximo permitido (10 MB).")
                )
        return f

    def save(self, commit=True):
        """
        Rellena los metadatos y el campo `file` a partir del uploaded_file.
        Si no se sube archivo, no modifica file ni metadatos relacionados.
        """
        instance = super().save(commit=False)
        uploaded = self.cleaned_data.get('uploaded_file')
        if uploaded:
            # Asignar archivo al FileField; Django maneja UploadedFile
            instance.file = uploaded

            # Nombre y tamaño
            instance.file_name = uploaded.name
            instance.size_bytes = uploaded.size

            # Content type: preferir attribute del uploaded, sino inferir por mimetypes
            ct = getattr(uploaded, 'content_type', None) or mimetypes.guess_type(uploaded.name)[0]
            instance.content_type = ct

        if commit:
            instance.save()
            try:
                self.save_m2m()
            except Exception:
                pass
        return instance


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    form = AttachmentAdminForm

    list_display = ['file_name', 'role', 'content_type', 'size_bytes', 'attachable_type', 'attachable_id', 'created_by', 'created_at']
    search_fields = ['file_name', 'attachable_type', 'attachable_id', 'role']
    list_filter = ['content_type', 'attachable_type', 'created_by', 'role']
    ordering = ['-created_at']

    readonly_fields = ('size_bytes', 'content_type', 'created_at', 'file_preview')

    fieldsets = (
        (None, {
            'fields': ('uploaded_file', 'file', 'file_name', 'role', 'attachable_type', 'attachable_id', 'created_by')
        }),
        ('Metadata', {
            'fields': ('size_bytes', 'content_type', 'created_at', 'file_preview'),
        }),
    )

    def save_model(self, request, obj, form, change):
        """
        Usar form.save(commit=False) => el form ya habrá asignado file / metadata desde uploaded_file.
        Asignar created_by si corresponde y guardar.
        """
        instance = form.save(commit=False)

        # Asignar created_by si no existe (útil en creación desde admin)
        if not instance.created_by:
            instance.created_by = request.user

        instance.save()
        try:
            form.save_m2m()
        except Exception:
            pass

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
        if url and obj.content_type and obj.content_type.startswith('image/'):
            return mark_safe(f'<img src="{url}" style="max-height:150px; max-width:300px;"/>')
        if url:
            return mark_safe(f'<a href="{url}" target="_blank">Ver archivo</a>')
        return ''
    file_preview.short_description = 'Preview'