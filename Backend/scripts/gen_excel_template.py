"""
Script para regenerar TablaCargaMasiva.xlsx con los nuevos campos del refactor.
Ejecutar desde Backend/: venv/Scripts/python.exe scripts/gen_excel_template.py
"""
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

wb = openpyxl.Workbook()

# ========== HOJA 1: Productos y Variantes ==========
ws = wb.active
ws.title = 'Productos y Variantes'

headers = [
    'product_code',
    'name',
    'brand',
    'category_level_0',
    'category_level_1',
    'category_level_2',
    'description',
    'image_name',
    'is_active',
    'is_variant',
    'variant_code',
    'variant_name',
    'dimensions',
    'related_product_codes',
]

header_font = Font(bold=True, color='FFFFFF', size=11)
header_fill = PatternFill('solid', fgColor='1F4E79')
variant_fill = PatternFill('solid', fgColor='D6E4F7')

thin = Side(border_style='thin', color='AAAAAA')
border = Border(left=thin, right=thin, top=thin, bottom=thin)
center = Alignment(horizontal='center', vertical='center', wrap_text=True)
wrap = Alignment(wrap_text=True, vertical='top')

for col_idx, h in enumerate(headers, 1):
    cell = ws.cell(row=1, column=col_idx, value=h)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = center
    cell.border = border

col_widths = {
    'product_code': 15,
    'name': 28,
    'brand': 15,
    'category_level_0': 16,
    'category_level_1': 16,
    'category_level_2': 16,
    'description': 30,
    'image_name': 22,
    'is_active': 10,
    'is_variant': 11,
    'variant_code': 18,
    'variant_name': 18,
    'dimensions': 14,
    'related_product_codes': 22,
}
for col_idx, h in enumerate(headers, 1):
    ws.column_dimensions[get_column_letter(col_idx)].width = col_widths.get(h, 14)

example_rows = [
    # Producto 1 principal
    ('MAT-001', 'Matraz Aforado Clase A', 'LabEquip', 'equipos', 'Material Volumetrico', 'Matraces',
     'Matraz aforado de vidrio borosilicato clase A', 'matraz_aforado.jpg', 'true', 'false',
     'MAT-001-25ML', '25 ml', '70x40mm', None),
    ('MAT-001', None, None, None, None, None, None, None, None, 'true',
     'MAT-001-50ML', '50 ml', '90x45mm', None),
    ('MAT-001', None, None, None, None, None, None, None, None, 'true',
     'MAT-001-100ML', '100 ml', '110x50mm', None),
    ('MAT-001', None, None, None, None, None, None, None, None, 'true',
     'MAT-001-250ML', '250 ml', '140x60mm', None),
    # Separador
    (None,) * len(headers),
    # Producto 2
    ('VAS-002', 'Vaso de Precipitado', 'GlassLab', 'equipos', 'Cristaleria', 'Vasos',
     'Vaso de precipitado graduado', 'vaso_precipitado.jpg', 'true', 'false',
     'VAS-002-100ML', '100 ml', '50x70mm', 'MAT-001'),
    ('VAS-002', None, None, None, None, None, None, None, None, 'true',
     'VAS-002-250ML', '250 ml', '70x95mm', None),
    ('VAS-002', None, None, None, None, None, None, None, None, 'true',
     'VAS-002-500ML', '500 ml', '90x125mm', None),
]

for row_idx, row_data in enumerate(example_rows, 2):
    is_empty = all(v is None for v in row_data)
    is_variant_row = row_data[9] == 'true'
    for col_idx, value in enumerate(row_data, 1):
        cell = ws.cell(row=row_idx, column=col_idx, value=value)
        cell.border = border
        cell.alignment = wrap
        if not is_empty and is_variant_row:
            cell.fill = variant_fill

ws.freeze_panes = 'A2'
ws.row_dimensions[1].height = 32

# ========== HOJA 2: Instrucciones ==========
ws2 = wb.create_sheet('Instrucciones')
ws2.column_dimensions['A'].width = 110

title_font = Font(bold=True, size=13, color='1F4E79')
section_font = Font(bold=True, size=11)
normal_font = Font(size=10)
code_font = Font(name='Courier New', size=9, color='8B0000')
title_fill = PatternFill('solid', fgColor='D6E4F7')
code_fill = PatternFill('solid', fgColor='F5F5F5')

