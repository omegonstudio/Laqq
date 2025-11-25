from django.contrib import admin
from .models import ServiceTicket, TicketState, TicketPriority

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
            'fields': ('description', 'attachment')
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
