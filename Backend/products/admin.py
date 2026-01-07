from django.contrib import admin, messages
from django.contrib.contenttypes.admin import GenericTabularInline
from django.conf import settings
from django.urls import path
from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.middleware.csrf import get_token
from django.utils.safestring import mark_safe

from .models import Brand, Category, Product, ProductSpec, ProductRelation
from .forms import CSVUploadForm
from .importer import import_products_csv

from attachments.models import Attachment

class ProductRelationInline(admin.TabularInline):
    model = ProductRelation
    fk_name = 'from_product'
    extra = 1
    verbose_name = "Producto Relacionado"
    verbose_name_plural = "Productos Relacionados"


class ProductSpecificationInline(admin.TabularInline):
    model = ProductSpecification
    extra = 1
    fields = ['key', 'value', 'unit', 'display_order', 'is_visible']
    ordering = ['display_order', 'key']
    verbose_name = "Especificación Dinámica"
    verbose_name_plural = "Especificaciones Dinámicas"


class AttachmentInline(GenericTabularInline):
    """
    Inline para gestionar múltiples attachments de un producto.
    Funciona como las Especificaciones Dinámicas con tabla + botón "Agregar otro/a".
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
    inlines = [ProductSpecificationInline, AttachmentInline, ProductRelationInline]
    search_fields = ['product_code', 'name', 'description']
    list_filter = ['brand', 'category', 'is_active']
    ordering = ['-created_at']

    change_list_template = "admin/products/change_list.html"

    # Ocultar el campo image_attachment del formulario (ahora se gestiona via inline)
    exclude = ['image_attachment']

    def get_urls(self):
        """Solo mantener la URL para bulk upload CSV"""
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

    def save_formset(self, request, form, formset, change):
        """Setear created_by y campos legacy automáticamente al guardar attachments"""
        instances = formset.save(commit=False)
        for instance in instances:
            # Solo procesar si es un Attachment
            if isinstance(instance, Attachment):
                if not instance.created_by:
                    instance.created_by = request.user if request.user.is_authenticated else None
                # Poblar campos legacy para compatibilidad con serializers
                if not instance.attachable_type:
                    instance.attachable_type = 'product'
                if not instance.attachable_id and instance.object_id:
                    instance.attachable_id = instance.object_id
            instance.save()
        formset.save_m2m()

@admin.register(ProductSpec)
class ProductSpecAdmin(admin.ModelAdmin):
    list_display = ['code', 'product', 'volume', 'dimensions', 'created_at']
    search_fields = ['code', 'volume']
    list_filter = ['product']
    ordering = ['-created_at']