instrucciones = [
    ('INSTRUCCIONES PARA CARGA MASIVA CON VARIANTES', 'title'),
    ('', None),
    ('1. COLUMNAS DISPONIBLES', 'section'),
    ('   product_code          Codigo unico del producto (obligatorio)', 'normal'),
    ('   name                  Nombre del producto', 'normal'),
    ('   brand                 Marca del producto', 'normal'),
    ('   category_level_0      Categoria raiz: insumos, procesos, equipos, mobiliario (obligatoria si hay categoria)', 'normal'),
    ('   category_level_1      Subcategoria nivel 1 (se crea si no existe)', 'normal'),
    ('   category_level_2      Subcategoria nivel 2 (se crea si no existe, requiere level_1)', 'normal'),
    ('   description           Descripcion del producto', 'normal'),
    ('   image_name            Nombre del archivo de imagen en la libreria (ej: producto.jpg)', 'normal'),
    ('   is_active             true/false - si el producto esta activo (default: true)', 'normal'),
    ('   is_variant            true/false - si la fila es una variante o un producto', 'normal'),
    ('   variant_code          Codigo unico de la variante (obligatorio para variantes)', 'normal'),
    ('   variant_name          Nombre de la variante (ej: 250 ml, Talla L, Version A)', 'normal'),
    ('   dimensions            Dimensiones fisicas (ej: 10x5x5cm, 70x40mm)', 'normal'),
    ('   related_product_codes Codigos de productos relacionados separados por ; (ej: MAT-001;VAS-002)', 'normal'),
    ('', None),
    ('2. CREAR UN PRODUCTO CON VARIANTES', 'section'),
    ('   Paso 1: En la primera fila del producto, completar name, brand, category, etc. con is_variant=false', 'normal'),
    ('   Paso 2: Para cada variante del mismo producto, usar el mismo product_code con is_variant=true', 'normal'),
    ('   Paso 3: Completar variant_code y variant_name en cada fila (de producto y de variante)', 'normal'),
    ('', None),
    ('   NOTA: Las especificaciones tecnicas dinamicas (voltaje, material, presion, etc.)', 'normal'),
    ('   se gestionan desde el panel de administracion o via API (/products/technical-specs/)', 'normal'),
    ('   y no forman parte de la carga masiva CSV/Excel.', 'normal'),
    ('', None),
    ('3. REGLAS', 'section'),
    ('   - Solo puede haber UN producto (is_variant=false) por product_code', 'normal'),
    ('   - Las variantes (is_variant=true) DEBEN tener un producto padre existente o creado en el mismo archivo', 'normal'),
    ('   - Las variantes pueden dejar vacios los campos del producto (name, brand, category, etc.)', 'normal'),
    ('   - Cada variante debe tener un variant_code unico dentro del mismo producto', 'normal'),
    ('   - Si variant_code esta vacio, la fila no crea variante (se ignora esa parte)', 'normal'),
    ('', None),
    ('4. EJEMPLO', 'section'),
    ('   product_code | name       | ... | is_variant | variant_code  | variant_name | dimensions', 'code'),
    ('   MAT-001      | Matraz ... | ... | false      | MAT-001-25ML  | 25 ml        | 70x40mm', 'code'),
    ('   MAT-001      |            | ... | true       | MAT-001-50ML  | 50 ml        | 90x45mm', 'code'),
    ('   MAT-001      |            | ... | true       | MAT-001-100ML | 100 ml       | 110x50mm', 'code'),
    ('', None),
    ('5. ERRORES COMUNES', 'section'),
    ('   - Variante (is_variant=true) sin product_code: fila ignorada con error', 'normal'),
    ('   - Variante (is_variant=true) sin variant_code: fila ignorada con error', 'normal'),
    ('   - Mas de un producto con el mismo product_code (is_variant=false): segundo es ignorado con error', 'normal'),
    ('   - Variante cuyo product_code no existe en DB ni en el archivo: error', 'normal'),
    ('', None),
    ('6. CAMBIOS RESPECTO A LA VERSION ANTERIOR', 'section'),
    ('   - spec_code         => variant_code  (renombrado)', 'normal'),
    ('   - volume            => variant_name  (renombrado, ahora es el nombre descriptivo de la variante)', 'normal'),
    ('   - cap               => ELIMINADO (manejar via TechnicalSpecs en admin/API)', 'normal'),
    ('   - outlet            => ELIMINADO (manejar via TechnicalSpecs en admin/API)', 'normal'),
    ('   - accuracy          => ELIMINADO (manejar via TechnicalSpecs en admin/API)', 'normal'),
    ('   - precision         => ELIMINADO (manejar via TechnicalSpecs en admin/API)', 'normal'),
    ('   - additional_specs  => ELIMINADO (manejar via TechnicalSpecs en admin/API)', 'normal'),
]

for row_idx, (text, style) in enumerate(instrucciones, 1):
    cell = ws2.cell(row=row_idx, column=1, value=text)
    if style == 'title':
        cell.font = title_font
        cell.fill = title_fill
    elif style == 'section':
        cell.font = section_font
    elif style == 'code':
        cell.font = code_font
        cell.fill = code_fill
    else:
        cell.font = normal_font

wb.save('TablaCargaMasiva.xlsx')
print('TablaCargaMasiva.xlsx actualizado correctamente')
