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

    ct_field = 'content_type'
    ct_fk_field = 'object_id'
    exclude = ['created_by', 'content_type_str', 'attachable_type', 'attachable_id']

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

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for instance in instances:
            if isinstance(instance, Attachment):
                if not instance.created_by:
                    instance.created_by = request.user if request.user.is_authenticated else None
                instance.attachable_type = 'ServiceTicket'
                instance.attachable_id = formset.instance.pk
            instance.save()
        for obj in formset.deleted_objects:
            obj.delete()
        formset.save_m2m()

        # Auto-set ticket.attachment si es el primer attachment
        ticket = formset.instance
        if not ticket.attachment_id:
            first_att = Attachment.objects.filter(
                attachable_type='ServiceTicket',
                attachable_id=ticket.pk
            ).order_by('created_at').first()
            if first_att:
                ticket.attachment = first_att
                ticket.save()
