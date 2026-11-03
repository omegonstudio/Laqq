from django.contrib import admin
from .models import QuoteType, QuoteState, Quote, QuoteItem

@admin.register(QuoteType)
class QuoteTypeAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'description', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']

@admin.register(QuoteState)
class QuoteStateAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'color', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']

@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = ['quote_number', 'contact', 'user', 'quote_type', 'state', 'currency', 'total_amount', 'created_at']
    search_fields = ['quote_number', 'message']
    list_filter = ['quote_type', 'state', 'currency', 'user']
    ordering = ['-created_at']

@admin.register(QuoteItem)
class QuoteItemAdmin(admin.ModelAdmin):
    list_display = ['quote', 'product', 'quantity', 'unit_price', 'subtotal', 'created_at']
    search_fields = ['product_name', 'product_code']
    list_filter = ['quote']
    ordering = ['-created_at']
