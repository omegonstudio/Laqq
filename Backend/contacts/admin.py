from django.contrib import admin
from .models import ContactState, Contact, Message

@admin.register(ContactState)
class ContactStateAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'color', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ['company_name', 'first_name', 'last_name', 'email', 'state', 'assigned_user', 'created_at']
    search_fields = ['company_name', 'first_name', 'last_name', 'email', 'phone']
    list_filter = ['state', 'assigned_user', 'country']
    ordering = ['-created_at']

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['company_name', 'first_name', 'last_name', 'email', 'phone', 'state', 'assigned_user', 'created_at']
    search_fields = ['company_name', 'first_name', 'last_name', 'email', 'phone', 'message']
    list_filter = ['state', 'assigned_user']
    ordering = ['-created_at']
