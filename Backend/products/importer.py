import csv
import json
import uuid
import logging
import os
from io import BytesIO, StringIO

from django.conf import settings
from django.db import transaction
from django.core.files.base import ContentFile

# openpyxl para leer .xlsx
try:
    import openpyxl
except Exception:
    openpyxl = None

from .models import Brand, Category, Product, ProductVariant, ProductRelation, TechnicalSpec, VariantTechnicalSpec
from attachments.models import Attachment
from integrations.http import HttpClient
from integrations.http.errors import HttpClientConfigError, HttpClientError, HttpClientResponseError

REQUEST_TIMEOUT = 15
logger = logging.getLogger(__name__)

# Mapping de nombres de columnas en español → nombres internos del modelo
COLUMN_NAME_MAP = {
    'codigo_producto':      'product_code',
    'nombre':               'name',
    'marca':                'brand',
    'categoria_nivel_0':    'category_level_0',
    'categoria_nivel_1':    'category_level_1',
    'categoria_nivel_2':    'category_level_2',
    'categoria_nivel_3':    'category_level_3',
    'descripcion':          'description',
    'nombre_imagen':        'image_name',
    'activo':               'is_active',
    'es_variante':          'is_variant',
    'codigo_variante':      'variant_code',
    'productos_relacionados': 'related_product_codes',
    'tiene_specs':          'is_specs_column',
}

# Columnas ignoradas al importar (ej: columna "error" del Excel de errores descargado)
IGNORED_IMPORT_COLUMNS = {'error', 'error_mensaje', 'errores'}

# Cliente HTTP específico para descargas de imágenes (control de tamaño/host)
image_http_client = HttpClient(
    timeout=getattr(settings, 'INTEGRATION_HTTP_TIMEOUT', REQUEST_TIMEOUT),
    retries=getattr(settings, 'INTEGRATION_HTTP_RETRIES', 2),
    max_bytes=getattr(settings, 'PRODUCT_IMAGE_MAX_BYTES', 5 * 1024 * 1024),
    allowed_hosts=getattr(settings, 'PRODUCT_IMAGE_HOST_ALLOWLIST', None),
)

def parse_bool(value):
    if value is None:
        return False
    v = str(value).strip().lower()
    return v in ('1', 'true', 'yes', 'y', 't')

def _get_attachment_by_name(image_name):
    """
    Busca un Attachment por nombre de archivo en la librería.
    Retorna el Attachment o None si no lo encuentra.
    """
    if not image_name:
        return None
    
    image_name = image_name.strip()
    if not image_name:
        return None
    
    try:
        # Buscar por file_name (búsqueda exacta)
        att = Attachment.objects.filter(file_name=image_name).first()
        if att:
            return att
        
        # Si no encuentra exacto, buscar case-insensitive
        att = Attachment.objects.filter(file_name__iexact=image_name).first()
        if att:
            return att
        
        # Si tampoco encuentra, buscar por nombre sin extensión
        name_without_ext = os.path.splitext(image_name)[0]
        att = Attachment.objects.filter(file_name__istartswith=name_without_ext).first()
        
        return att
    except Exception as e:
        logger.warning("Error buscando attachment por nombre '%s': %s", image_name, e)
        return None

def _get_or_create_brand(name, brand_cache, summary):
    name = (name or '').strip()
    if not name:
        return None
    if name in brand_cache:
        return brand_cache[name]
    obj, created = Brand.objects.get_or_create(name=name, defaults={'description': ''})
    brand_cache[name] = obj
    if created:
        summary['created_brands'] += 1
    return obj

