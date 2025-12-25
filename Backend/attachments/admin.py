from django import forms
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
import mimetypes

from .models import Attachment

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB


class AttachmentAdminForm(forms.ModelForm):
    # Campo de subida visible sólo en el admin; no persiste directamente en el modelo
    uploaded_file = forms.FileField(
        required=False,
        label=_("Archivo"),
        help_text=_("Sube imagen o documento. Máx 10 MB.")
    )

    class Meta:
        model = Attachment
        # Excluir el campo `data` (binario) del formulario; el form se encargará de poblarlo al guardar.
        exclude = ('data',)

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
        Rellena los metadatos y el campo `data` a partir del uploaded_file.
        Si no se sube archivo, no modifica data ni metadatos relacionados.
        """
        instance = super().save(commit=False)
        uploaded = self.cleaned_data.get('uploaded_file')
        if uploaded:
            # Nombre y tamaño
            instance.file_name = uploaded.name
            instance.size_bytes = uploaded.size

            # Content type: preferir attribute del uploaded, sino inferir por mimetypes
            ct = getattr(uploaded, 'content_type', None) or mimetypes.guess_type(uploaded.name)[0]
            instance.content_type = ct

            # Leer binario
            try:
                # uploaded.read() devuelve bytes
                instance.data = uploaded.read()
            except Exception:
                # No romper el guardado si hay un error de lectura, pero preferible que falle durante save en admin
                instance.data = None

        if commit:
            instance.save()
        return instance


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    form = AttachmentAdminForm

    list_display = ['file_name', 'content_type', 'size_bytes', 'attachable_type', 'created_by', 'created_at']
    search_fields = ['file_name', 'attachable_type']
    list_filter = ['content_type', 'attachable_type', 'created_by']
    ordering = ['-created_at']

    readonly_fields = ('size_bytes', 'content_type', 'created_at')

    def save_model(self, request, obj, form, change):
        """
        El admin llama a form.save(commit=False) antes de save_model; sin embargo aquí forzamos la
        combinación segura: usamos form.save(commit=False) para obtener la instancia ya preparada,
        asignamos created_by si corresponde y guardamos.
        """
        # form.save(commit=False) o form.save(commit=True) — queremos el instance sin guardar aún
        instance = form.save(commit=False)

        # Asignar created_by si no existe (útil en creación desde admin)
        if not instance.created_by:
            instance.created_by = request.user

        # Guardar la instancia final
        instance.save()

        # Guardar m2m si los hubiera (no aplican aquí, pero por compatibilidad)
        try:
            form.save_m2m()
        except Exception:
            pass

    # Opcional: mostrar un enlace de vista previa en el admin (si es imagen)
    def file_preview(self, obj):
        if obj and obj.content_type and obj.content_type.startswith('image/') and obj.data:
            return f'<img src="/attachments/{obj.id}/preview/" style="max-height:100px;"/>'
        return ''
    file_preview.allow_tags = True
    file_preview.short_description = 'Preview'