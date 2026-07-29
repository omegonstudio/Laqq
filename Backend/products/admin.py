from django.contrib import admin, messages
from django.contrib.contenttypes.admin import GenericTabularInline
from django.conf import settings
from django.urls import path
from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.middleware.csrf import get_token
from django.utils.safestring import mark_safe
from django import forms

from .models import (
    Brand, Category, Product, ProductVariant, ProductRelation,
    TechnicalSpec, ProductTechnicalSpec, VariantTechnicalSpec,
)
from .forms import CSVUploadForm
from .importer import import_products_csv

from attachments.models import Attachment


class ProductRelationInline(admin.TabularInline):
    model = ProductRelation
    fk_name = 'from_product'
    extra = 1
    verbose_name = "Producto Relacionado"
    verbose_name_plural = "Productos Relacionados"


class TechnicalSpecInlineForm(forms.ModelForm):
    """
    Formulario que permite crear/editar TechnicalSpec directamente
    desde el inline del Product o ProductVariant.
    """
    key = forms.CharField(max_length=100, label='Clave')
    value = forms.CharField(widget=forms.Textarea(attrs={'rows': 2}), label='Valor')

    class Meta:
        model = ProductTechnicalSpec
        fields = []

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            try:
                ts = self.instance.technical_spec
                self.fields['key'].initial = ts.key
                self.fields['value'].initial = ts.value
            except Exception:
                pass

    def save(self, commit=True):
        instance = super().save(commit=False)
        key = self.cleaned_data.get('key', '')
        value = self.cleaned_data.get('value', '')

        if instance.pk and getattr(instance, 'technical_spec_id', None):
            ts = instance.technical_spec
            ts.key = key
            ts.value = value
            ts.save()
        else:
            ts = TechnicalSpec.objects.create(key=key, value=value)
            instance.technical_spec = ts

        if commit:
            instance.save()
        return instance


class VariantTechnicalSpecInlineForm(forms.ModelForm):
    """Mismo patrón que TechnicalSpecInlineForm pero para VariantTechnicalSpec."""
    key = forms.CharField(max_length=100, label='Clave')
    value = forms.CharField(widget=forms.Textarea(attrs={'rows': 2}), label='Valor')

    class Meta:
        model = VariantTechnicalSpec
        fields = []

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            try:
                ts = self.instance.technical_spec
                self.fields['key'].initial = ts.key
                self.fields['value'].initial = ts.value
            except Exception:
                pass

    def save(self, commit=True):
        instance = super().save(commit=False)
        key = self.cleaned_data.get('key', '')
        value = self.cleaned_data.get('value', '')

        if instance.pk and getattr(instance, 'technical_spec_id', None):
            ts = instance.technical_spec
            ts.key = key
            ts.value = value
            ts.save()
        else:
            ts = TechnicalSpec.objects.create(key=key, value=value)
            instance.technical_spec = ts

        if commit:
            instance.save()
        return instance


class ProductTechnicalSpecInline(admin.TabularInline):
    model = ProductTechnicalSpec
    form = TechnicalSpecInlineForm
    extra = 1
    fields = ['key', 'value']
    verbose_name = "Especificación Técnica"
    verbose_name_plural = "Especificaciones Técnicas"


class VariantTechnicalSpecInline(admin.TabularInline):
    model = VariantTechnicalSpec
    form = VariantTechnicalSpecInlineForm
    extra = 1
    fields = ['key', 'value']
    verbose_name = "Especificación Técnica"
    verbose_name_plural = "Especificaciones Técnicas"


class AttachmentInline(GenericTabularInline):
    model = Attachment
    extra = 1
    fields = ['file', 'role', 'file_name', 'size_bytes', 'created_at']
    readonly_fields = ['file_name', 'size_bytes', 'created_at']
    can_delete = True
    verbose_name = "Archivo Adjunto"
    verbose_name_plural = "Archivos Adjuntos"

    ct_field = 'content_type'
    ct_fk_field = 'object_id'

    exclude = ['created_by', 'content_type_str', 'attachable_type', 'attachable_id']


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = ['code', 'name']
    verbose_name = "Variante"
    verbose_name_plural = "Variantes"
    show_change_link = True


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'level', 'display_order', 'created_at']
    search_fields = ['name', 'description']
    list_filter = ['level', 'parent']
    ordering = ['display_order', 'name']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    
    inlines = [ProductVariantInline, ProductTechnicalSpecInline, AttachmentInline, ProductRelationInline]
    
    list_display = ['product_code', 'name', 'brand', 'category', 'root_category', 'is_active', 'is_featured', 'created_at']
    search_fields = ['product_code', 'name', 'description']
    list_filter = ['brand', 'category', 'root_category', 'is_active', 'is_featured']
    ordering = ['-created_at']

    change_list_template = "admin/products/change_list.html"

    exclude = ['image_attachment']

    def get_urls(self):
        urls = super().get_urls()
        my_urls = [
            path('bulk-upload/', self.admin_site.admin_view(self.bulk_upload_view), name='products_bulk_upload'),
        ]
        return my_urls + urls

    def bulk_upload_view(self, request):
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

        form = CSVUploadForm()
        return render(request, 'admin/products/import_products.html', {'form': form})

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for instance in instances:
            if isinstance(instance, Attachment):
                if not instance.created_by:
                    instance.created_by = request.user if request.user.is_authenticated else None
                if not instance.attachable_type:
                    instance.attachable_type = 'product'
                if not instance.attachable_id and instance.object_id:
                    instance.attachable_id = instance.object_id
            instance.save()
        formset.save_m2m()


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'product', 'created_at']
    search_fields = ['code', 'name', 'product__name']
    list_filter = ['product']
    ordering = ['-created_at']
    inlines = [VariantTechnicalSpecInline]


@admin.register(TechnicalSpec)
class TechnicalSpecAdmin(admin.ModelAdmin):
    list_display = ['key', 'value', 'created_at']
    search_fields = ['key', 'value']
    ordering = ['key']
