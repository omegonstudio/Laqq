"""
Management command para probar la importación de variantes.

Ejecutar con: python manage.py test_variant_import
"""

from django.core.management.base import BaseCommand
from io import BytesIO
import openpyxl
from products.importer import import_products_csv
from products.models import Product, ProductVariant, Brand


class Command(BaseCommand):
    help = 'Prueba la importación de variantes de productos'

    def handle(self, *args, **options):
        self.stdout.write("\n" + "="*80)
        self.stdout.write("EJECUTANDO TEST DE IMPORTACIÓN DE VARIANTES")
        self.stdout.write("="*80 + "\n")

        wb = openpyxl.Workbook()
        ws = wb.active

        headers = [
            'product_code', 'name', 'brand', 'category_level_0', 'category_level_1',
            'description', 'is_active', 'is_variant', 'variant_code'
        ]
        ws.append(headers)

        # Producto principal (is_variant=false)
        ws.append([
            'TEST-001',           # product_code
            'Matraz de Prueba',   # name
            'TestBrand',          # brand
            'equipos',            # category_level_0
            'Matraces',           # category_level_1
            'Producto de prueba', # description
            'true',               # is_active
            'false',              # is_variant (es un producto)
            'TEST-001-25ML',      # variant_code
        ])

        # Variante 1 (is_variant=true)
        ws.append([
            'TEST-001',           # product_code
            '',                   # name
            '',                   # brand
            '',                   # category_level_0
            '',                   # category_level_1
            '',                   # description
            '',                   # is_active
            'true',               # is_variant
            'TEST-001-50ML',      # variant_code
        ])

        # Variante 2 (is_variant=true)
        ws.append([
            'TEST-001',           # product_code
            '',
            '',
            '',
            '',
            '',
            '',
            'true',               # is_variant
            'TEST-001-100ML',     # variant_code
        ])

        # Test case 2: Variante sin producto padre (debería fallar)
        ws.append([
            'TEST-999',           # product_code (NO EXISTE)
            '',
            '',
            '',
            '',
            '',
            '',
            'true',               # is_variant
            'TEST-999-50ML',      # variant_code
        ])

        # Test case 3: Producto duplicado (debería fallar)
        ws.append([
            'TEST-001',           # product_code (DUPLICADO)
            'Matraz Duplicado',
            'TestBrand',
            'equipos',
            'Matraces',
            'Otro producto',
            'true',
            'false',              # is_variant (producto - debería fallar por duplicado)
            'TEST-001-DUP',
        ])

        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        class FakeFile:
            def __init__(self, data, name):
                self._data = data
                self.name = name

            def read(self):
                return self._data

        fake_file = FakeFile(buffer.read(), 'test_variants.xlsx')

        result = import_products_csv(fake_file, skip_downloads=True)

        self.stdout.write("\n" + "="*80)
        self.stdout.write("RESUMEN DE IMPORTACIÓN")
        self.stdout.write("="*80)
        self.stdout.write(f"Productos creados: {result.get('created_products', 0)}")
        self.stdout.write(f"Productos actualizados: {result.get('updated_products', 0)}")
        self.stdout.write(f"Variantes creadas (del producto principal): {result.get('created_specs', 0)}")
        self.stdout.write(f"Variantes creadas (is_variant=true): {result.get('created_variants', 0)}")
        self.stdout.write(f"Errores encontrados: {len(result.get('errors', []))}")

        if result.get('errors'):
            self.stdout.write("\n" + "="*80)
            self.stdout.write("ERRORES DETECTADOS (esperados: 2)")
            self.stdout.write("="*80)
            for error in result['errors']:
                self.stdout.write(f"  - Fila {error.get('row', 'N/A')}: {error.get('error', error.get('product', 'Unknown'))}")

        self.stdout.write("\n" + "="*80)
        self.stdout.write("VERIFICACIÓN DE PRODUCTO Y VARIANTES")
        self.stdout.write("="*80)

        try:
            product = Product.objects.get(product_code='TEST-001')
            self.stdout.write(f"\nProducto encontrado: {product.name} (ID: {product.id})")
            self.stdout.write(f"Brand: {product.brand.name if product.brand else 'N/A'}")
            self.stdout.write(f"Category: {product.category.name if product.category else 'N/A'}")

            variants = product.variants.all()
            self.stdout.write(f"\nNúmero de variantes: {variants.count()}")
            self.stdout.write("\nVariantes:")
            for i, variant in enumerate(variants, 1):
                self.stdout.write(f"  {i}. {variant.code} - {variant.name}")

            expected_variants = 3  # 1 del producto principal + 2 variantes is_variant=true
            if variants.count() == expected_variants:
                self.stdout.write(self.style.SUCCESS(
                    f"\nTEST EXITOSO: Se crearon {expected_variants} variantes como se esperaba!"
                ))
            else:
                self.stdout.write(self.style.ERROR(
                    f"\nTEST FALLIDO: Se esperaban {expected_variants} variantes, se encontraron {variants.count()}"
                ))

        except Product.DoesNotExist:
            self.stdout.write(self.style.ERROR("\nTEST FALLIDO: No se encontró el producto TEST-001"))

        self.stdout.write("\n" + "="*80)
        self.stdout.write("LIMPIEZA: Eliminando datos de prueba")
        self.stdout.write("="*80)

        try:
            product = Product.objects.get(product_code='TEST-001')
            product.delete()
            self.stdout.write(self.style.SUCCESS("Producto de prueba eliminado"))
        except Exception:
            self.stdout.write(self.style.WARNING("No se pudo eliminar el producto de prueba"))

        try:
            Brand.objects.get(name='TestBrand').delete()
            self.stdout.write(self.style.SUCCESS("Brand de prueba eliminado"))
        except Exception:
            pass

        self.stdout.write("\n" + "="*80)
        self.stdout.write("TEST COMPLETADO")
        self.stdout.write("="*80 + "\n")