def _get_or_create_category_by_levels(level_0, level_1, level_2, level_3, category_cache, summary):
    """
    Resuelve la categoría a partir de hasta 4 niveles.
    - level_0: obligatorio, debe pre-existir en la base de datos (búsqueda case-insensitive).
    - level_1/2/3: opcionales, se crean si no existen. Cada uno requiere el anterior.
    Todas las búsquedas son case-insensitive para evitar duplicados.
    """
    level_0 = (level_0 or '').strip()
    level_1 = (level_1 or '').strip()
    level_2 = (level_2 or '').strip()
    level_3 = (level_3 or '').strip()

    if not level_0:
        if level_1 or level_2 or level_3:
            raise ValueError(
                f"Se especificó un nivel de categoría sin categoria_nivel_0. "
                f"El nivel 0 es obligatorio cuando se indica alguna categoría."
            )
        raise ValueError(
            "El producto debe tener al menos categoria_nivel_0. La categoría es obligatoria."
        )

    # Cache key normalizado en lower para evitar duplicados
    cache_key = level_0.lower()
    if level_1:
        cache_key += f'>{level_1.lower()}'
    if level_2:
        cache_key += f'>{level_2.lower()}'
    if level_3:
        cache_key += f'>{level_3.lower()}'

    if cache_key in category_cache:
        return category_cache[cache_key]

    # Level 0: debe pre-existir, búsqueda case-insensitive
    key_0 = level_0.lower()
    if key_0 in category_cache:
        parent = category_cache[key_0]
    else:
        parent = Category.objects.filter(name__iexact=level_0, parent=None).first()
        if not parent:
            raise ValueError(
                f"Categoría nivel 0 '{level_0}' no encontrada en la base de datos. "
                f"Las categorías de nivel 0 deben pre-existir."
            )
        category_cache[key_0] = parent

    if not level_1:
        raise ValueError(
            f"Se requiere categoria_nivel_1 cuando se especifica categoria_nivel_0 ('{level_0}'). "
            f"Los productos no pueden asignarse directamente a categorías de nivel 0."
        )

    # Level 1: buscar case-insensitive, crear si no existe
    key_1 = f'{level_0.lower()}>{level_1.lower()}'
    if key_1 in category_cache:
        parent = category_cache[key_1]
    else:
        obj = Category.objects.filter(name__iexact=level_1, parent=parent).first()
        if not obj:
            obj = Category.objects.create(name=level_1, parent=parent, description='', display_order=0)
            summary['created_categories'] += 1
        category_cache[key_1] = obj
        parent = obj

    if not level_2:
        category_cache[cache_key] = parent
        return parent

    # Level 2: buscar case-insensitive, crear si no existe
    key_2 = f'{level_0.lower()}>{level_1.lower()}>{level_2.lower()}'
    if key_2 in category_cache:
        parent = category_cache[key_2]
    else:
        obj = Category.objects.filter(name__iexact=level_2, parent=parent).first()
        if not obj:
            obj = Category.objects.create(name=level_2, parent=parent, description='', display_order=0)
            summary['created_categories'] += 1
        category_cache[key_2] = obj
        parent = obj

    if not level_3:
        category_cache[cache_key] = parent
        return parent

    # Level 3: buscar case-insensitive, crear si no existe
    obj = Category.objects.filter(name__iexact=level_3, parent=parent).first()
    if not obj:
        obj = Category.objects.create(name=level_3, parent=parent, description='', display_order=0)
        summary['created_categories'] += 1
    category_cache[cache_key] = obj
    return obj

def _read_excel_to_dicts(file_bytes):
    """
    Recibe bytes de un .xlsx y devuelve una lista de dicts (igual estructura que csv.DictReader).
    La primera fila se toma como cabecera.
    """
    if openpyxl is None:
        raise RuntimeError("openpyxl no está instalado. Ejecutá: pip install openpyxl")
    wb = openpyxl.load_workbook(BytesIO(file_bytes), read_only=True, data_only=True)
    ws = wb.active  # primera hoja
    rows = []
    iterator = ws.iter_rows(values_only=True)
    try:
        headers = next(iterator)
    except StopIteration:
        return []
    # Normalizar headers a strings
    headers = [str(h).strip() if h is not None else '' for h in headers]
    for row in iterator:
        # Ignorar filas completamente vacías
        if all(val is None for val in row):
            continue
        d = {}
        for idx, h in enumerate(headers):
            if not h:
                continue
            val = row[idx] if idx < len(row) else None
            if val is None:
                d[h] = ''
            elif isinstance(val, str):
                d[h] = val
            elif isinstance(val, float) and val.is_integer():
                d[h] = str(int(val))
            else:
                d[h] = str(val)
        rows.append(d)
    return rows

