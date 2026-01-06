from django.contrib import admin, messages
from django.urls import path
from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.middleware.csrf import get_token
from django.utils.safestring import mark_safe

from .models import Brand, Category, Product, ProductSpec, ProductRelation, ProductSpecification
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
    inlines = [ProductSpecificationInline, ProductRelationInline]
    search_fields = ['product_code', 'name', 'description']
    list_filter = ['brand', 'category', 'is_active']
    ordering = ['-created_at']

    change_list_template = "admin/products/change_list.html"

    # Mostrar attachments en la página de cambio como campo readonly
    readonly_fields = ('attachments_inline',)

    def get_urls(self):
        urls = super().get_urls()
        my_urls = [
            path('bulk-upload/', self.admin_site.admin_view(self.bulk_upload_view), name='products_bulk_upload'),
            # ruta para upload desde la interfaz de change form: /admin/<app>/<model>/<uuid>/upload-attachment/
            path('<uuid:object_id>/upload-attachment/', self.admin_site.admin_view(self.upload_attachment_view), name='products_upload_attachment'),
        ]
        return my_urls + urls

    def attachments_inline(self, obj):
        """
        Renderiza listado de attachments y enlace al formulario de subida.
        Si obj es None (nuevo objeto), muestra indicación.
        """
        if obj is None:
            return "Guarda el producto para poder adjuntar archivos."
        qs = Attachment.objects.filter(attachable_type='product', attachable_id=obj.id).order_by('-created_at')
        lines = []
        for a in qs:
            try:
                url = a.file.url if a.file else '#'
            except Exception:
                url = '#'
            display = f'<a href="{url}" target="_blank">{a.file_name or a.id}</a> ({a.role or "other"})'
            lines.append(display)
        list_html = '<br/>'.join(lines) if lines else '<em>No hay archivos adjuntos</em>'

        # Construir URL absoluta y determinista para la subida
        app_label = self.model._meta.app_label
        model_name = self.model._meta.model_name
        upload_url = f'/admin/{app_label}/{model_name}/{obj.pk}/upload-attachment/'

        form_html = f'''
            <div style="margin-top:10px;">
                <strong>Archivos adjuntos:</strong><br/>
                {list_html}
                <hr style="margin:8px 0;"/>
                <a class="button" href="{upload_url}">Subir nuevo archivo</a>
            </div>
        '''
        return mark_safe(form_html)
    attachments_inline.short_description = 'Attachments'

    def upload_attachment_view(self, request, object_id):
        """
        GET: muestra un formulario simple con CSRF para subir un archivo al producto.
        POST: procesa el archivo y crea un Attachment vinculado al producto.
        """
        product = get_object_or_404(Product, pk=object_id)

        if request.method == 'POST':
            file_obj = request.FILES.get('file')
            if not file_obj:
                messages.error(request, "El campo 'file' es requerido.")
                return HttpResponseRedirect(request.path)

            role = request.POST.get('role')
            if not role:
                if file_obj.content_type and file_obj.content_type.startswith('image/'):
                    role = 'image'
                else:
                    role = 'other'

            att = Attachment(
                file=file_obj,
                file_name=file_obj.name,
                size_bytes=getattr(file_obj, 'size', None),
                content_type=getattr(file_obj, 'content_type', None),
                role=role,
                attachable_type='product',
                attachable_id=product.id,
                created_by=request.user if request.user.is_authenticated else None,
            )
            att.save()
            messages.success(request, f'Archivo "{att.file_name}" subido correctamente.')
            # Redirigir al change view del producto
            return HttpResponseRedirect(f'../{object_id}/change/')

        # GET: render simple form with CSRF token
        csrf_token = get_token(request)
        upload_action = request.path  # se postea a la misma URL
        html = f"""
            <html>
              <head><title>Subir archivo a {product.name}</title></head>
              <body style="font-family: sans-serif; margin: 20px;">
                <h2>Subir archivo al producto: {product.name}</h2>
                <form action="{upload_action}" method="post" enctype="multipart/form-data">
                    <input type="hidden" name="csrfmiddlewaretoken" value="{csrf_token}" />
                    <p>
                        <label>Archivo:</label><br/>
                        <input type="file" name="file" required />
                    </p>
                    <p>
                        <label>Role (opcional):</label><br/>
                        <input type="text" name="role" placeholder="image|manual|datasheet|other" />
                    </p>
                    <p>
                        <button type="submit">Subir</button>
                        &nbsp;
                        <a href="../../{object_id}/change/">Volver</a>
                    </p>
                </form>
              </body>
            </html>
        """
        return HttpResponse(html)

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


@admin.register(ProductSpecification)
class ProductSpecificationAdmin(admin.ModelAdmin):
    list_display = ['product', 'key', 'value', 'unit', 'display_order', 'is_visible', 'created_at']
    search_fields = ['key', 'value', 'product__name', 'product__product_code']
    list_filter = ['is_visible', 'product__category', 'product__brand']
    list_editable = ['display_order', 'is_visible']
    ordering = ['product', 'display_order', 'key']
    autocomplete_fields = ['product']