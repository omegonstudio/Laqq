from django.contrib import admin
from .models import QuoteType, QuoteState, Quote, QuoteItem, QuoteTrace, QuoteVersion


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


class QuoteTraceInline(admin.TabularInline):
    model = QuoteTrace
    extra = 0
    readonly_fields = ['reason', 'actor', 'snapshot', 'created_at']
    can_delete = False


class QuoteVersionInline(admin.TabularInline):
    model = QuoteVersion
    extra = 0
    readonly_fields = [
        'version_number', 'version_label', 'reason', 'actor', 'pdf', 'created_at',
    ]
    can_delete = False


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display = [
        'quote_number', 'contact', 'user', 'quote_type', 'state',
        'currency', 'total_amount', 'managed_at', 'created_at',
    ]
    search_fields = ['quote_number', 'message']
    list_filter = ['quote_type', 'state', 'currency', 'user']
    ordering = ['-created_at']
    inlines = [QuoteVersionInline, QuoteTraceInline]


@admin.register(QuoteItem)
class QuoteItemAdmin(admin.ModelAdmin):
    list_display = ['quote', 'product', 'quantity', 'unit_price', 'subtotal', 'created_at']
    search_fields = ['product_name', 'product_code']
    list_filter = ['quote']
    ordering = ['-created_at']


@admin.register(QuoteTrace)
class QuoteTraceAdmin(admin.ModelAdmin):
    list_display = ['quote', 'reason', 'actor', 'created_at']
    list_filter = ['reason', 'created_at']
    search_fields = ['quote__quote_number']
    ordering = ['-created_at']
    readonly_fields = ['quote', 'reason', 'actor', 'snapshot', 'created_at']


@admin.register(QuoteVersion)
class QuoteVersionAdmin(admin.ModelAdmin):
    list_display = [
        'version_label', 'quote', 'version_number', 'reason', 'actor', 'created_at',
    ]
    list_filter = ['reason', 'created_at']
    search_fields = ['version_label', 'quote__quote_number']
    ordering = ['-created_at']
    readonly_fields = [
        'quote', 'version_number', 'version_label', 'reason',
        'actor', 'snapshot', 'pdf', 'created_at',
    ]
