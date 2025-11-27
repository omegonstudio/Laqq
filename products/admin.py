from django.contrib import admin
from .models import Brand, Category, Product, ProductSpec, ProductRelation

class ProductRelationInline(admin.TabularInline):
    model = ProductRelation
    fk_name = 'from_product'
    extra = 1

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'display_order', 'created_at']
    search_fields = ['name', 'description']
    list_filter = ['parent']
    ordering = ['display_order', 'name']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['product_code', 'name', 'brand', 'category', 'is_active', 'created_at']
    inlines = [ProductRelationInline]
    search_fields = ['product_code', 'name', 'description']
    list_filter = ['brand', 'category', 'is_active']
    ordering = ['-created_at']

@admin.register(ProductSpec)
class ProductSpecAdmin(admin.ModelAdmin):
    list_display = ['code', 'product', 'volume', 'dimensions', 'created_at']
    search_fields = ['code', 'volume']
    list_filter = ['product']
    ordering = ['-created_at']