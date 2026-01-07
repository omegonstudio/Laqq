from django.contrib import admin
from django.contrib.contenttypes.admin import GenericTabularInline
from .models import ServiceTicket, TicketState, TicketPriority
from attachments.models import Attachment


class AttachmentInline(GenericTabularInline):
    """
    Inline para gestionar múltiples attachments de un ticket.
    Funciona como tabla con botón "Agregar otro/a Archivo Adjunto".
    """
    model = Attachment
    extra = 1
    fields = ['file', 'role', 'file_name', 'size_bytes', 'created_at']
    readonly_fields = ['file_name', 'size_bytes', 'created_at']
    can_delete = True
    verbose_name = "Archivo Adjunto"
    verbose_name_plural = "Archivos Adjuntos"

    # Configurar campos de la relación genérica (usa los nuevos campos)
    ct_field = 'content_type'
    ct_fk_field = 'object_id'

    # Excluir campos que se setean automáticamente
    exclude = ['created_by', 'content_type_str', 'attachable_type', 'attachable_id']

    def save_formset(self, request, form, formset, change):
        """Setear created_by y campos legacy automáticamente al guardar"""
        instances = formset.save(commit=False)
        for instance in instances:
            if not instance.created_by:
                instance.created_by = request.user if request.user.is_authenticated else None
            # Poblar campos legacy para compatibilidad con serializers
            if not instance.attachable_type:
                instance.attachable_type = 'ServiceTicket'
            if not instance.attachable_id and instance.object_id:
                instance.attachable_id = instance.object_id
            instance.save()
        formset.save_m2m()

@admin.register(TicketState)
class TicketStateAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'color', 'is_final', 'created_at']
    search_fields = ['name', 'description']
    list_filter = ['is_final']
    ordering = ['name']

@admin.register(TicketPriority)
class TicketPriorityAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'level', 'color', 'created_at']
    search_fields = ['name', 'description']
    list_filter = ['level']
    ordering = ['-level']

@admin.register(ServiceTicket)
class ServiceTicketAdmin(admin.ModelAdmin):
    list_display = [
        'ticket_number',
        'contact',
        'product_name',
        'state',
        'priority',
        'assigned_user',
        'created_at',
        'closed_at'
    ]
    search_fields = ['ticket_number', 'product_name', 'description', 'resolution_notes']
    list_filter = ['state', 'priority', 'assigned_user', 'created_at']
    ordering = ['-created_at']
    inlines = [AttachmentInline]
    readonly_fields = [
        'ticket_number',
        'created_at',
        'updated_at',
        'assigned_at',
        'started_at',
        'resolved_at',
        'closed_at'
    ]
    fieldsets = (
        ('Información básica', {
            'fields': ('ticket_number', 'contact', 'product', 'product_name')
        }),
        ('Descripción del problema', {
            'fields': ('description',)
        }),
        ('Estado y prioridad', {
            'fields': ('state', 'priority', 'assigned_user')
        }),
        ('Resolución', {
            'fields': ('resolution_notes',)
        }),
        ('Fechas de seguimiento', {
            'fields': (
                'created_at',
                'assigned_at',
                'started_at',
                'resolved_at',
                'closed_at',
                'updated_at'
            ),
            'classes': ('collapse',)
        }),
    )
