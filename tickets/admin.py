from django.contrib import admin
from .models import ServiceTicket

@admin.register(ServiceTicket)
class ServiceTicketAdmin(admin.ModelAdmin):
    list_display = ['ticket_number', 'contact', 'product_name', 'state', 'assigned_user', 'created_at']
    search_fields = ['ticket_number', 'product_name', 'description']
    list_filter = ['state', 'assigned_user']
    ordering = ['-created_at']
