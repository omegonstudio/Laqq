"""Reglas de negocio sobre categorías de producto."""


# Nivel 0 = raíz (Consumibles, Equipos, Mobiliario, …). Los productos van en nivel ≥ 1.
MIN_PRODUCT_CATEGORY_LEVEL = 1

PRODUCT_CATEGORY_LEVEL_ERROR = (
    'No se pueden asignar productos a una categoría raíz (nivel 0). '
    'Elegí al menos una subcategoría.'
)


def category_allows_products(category) -> bool:
    if category is None:
        return True
    return getattr(category, 'level', 0) >= MIN_PRODUCT_CATEGORY_LEVEL


def ensure_product_category(category) -> None:
    """
    Lanza ValueError si la categoría no puede usarse en un producto.
    Criterio: level >= 1 (no se usa el nombre ni si tiene hijos).
    """
    if category is not None and not category_allows_products(category):
        raise ValueError(PRODUCT_CATEGORY_LEVEL_ERROR)
