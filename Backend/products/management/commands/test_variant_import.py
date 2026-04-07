"""
Management command para probar la importación de variantes.

Ejecutar con: python manage.py test_variant_import
"""

from django.core.management.base import BaseCommand
from io import BytesIO
import openpyxl
from products.importer import import_products_csv
from products.models import Product, ProductSpec, Brand


class Command(BaseCommand):
    help = 'Prueba la importación de variantes de productos'

    def handle(self, *args, **options):
        self.stdout.write("\n" + "="*80)
        self.stdout.write("EJECUTANDO TEST DE IMPORTACIÓN DE VARIANTES")
        self.stdout.write("="*80 + "\n")

        # Crear un workbook de prueba
        wb = openpyxl.Workbook()
        ws = wb.active

        # Headers
        headers = [
            'product_code', 'name', 'brand', 'category_level_0', 'category_level_1',
            'description', 'is_active', 'is_variant', 'spec_code', 'volume',
            'dimensions', 'cap', 'accuracy', 'precision'
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
            'TEST-001-25ML',      # spec_code
            '25ml',               # volume
            '70x40mm',            # dimensions
            'NS 10/19',           # cap
            '±0.03ml',            # accuracy
            '0.01ml'              # precision
        ])

        # Variante 1 (is_variant=true)
        ws.append([
            'TEST-001',           # product_code (mismo que el producto padre)
            '',                   # name (vacío, usa el del padre)
            '',                   # brand (vacío, usa el del padre)
            '',                   # category_level_0 (vacío)
            '',                   # category_level_1 (vacío)
            '',                   # description (vacío)
            '',                   # is_active (vacío)
            'true',               # is_variant (es una variante)
            'TEST-001-50ML',      # spec_code
            '50ml',               # volume
            '90x45mm',            # dimensions
            'NS 12/21',           # cap
            '±0.05ml',            # accuracy
            '0.02ml'              # precision
        ])

        # Variante 2 (is_variant=true)
        ws.append([
            'TEST-001',           # product_code (mismo que el producto padre)
            '',                   # name
            '',                   # brand
            '',                   # category_level_0
            '',                   # category_level_1
            '',                   # description
            '',                   # is_active
            'true',               # is_variant (es una variante)
            'TEST-001-100ML',     # spec_code
            '100ml',              # volume
            '110x50mm',           # dimensions
            'NS 12/21',           # cap
            '±0.08ml',            # accuracy
            '0.02ml'              # precision
        ])

        # Test case 2: Variante sin producto padre (debería fallar)
        ws.append([
            'TEST-999',           # product_code (NO EXISTE)
            '',                   # name
            '',                   # brand
            '',                   # category_level_0
            '',                   # category_level_1
            '',                   # description
            '',                   # is_active
            'true',               # is_variant
            'TEST-999-50ML',      # spec_code
            '50ml',               # volume
            '',                   # dimensions
            '',                   # cap
            '',                   # accuracy
            ''                    # precision
        ])

        # Test case 3: Producto duplicado (debería fallar)
        ws.append([
            'TEST-001',           # product_code (DUPLICADO)
            'Matraz Duplicado',   # name
            'TestBrand',          # brand
            'equipos',            # category_level_0
            'Matraces',           # category_level_1
            'Otro producto',      # description
            'true',               # is_active
            'false',              # is_variant (es un producto - debería fallar por duplicado)
            'TEST-001-DUP',       # spec_code
            '25ml',               # volume
            '',                   # dimensions
            '',                   # cap
            '',                   # accuracy
            ''                    # precision
        ])

        # Guardar en BytesIO
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        # Simular un archivo con nombre
        class FakeFile:
            def __init__(self, data, name):
                self._data = data
                self.name = name

            def read(self):
                return self._data

        fake_file = FakeFile(buffer.read(), 'test_variants.xlsx')

        # Importar
        result = import_products_csv(fake_file, skip_downloads=True)

        self.stdout.write("\n" + "="*80)
        self.stdout.write("RESUMEN DE IMPORTACIÓN")
        self.stdout.write("="*80)
        self.stdout.write(f"Productos creados: {result.get('created_products', 0)}")
        self.stdout.write(f"Productos actualizados: {result.get('updated_products', 0)}")
        self.stdout.write(f"Specs creados (del producto principal): {result.get('created_specs', 0)}")
        self.stdout.write(f"Variantes creadas: {result.get('created_variants', 0)}")
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

            specs = product.fixed_specs.all()
            self.stdout.write(f"\nNúmero de variantes (fixed_specs): {specs.count()}")
            self.stdout.write("\nVariantes:")
            for i, spec in enumerate(specs, 1):
                self.stdout.write(f"  {i}. {spec.code} - {spec.volume} - {spec.dimensions}")

            expected_specs = 3  # 1 del producto principal + 2 variantes
            if specs.count() == expected_specs:
                self.stdout.write(self.style.SUCCESS(
                    f"\n✅ TEST EXITOSO: Se crearon {expected_specs} variantes como se esperaba!"
                ))
            else:
                self.stdout.write(self.style.ERROR(
                    f"\n❌ TEST FALLIDO: Se esperaban {expected_specs} variantes, se encontraron {specs.count()}"
                ))

        except Product.DoesNotExist:
            self.stdout.write(self.style.ERROR("\n❌ TEST FALLIDO: No se encontró el producto TEST-001"))

        self.stdout.write("\n" + "="*80)
        self.stdout.write("LIMPIEZA: Eliminando datos de prueba")
        self.stdout.write("="*80)

        # Limpiar datos de prueba
        try:
            product = Product.objects.get(product_code='TEST-001')
            product.delete()
            self.stdout.write(self.style.SUCCESS("✅ Producto de prueba eliminado"))
        except:
            self.stdout.write(self.style.WARNING("⚠ No se pudo eliminar el producto de prueba"))

        # Limpiar brand de prueba
        try:
            brand = Brand.objects.get(name='TestBrand')
            brand.delete()
            self.stdout.write(self.style.SUCCESS("✅ Brand de prueba eliminado"))
        except:
            pass

        self.stdout.write("\n" + "="*80)
        self.stdout.write("TEST COMPLETADO")
        self.stdout.write("="*80 + "\n")