def import_products_csv(fileobj, *, encoding='utf-8', create_missing=True, skip_downloads=False):
    """
    Funciona tanto con CSV como con Excel (.xlsx).
    fileobj: objeto tipo UploadedFile o file-like. Se detecta la extensión por fileobj.name si está disponible.
    Retorna un dict resumen con contadores y errores.
    CSV/Excel debe contener columnas (recomendadas):
      product_code, name, brand, category_level_0, category_level_1, category_level_2, description, image_name, is_active, related_product_codes, is_variant, variant_code

    is_variant:
      - false/0/vacío: Crea o actualiza un Product. Si ya existe un Product con ese product_code, se lanza error.
      - true/1: NO crea Product, solo crea un ProductVariant. Requiere que exista un Product con ese product_code.

    Categorías:
      - category_level_0: obligatorio si hay categoría. Solo acepta: insumos, procesos, equipos, mobiliario
      - category_level_1: opcional, se crea si no existe
      - category_level_2: opcional, se crea si no existe (requiere level_1)
    image_name: nombre del archivo de imagen en la librería (ej: vaso.jpg)
    """
    # Intentar detectar tipo (xlsx vs csv) por nombre de archivo si está presente
    filename = getattr(fileobj, 'name', '') or ''
    lower = filename.lower()

    # Si es un Excel (xlsx)
    if lower.endswith('.xlsx') or lower.endswith('.xlsm') or lower.endswith('.xltx'):
        # leer bytes crudos
        if hasattr(fileobj, 'read'):
            file_bytes = fileobj.read()
        else:
            # si nos pasan bytes directamente
            file_bytes = fileobj
        rows = _read_excel_to_dicts(file_bytes)
    else:
        # tratar como CSV (modo por defecto)
        if hasattr(fileobj, 'read'):
            raw = fileobj.read()
        else:
            raw = fileobj

        if isinstance(raw, bytes):
            text = raw.decode(encoding)
        else:
            text = raw

        reader = csv.DictReader(StringIO(text))
        rows = [r for r in reader]

    if not rows:
        return {'error': 'Archivo vacío o sin filas'}

    # Guardar filas originales (con nombres en español) para el reporte de errores descargable
    original_row_by_idx = {i + 2: dict(row) for i, row in enumerate(rows)}

    # Normalizar nombres de columna al estándar interno (acepta español e inglés)
    rows = [
        {COLUMN_NAME_MAP.get(k, k): v for k, v in row.items() if k not in IGNORED_IMPORT_COLUMNS}
        for row in rows
    ]

    # Detectar columnas dinámicas de TechnicalSpec (todo lo que viene después de 'is_specs_column')
    spec_columns = []
    if 'is_specs_column' in rows[0]:
        all_headers = list(rows[0].keys())
        spec_idx = all_headers.index('is_specs_column')
        spec_columns = [c for c in all_headers[spec_idx + 1:] if c.strip()]

    # Separar filas en productos y variantes
    product_rows = []  # filas con is_variant=false o vacío
    variant_rows = []  # filas con is_variant=true
    errors = []

    for idx, row in enumerate(rows, start=2):
        is_variant = parse_bool(row.get('is_variant', ''))
        product_code = (row.get('product_code') or row.get('product code') or '').strip()

        if is_variant:
            if not product_code:
                errors.append({
                    'row': idx,
                    'error': f'Fila {idx}: variante sin codigo_producto — no se puede asociar a ningún producto padre.',
                    'row_data': original_row_by_idx.get(idx, {}),
                })
                continue
            variant_rows.append((idx, row))
        else:
            if not product_code and not (row.get('name') or '').strip():
                errors.append({
                    'row': idx,
                    'error': f'Fila {idx}: falta codigo_producto y nombre — no se puede identificar el producto.',
                    'row_data': original_row_by_idx.get(idx, {}),
                })
                continue
            product_rows.append((idx, row))

    # Agrupar productos por product_code
    products_data = {}
    for idx, row in product_rows:
        code = (row.get('product_code') or row.get('product code') or '').strip()
        key = code or (row.get('name') or '').strip()

        # Validar que no haya productos duplicados con el mismo product_code
        if code and key in products_data:
            errors.append({
                'row': idx,
                'error': f'Fila {idx}: codigo_producto "{code}" duplicado — solo puede haber una fila de producto (es_variante=false) por código.',
                'row_data': original_row_by_idx.get(idx, {}),
            })
            continue

        if key not in products_data:
            has_specs = parse_bool(row.get('is_specs_column', ''))
            # Las KEY NAMES vienen de la celda del producto padre; columnas sin nombre se ignoran
            spec_keys = [row.get(col, '').strip() for col in spec_columns] if (has_specs and spec_columns) else []
            products_data[key] = {
                'rows': [],
                'first_row': row,
                'has_specs': has_specs,
                'spec_keys': spec_keys,
            }
        products_data[key]['rows'].append((idx, row))

    summary = {
        'created_brands': 0,
        'created_categories': 0,
        'linked_attachments': 0,
        'created_products': 0,
        'updated_products': 0,
        'created_specs': 0,
        'updated_specs': 0,
        'created_variants': 0,
        'created_technical_specs': 0,
        'created_relations': 0,
        'errors': errors,
    }

    brand_cache = {}
    category_cache = {}
    created_product_map = {}  # key -> Product instance

    # primera pasada: crear productos y specs
    for product_key, data in products_data.items():
        first_row = data['first_row']
        rows_for_product = data['rows']
        try:
            with transaction.atomic():
                # brand
                brand_name = (first_row.get('brand') or '').strip()
                brand = _get_or_create_brand(brand_name, brand_cache, summary) if (brand_name or create_missing) else None
                if brand_name and not brand and not create_missing:
                    raise ValueError(f"Brand '{brand_name}' not found and create_missing=False")

                # category (3 niveles)
                cat_level_0 = (first_row.get('category_level_0') or '').strip()
                cat_level_1 = (first_row.get('category_level_1') or '').strip()
                cat_level_2 = (first_row.get('category_level_2') or '').strip()
                cat_level_3 = (first_row.get('category_level_3') or '').strip()
                category = _get_or_create_category_by_levels(cat_level_0, cat_level_1, cat_level_2, cat_level_3, category_cache, summary)

                # image attachment por nombre (búsqueda en librería)
                image_name = (first_row.get('image_name') or first_row.get('image_url') or '').strip()
                image_attachment = None
                if image_name and not skip_downloads:
                    att = _get_attachment_by_name(image_name)
                    if att:
                        image_attachment = att
                        summary['linked_attachments'] += 1
                    else:
                        logger.warning("Imagen '%s' no encontrada en la librería para el producto '%s'", image_name, product_key)
                        first_row_idx = data['rows'][0][0]
                        summary['errors'].append({
                            'row': first_row_idx,
                            'error': f'Fila {first_row_idx}: imagen "{image_name}" no encontrada en la librería de archivos — subí la imagen antes de importar o dejá el campo vacío.',
                            'row_data': original_row_by_idx.get(first_row_idx, {}),
                        })

                # lookup product by product_code if provided, else by name+brand
                product_lookup = {}
                provided_code = (first_row.get('product_code') or '').strip()
                if provided_code:
                    product_lookup = {'product_code': provided_code}
                else:
                    # fallback to name+brand if brand available
                    if brand:
                        product_lookup = {'name': first_row.get('name') or '', 'brand': brand}
                    else:
                        product_lookup = {'name': first_row.get('name') or ''}

                product_vals = {
                    'name': (first_row.get('name') or '').strip(),
                    'brand': brand,
                    'category': category,
                    'description': (first_row.get('description') or '').strip() or None,
                    'image_attachment': image_attachment,
                    'is_active': parse_bool(first_row.get('is_active', 'TRUE')),
                }

                product, created = Product.objects.update_or_create(defaults=product_vals, **product_lookup)
                if created:
                    summary['created_products'] += 1
                else:
                    summary['updated_products'] += 1

                # ensure product_code set if provided_code present
                if provided_code and product.product_code != provided_code:
                    product.product_code = provided_code
                    product.save()

                created_product_map[product_key] = product

        except Exception as e:
            first_row_idx = data['rows'][0][0]
            summary['errors'].append({
                'row': first_row_idx,
                'error': f'Fila {first_row_idx}: error al procesar producto "{product_key}" — {str(e)}',
                'row_data': original_row_by_idx.get(first_row_idx, {}),
            })

    # Mapas para la segunda pasada
    product_has_specs_by_key = {k: v['has_specs'] for k, v in products_data.items()}
    product_spec_keys_by_key = {k: v['spec_keys'] for k, v in products_data.items()}

    # segunda pasada: procesar variantes (is_variant=true)
    for lineno, variant_row in variant_rows:
        try:
            product_code = (variant_row.get('product_code') or '').strip()
            variant_code = (variant_row.get('variant_code') or variant_row.get('spec_code') or '').strip()

            # Si el variant_code no incluye el product_code como prefijo, lo concatenamos
            if variant_code and product_code and not variant_code.startswith(product_code + '-'):
                variant_code = f'{product_code}-{variant_code}'

            if not variant_code:
                summary['errors'].append({
                    'row': lineno,
                    'error': f'Fila {lineno}: variante sin codigo_variante — completá el campo para poder identificarla.',
                    'row_data': original_row_by_idx.get(lineno, {}),
                })
                continue

            # Buscar el producto padre por product_code
            parent_product = None
            parent_key = None

            for key, prod in created_product_map.items():
                if prod.product_code == product_code:
                    parent_product = prod
                    parent_key = key
                    break

            if not parent_product:
                try:
                    parent_product = Product.objects.get(product_code=product_code)
                except Product.DoesNotExist:
                    summary['errors'].append({
                        'row': lineno,
                        'error': f'Fila {lineno}: producto padre con codigo_producto "{product_code}" no encontrado — debe existir en la base de datos o definirse como producto en el mismo archivo.',
                        'row_data': original_row_by_idx.get(lineno, {}),
                    })
                    continue

            defaults = {}

            variant_obj, created_variant = ProductVariant.objects.update_or_create(
                product=parent_product,
                code=variant_code,
                defaults=defaults
            )

            if created_variant:
                summary['created_variants'] += 1
            else:
                summary['updated_specs'] += 1

            # Procesar TechnicalSpecs si el producto padre tiene is_specs_column=true
            has_specs = product_has_specs_by_key.get(parent_key, False) if parent_key else False
            spec_keys = product_spec_keys_by_key.get(parent_key, []) if parent_key else []
            if has_specs and spec_keys:
                # Eliminar specs existentes de esta variante (y sus TechnicalSpec huérfanos)
                old_vts = VariantTechnicalSpec.objects.filter(variant=variant_obj)
                old_ts_ids = list(old_vts.values_list('technical_spec_id', flat=True))
                old_vts.delete()
                TechnicalSpec.objects.filter(id__in=old_ts_ids).delete()
                # Las key names vienen del producto padre; los values de la fila de la variante
                for col, key_name in zip(spec_columns, spec_keys):
                    if not key_name:
                        continue
                    raw = variant_row.get(col)
                    value = str(raw) if raw is not None else ''
                    ts = TechnicalSpec.objects.create(key=key_name, value=value)
                    VariantTechnicalSpec.objects.create(variant=variant_obj, technical_spec=ts)
                    summary['created_technical_specs'] += 1

        except Exception as e:
            summary['errors'].append({
                'row': lineno,
                'error': f'Fila {lineno}: error al procesar variante "{variant_code}" — {str(e)}',
                'row_data': original_row_by_idx.get(lineno, {}),
            })

    # tercera pasada: relaciones (usando el campo related_product_codes en la primera fila)
    for product_key, product in created_product_map.items():
        first_row = products_data[product_key]['first_row']
        related_codes_field = (first_row.get('related_product_codes') or '').strip()
        if not related_codes_field:
            continue
        codes = [c.strip() for c in related_codes_field.split(';') if c.strip()]
        for to_code in codes:
            if not to_code:
                continue
            # buscar target en created_product_map usando product_code o name fallback
            target = None
            # primero por product_code exacto
            for k, p in created_product_map.items():
                if (p.product_code and p.product_code == to_code) or (k == to_code):
                    target = p
                    break
            if not target:
                # intentar buscar en DB por product_code
                try:
                    target = Product.objects.filter(product_code=to_code).first()
                except Exception:
                    target = None
            if not target:
                first_row_idx = products_data[product_key]['rows'][0][0]
                summary['errors'].append({
                    'row': first_row_idx,
                    'error': f'Fila {first_row_idx}: producto relacionado con código "{to_code}" no encontrado — verificá el código o definilo en el mismo archivo.',
                    'row_data': original_row_by_idx.get(first_row_idx, {}),
                })
                continue
            if target.pk == product.pk:
                continue
            obj, created = ProductRelation.objects.get_or_create(from_product=product, to_product=target)
            if created:
                summary['created_relations'] += 1

    return summary