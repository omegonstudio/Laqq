"""
Filtros personalizados para productos.
Implementa filtrado recursivo de categorías y otras funcionalidades avanzadas.
"""
import django_filters
from django.db.models import Q
from .models import Product, Category


class ProductFilter(django_filters.FilterSet):
    """
    Filtro personalizado para productos con soporte para:
    - Filtrado recursivo de categorías (incluye productos de subcategorías)
    - Filtros estándar por marca, estado activo, destacado
    """

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

    class Meta:
        model = Product
        fields = ['brand', 'category', 'is_active', 'is_featured']

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