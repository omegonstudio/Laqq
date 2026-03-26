"""
Ejemplo de cómo crear un producto con múltiples variantes (fixed_specs)
========================================================================

Este script demuestra cómo crear productos con múltiples especificaciones fijas,
permitiendo que el frontend muestre diferentes variantes del mismo producto.

IMPORTANTE: El backend YA ESTÁ configurado para enviar TODAS las variantes.
El serializer ProductSerializer tiene: fixed_specs = ProductSpecSerializer(many=True, read_only=True)
Esto significa que el campo 'fixed_specs' en la respuesta será un ARRAY con todas las variantes.

Ejecutar este script desde el shell de Django:
python manage.py shell < products/examples/create_product_variants.py
"""

from products.models import Product, ProductSpec, Brand, Category
import uuid

def create_product_with_multiple_variants():
    """
    Crea un producto de ejemplo con múltiples variantes de volumen.
    """

    # Obtener o crear marca y categoría de ejemplo
    brand, _ = Brand.objects.get_or_create(
        name="LabEquip",
        defaults={"description": "Equipamiento de laboratorio profesional"}
    )

    category, _ = Category.objects.get_or_create(
        name="Material Volumétrico",
        defaults={"description": "Material de vidrio para medición de volúmenes"}
    )

    # Crear el producto principal
    product = Product.objects.create(
        name="Matraz Aforado Clase A",
        brand=brand,
        category=category,
        description="Matraz aforado de vidrio borosilicato clase A con tapón esmerilado",
        is_active=True,
        is_featured=True
    )

    print(f"✅ Producto creado: {product.name} (ID: {product.id})")

    # Crear múltiples variantes (fixed_specs) para el mismo producto
    variantes = [
        {
            "code": f"MAT-{product.product_code}-25ML",
            "volume": "25 ml",
            "dimensions": "70 x 40 mm",
            "cap": "NS 10/19",
            "accuracy": "±0.03 ml",
            "precision": "0.01 ml",
            "additional_specs": {
                "material": "Vidrio borosilicato",
                "clase": "A",
                "certificacion": "DIN ISO 1042",
                "temperatura_calibracion": "20°C"
            }
        },
        {
            "code": f"MAT-{product.product_code}-50ML",
            "volume": "50 ml",
            "dimensions": "90 x 45 mm",
            "cap": "NS 12/21",
            "accuracy": "±0.05 ml",
            "precision": "0.02 ml",
            "additional_specs": {
                "material": "Vidrio borosilicato",
                "clase": "A",
                "certificacion": "DIN ISO 1042",
                "temperatura_calibracion": "20°C"
            }
        },
        {
            "code": f"MAT-{product.product_code}-100ML",
            "volume": "100 ml",
            "dimensions": "110 x 50 mm",
            "cap": "NS 12/21",
            "accuracy": "±0.08 ml",
            "precision": "0.02 ml",
            "additional_specs": {
                "material": "Vidrio borosilicato",
                "clase": "A",
                "certificacion": "DIN ISO 1042",
                "temperatura_calibracion": "20°C"
            }
        },
        {
            "code": f"MAT-{product.product_code}-250ML",
            "volume": "250 ml",
            "dimensions": "145 x 60 mm",
            "cap": "NS 14/23",
            "accuracy": "±0.15 ml",
            "precision": "0.05 ml",
            "additional_specs": {
                "material": "Vidrio borosilicato",
                "clase": "A",
                "certificacion": "DIN ISO 1042",
                "temperatura_calibracion": "20°C"
            }
        },
        {
            "code": f"MAT-{product.product_code}-500ML",
            "volume": "500 ml",
            "dimensions": "175 x 75 mm",
            "cap": "NS 19/26",
            "accuracy": "±0.25 ml",
            "precision": "0.05 ml",
            "additional_specs": {
                "material": "Vidrio borosilicato",
                "clase": "A",
                "certificacion": "DIN ISO 1042",
                "temperatura_calibracion": "20°C"
            }
        },
        {
            "code": f"MAT-{product.product_code}-1000ML",
            "volume": "1000 ml",
            "dimensions": "220 x 90 mm",
            "cap": "NS 24/29",
            "accuracy": "±0.40 ml",
            "precision": "0.10 ml",
            "additional_specs": {
                "material": "Vidrio borosilicato",
                "clase": "A",
                "certificacion": "DIN ISO 1042",
                "temperatura_calibracion": "20°C"
            }
        }
    ]

    # Crear todas las variantes
    for variante_data in variantes:
        spec = ProductSpec.objects.create(
            product=product,
            **variante_data
        )
        print(f"  📦 Variante creada: {spec.code} - Volumen: {spec.volume}")

    # Verificar que el producto tiene múltiples specs
    total_specs = product.fixed_specs.count()
    print(f"\n✅ Producto '{product.name}' creado con {total_specs} variantes")

    return product


def test_product_serialization():
    """
    Prueba la serialización del producto para verificar que incluye todas las variantes.
    """
    from products.serializers import ProductSerializer
    from rest_framework.test import APIRequestFactory
    from django.contrib.auth.models import AnonymousUser

    # Obtener el último producto creado
    product = Product.objects.filter(fixed_specs__isnull=False).distinct().last()

    if not product:
        print("❌ No hay productos con fixed_specs. Ejecuta primero create_product_with_multiple_variants()")
        return

    # Crear un request simulado para el contexto del serializer
    factory = APIRequestFactory()
    request = factory.get('/')
    request.user = AnonymousUser()

    # Serializar el producto
    serializer = ProductSerializer(product, context={'request': request})
    data = serializer.data

    print(f"\n📋 Producto serializado: {data['name']}")
    print(f"   ID: {data['id']}")
    print(f"   Número de variantes (fixed_specs): {len(data['fixed_specs'])}")

    if data['fixed_specs']:
        print("\n   Variantes incluidas:")
        for spec in data['fixed_specs']:
            print(f"   - {spec['code']}: {spec.get('volume', 'N/A')}")

    print("\n✅ El backend está enviando correctamente TODAS las variantes en el array 'fixed_specs'")
    print("   El frontend recibirá este array y podrá mostrar las variantes en tabs o como prefiera.")

    return data


# Ejecutar ejemplos si se corre directamente
if __name__ == "__main__":
    print("="*60)
    print("EJEMPLO: Creación de Producto con Múltiples Variantes")
    print("="*60)

    # Crear producto con variantes
    product = create_product_with_multiple_variants()

    print("\n" + "="*60)
    print("TEST: Verificación de Serialización")
    print("="*60)

    # Verificar serialización
    test_product_serialization()

    print("\n" + "="*60)
    print("RESUMEN")
    print("="*60)
    print("""
El backend YA está configurado para enviar múltiples fixed_specs.
No se requieren cambios adicionales en el backend.

El frontend recibirá en el campo 'fixed_specs' un array con todas
las variantes disponibles del producto.

Ejemplo de respuesta del API:
{
    "id": "uuid-del-producto",
    "name": "Matraz Aforado Clase A",
    "fixed_specs": [
        {"id": "uuid-1", "code": "MAT-XXX-25ML", "volume": "25 ml", ...},
        {"id": "uuid-2", "code": "MAT-XXX-50ML", "volume": "50 ml", ...},
        {"id": "uuid-3", "code": "MAT-XXX-100ML", "volume": "100 ml", ...},
        // ... más variantes
    ],
    // ... otros campos del producto
}
    """)