from django.contrib import admin, messages
from django.urls import path
from django.shortcuts import render
from django.http import JsonResponse, HttpResponseNotFound
from django.conf import settings

from .models import Brand, Category, Product, ProductSpec, ProductRelation
from .forms import CSVUploadForm
from .importer import import_products_csv

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

    change_list_template = "admin/products/change_list.html"

    def get_urls(self):
        urls = super().get_urls()
        my_urls = [
            path('bulk-upload/', self.admin_site.admin_view(self.bulk_upload_view), name='products_bulk_upload'),
        ]
        return my_urls + urls

    def bulk_upload_view(self, request):
        """
        Vista admin para subir CSV. Si la petición es AJAX (X-Requested-With),
        devuelve JsonResponse con el resumen o con el error.
        """
        is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest'

        try:
            print(f"[BULK-UPLOAD] bulk_upload_view called - method={request.method} ajax={is_ajax}", flush=True)
        except Exception:
            pass

        if request.method == 'POST':
            form = CSVUploadForm(request.POST, request.FILES)
            if not form.is_valid():
                if is_ajax:
                    return JsonResponse({'ok': False, 'errors': form.errors}, status=400)
                messages.error(request, f'Formulario inválido: {form.errors}')
                return render(request, 'admin/products/import_products.html', {'form': form})

            csv_file = form.cleaned_data['csv_file']
            encoding = form.cleaned_data.get('encoding') or 'utf-8'
            create_missing = form.cleaned_data.get('create_missing', True)
            skip_downloads = form.cleaned_data.get('skip_downloads', False)

            try:
                summary = import_products_csv(csv_file, encoding=encoding, create_missing=create_missing, skip_downloads=skip_downloads)
                if is_ajax:
                    return JsonResponse({'ok': True, 'summary': summary}, status=200)
                messages.success(request, 'Importación finalizada.')
                return render(request, 'admin/products/import_products.html', {'summary': summary, 'form': form})
            except Exception as e:
                import traceback, sys
                tb = traceback.format_exc()
                print("[BULK-UPLOAD] Exception in importer:", tb, file=sys.stderr, flush=True)
                if is_ajax:
                    payload = {'ok': False, 'error': str(e)}
                    if settings.DEBUG:
                        payload['traceback'] = tb
                    return JsonResponse(payload, status=500)
                messages.error(request, f'Ocurrió un error durante la importación: {str(e)}')
                context = {'form': form, 'error': str(e)}
                if settings.DEBUG:
                    context['traceback'] = tb
                return render(request, 'admin/products/import_products.html', context)

        # GET
        form = CSVUploadForm()
        return render(request, 'admin/products/import_products.html', {'form': form})

@admin.register(ProductSpec)
class ProductSpecAdmin(admin.ModelAdmin):
    list_display = ['code', 'product', 'volume', 'dimensions', 'created_at']
    search_fields = ['code', 'volume']
    list_filter = ['product']
    ordering = ['-created_at']