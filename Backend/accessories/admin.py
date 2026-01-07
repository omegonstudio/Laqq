from django.contrib import admin
from .models import Accessory, ProductAccessory

@admin.register(Accessory)
class AccessoryAdmin(admin.ModelAdmin):
    list_display = ['code', 'brand', 'model', 'category', 'price', 'is_active', 'created_at']
    search_fields = ['code', 'brand', 'model', 'description']
    list_filter = ['is_active', 'category']
    ordering = ['-created_at']

@admin.register(ProductAccessory)
class ProductAccessoryAdmin(admin.ModelAdmin):
    list_display = ['product', 'accessory']
    search_fields = ['product__name', 'accessory__code']
    list_filter = ['product', 'accessory']
