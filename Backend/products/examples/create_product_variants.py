"""
Ejemplo de cómo crear un producto con múltiples variantes
==========================================================

Este script demuestra cómo crear productos con múltiples variantes,
permitiendo que el frontend muestre diferentes opciones del mismo producto.

Ejecutar este script desde el shell de Django:
python manage.py shell < products/examples/create_product_variants.py
"""

from products.models import Product, ProductVariant, Brand, Category
import uuid

def create_product_with_multiple_variants():
    """
    Crea un producto de ejemplo con múltiples variantes de tamaño.
    """

    brand, _ = Brand.objects.get_or_create(
        name="LabEquip",
        defaults={"description": "Equipamiento de laboratorio profesional"}
    )

    category, _ = Category.objects.get_or_create(
        name="Material Volumétrico",
        defaults={"description": "Material de vidrio para medición de volúmenes"}
    )

    product = Product.objects.create(
        name="Matraz Aforado Clase A",
        brand=brand,
        category=category,
        description="Matraz aforado de vidrio borosilicato clase A con tapón esmerilado",
        is_active=True,
        is_featured=True
    )

    print(f"Producto creado: {product.name} (ID: {product.id})")

    variantes = [
        {
            "code": f"MAT-{product.product_code}-25ML",
            "name": "25 ml",
            "dimensions": "70 x 40 mm",
        },
        {
            "code": f"MAT-{product.product_code}-50ML",
            "name": "50 ml",
            "dimensions": "90 x 45 mm",
        },
        {
            "code": f"MAT-{product.product_code}-100ML",
            "name": "100 ml",
            "dimensions": "110 x 50 mm",
        },
        {
            "code": f"MAT-{product.product_code}-250ML",
            "name": "250 ml",
            "dimensions": "145 x 60 mm",
        },
        {
            "code": f"MAT-{product.product_code}-500ML",
            "name": "500 ml",
            "dimensions": "175 x 75 mm",
        },
        {
            "code": f"MAT-{product.product_code}-1000ML",
            "name": "1000 ml",
            "dimensions": "220 x 90 mm",
        }
    ]

    for variante_data in variantes:
        variant = ProductVariant.objects.create(product=product, **variante_data)
        print(f"  Variante creada: {variant.code} - {variant.name}")

    total_variants = product.variants.count()
    print(f"\nProducto '{product.name}' creado con {total_variants} variantes")

    return product


def test_product_serialization():
    """
    Prueba la serialización del producto para verificar que incluye todas las variantes.
    """
    from products.serializers import ProductSerializer
    from rest_framework.test import APIRequestFactory
    from django.contrib.auth.models import AnonymousUser

    product = Product.objects.filter(variants__isnull=False).distinct().last()

    if not product:
        print("No hay productos con variantes. Ejecuta primero create_product_with_multiple_variants()")
        return

    factory = APIRequestFactory()
    request = factory.get('/')
    request.user = AnonymousUser()

    serializer = ProductSerializer(product, context={'request': request})
    data = serializer.data

    print(f"\nProducto serializado: {data['name']}")
    print(f"   ID: {data['id']}")
    print(f"   Número de variantes: {len(data['variants'])}")

    if data['variants']:
        print("\n   Variantes incluidas:")
        for v in data['variants']:
            print(f"   - {v['code']}: {v.get('name', 'N/A')} ({v.get('dimensions', 'N/A')})")

    return data


if __name__ == "__main__":
    print("="*60)
    print("EJEMPLO: Creación de Producto con Múltiples Variantes")
    print("="*60)

    product = create_product_with_multiple_variants()

    print("\n" + "="*60)
    print("TEST: Verificación de Serialización")
    print("="*60)

    test_product_serialization()
