"""
Filtros personalizados para productos.
Implementa filtrado recursivo de categorías y otras funcionalidades avanzadas.
"""
import unicodedata

import django_filters
from django.db import connection
from django.db.models import F, Func, Q
from rest_framework.filters import SearchFilter

from .models import Product, Category


def strip_accents(text):
    normalized = unicodedata.normalize('NFKD', text)
    return ''.join(c for c in normalized if not unicodedata.combining(c))


def unaccent_alias(field_name):
    # Sin "__" en el alias para que no se confunda con un lookup/relación al filtrar.
    return f"{field_name.replace('__', '_')}_unaccented"


class Unaccent(Func):
    function = 'unaccent'


class UnaccentSearchFilter(SearchFilter):
    """
    Igual que el SearchFilter de DRF (icontains, case-insensitive) pero
    también ignora tildes/acentos, en ambos sentidos: "cafe" encuentra
    "Café" y "café" encuentra "Cafe".

    Requiere la extensión `unaccent` de Postgres (ver migración
    0012_unaccent_extension). En motores sin esa extensión (ej. SQLite,
    usado por la suite de tests) cae al comportamiento estándar de DRF.
    """

    def filter_queryset(self, request, queryset, view):
        if connection.vendor != 'postgresql':
            return super().filter_queryset(request, queryset, view)

        search_fields = self.get_search_fields(view, request)
        search_terms = self.get_search_terms(request)

        if not search_fields or not search_terms:
            return queryset

        annotations = {
            unaccent_alias(field): Unaccent(F(field)) for field in search_fields
        }
        queryset = queryset.annotate(**annotations)

        conditions = Q()
        for term in search_terms:
            term_unaccented = strip_accents(term)
            term_query = Q()
            for field in search_fields:
                term_query |= Q(**{f'{unaccent_alias(field)}__icontains': term_unaccented})
            # También buscar en código de variante (relación inversa Product -> ProductVariant)
            term_query |= Q(**{'variants__code__icontains': term_unaccented})
            conditions &= term_query

        return queryset.filter(conditions).distinct()


class ProductFilter(django_filters.FilterSet):
    """
    Filtro personalizado para productos con soporte para:
    - Filtrado recursivo de categorías (incluye productos de subcategorías)
    - Filtros estándar por marca, estado activo, destacado
    """

    name = django_filters.CharFilter(
        field_name='name',
        lookup_expr='icontains',
        label='Nombre del producto',
    )

    brand_name = django_filters.CharFilter(
        field_name='brand__name',
        lookup_expr='icontains',
        label='Nombre de marca',
    )

    product_code = django_filters.CharFilter(
        field_name='product_code',
        lookup_expr='icontains',
        label='Código de producto',
    )

    variant_code = django_filters.CharFilter(
        method='filter_variant_code',
        label='Código de variante',
        help_text='Busca productos por código de variante (retorna el producto padre)'
    )

    # Filtro recursivo de categoría
    category_recursive = django_filters.CharFilter(
        method='filter_category_recursive',
        label='Categoría (incluye subcategorías)',
        help_text='Filtra productos por categoría incluyendo todos los productos de subcategorías descendientes'
    )

    # Mantener el filtro original de categoría para compatibilidad
    category = django_filters.ModelChoiceFilter(
        queryset=Category.objects.all(),
        label='Categoría exacta',
        help_text='Filtra productos solo por la categoría exacta (sin incluir subcategorías)'
    )

    # Filtro explícito por brand_id (UUID exacto) — evita que ModelChoiceFilter
    # falle silenciosamente cuando la marca no tiene productos asociados.
    brand = django_filters.UUIDFilter(
        field_name='brand_id',
        lookup_expr='exact',
        label='Marca (UUID exacto)',
        help_text='Filtra productos por UUID exacto de la marca. Si no hay productos, retorna vacío.'
    )

    class Meta:
        model = Product
        fields = ['name', 'product_code', 'variant_code', 'brand_name', 'category', 'is_active', 'is_featured']

    def filter_variant_code(self, queryset, name, value):
        """
        Filtra productos por código de variante.
        Busca en el campo `code` de las variantes asociadas y retorna
        los productos padre que tengan al menos una variante que coincida.

        Args:
            queryset: QuerySet de productos
            name: Nombre del campo (no usado)
            value: Texto a buscar en el código de variante

        Returns:
            QuerySet filtrado con productos que tienen variantes cuyo código coincide
        """
        if not value:
            return queryset
        return queryset.filter(variants__code__icontains=value).distinct()

    def filter_category_recursive(self, queryset, name, value):
        """
        Filtra productos por categoría incluyendo todas las subcategorías descendientes.

        Args:
            queryset: QuerySet de productos
            name: Nombre del campo (no usado)
            value: ID de la categoría padre

        Returns:
            QuerySet filtrado con productos de la categoría y todas sus descendientes
        """
        if not value:
            return queryset

        try:
            # Obtener la categoría padre
            parent_category = Category.objects.get(id=value)
        except Category.DoesNotExist:
            # Si la categoría no existe, retornar queryset vacío
            return queryset.none()

        # Función recursiva para obtener todos los IDs de categorías descendientes
        def get_descendant_ids(category):
            """
            Obtiene recursivamente todos los IDs de las categorías descendientes.
            """
            ids = [category.id]
            children = Category.objects.filter(parent=category)
            for child in children:
                ids.extend(get_descendant_ids(child))
            return ids

        # Obtener todos los IDs de categorías (padre + descendientes)
        category_ids = get_descendant_ids(parent_category)

        # Filtrar productos que pertenezcan a cualquiera de estas categorías
        return queryset.filter(category__id__in=category_ids)

    def get_categories_with_descendants(self, category_id):
        """
        Método auxiliar optimizado para obtener categorías con descendientes.
        Usa una sola consulta recursiva si el motor de base de datos lo soporta.
        """
        # Para PostgreSQL podríamos usar CTEs recursivas, pero para compatibilidad
        # mantenemos el método recursivo simple
        try:
            parent = Category.objects.get(id=category_id)
            return self._get_all_descendants(parent)
        except Category.DoesNotExist:
            return Category.objects.none()

    def _get_all_descendants(self, category):
        """
        Obtiene todas las categorías descendientes de manera recursiva.
        """
        result = [category]
        children = category.children.all()
        for child in children:
            result.extend(self._get_all_descendants(child))
        return result