import csv
import json
import uuid
import logging
import os
from io import BytesIO, StringIO

from django.conf import settings
from django.db import transaction

# openpyxl para leer .xlsx
try:
    import openpyxl
except Exception:
    openpyxl = None

from .models import Brand, Category, Product, ProductSpec, ProductRelation
from attachments.models import Attachment
from integrations.http import HttpClient
from integrations.http.errors import HttpClientConfigError, HttpClientError, HttpClientResponseError

REQUEST_TIMEOUT = 15
logger = logging.getLogger(__name__)

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

def _generate_attachment_from_url(image_url, *, summary=None):
    """
    Descarga la URL y crea un Attachment. Devuelve el Attachment o None.
    Aplica validaciones básicas (host permitido, tamaño) y respeta el feature flag
    ENABLE_PRODUCT_IMAGE_DOWNLOADS.
    """
    if not getattr(settings, 'ENABLE_PRODUCT_IMAGE_DOWNLOADS', True):
        logger.info("Descarga de imágenes deshabilitada por configuración")
        return None

    try:
        binary = image_http_client.fetch_binary(image_url)
    except (HttpClientConfigError, HttpClientResponseError, HttpClientError) as exc:
        logger.warning("No se pudo descargar %s: %s", image_url, exc)
        if summary is not None:
            summary['errors'].append({'image_url': image_url, 'error': str(exc)})
        return None

    filename = binary.filename or f'{uuid.uuid4().hex[:12]}.bin'
    att = Attachment.objects.create(
        file_name=filename,
        content_type=binary.content_type,
        size_bytes=len(binary.content),
        data=binary.content
    )
    return att

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

def _get_or_create_category_by_path(path, category_cache, summary):
    if not path:
        return None
    path = path.strip()
    if path in category_cache:
        return category_cache[path]
    parts = [p.strip() for p in path.split('>') if p.strip()]
    parent = None
    cur_path = []
    for part in parts:
        cur_path.append(part)
        key = '>'.join(cur_path)
        if key in category_cache:
            parent = category_cache[key]
            continue
        obj, created = Category.objects.get_or_create(name=part, parent=parent, defaults={'description': '', 'display_order': 0})
        category_cache[key] = obj
        parent = obj
        if created:
            summary['created_categories'] += 1
    category_cache[path] = parent
    return parent

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
        # row puede contener tipos diversos; convertir a str o dejar None
        d = {}
        for idx, h in enumerate(headers):
            if not h:
                continue
            val = row[idx] if idx < len(row) else None
            # normalizar valores simples: dejar como string si no es None, para que el resto del código funcione igual
            if val is None:
                d[h] = ''
            elif isinstance(val, str):
                d[h] = val
            else:
                # para fechas/números convertimos a string
                d[h] = str(val)
        rows.append(d)
    return rows

def import_products_csv(fileobj, *, encoding='utf-8', create_missing=True, skip_downloads=False):
    """
    Funciona tanto con CSV como con Excel (.xlsx).
    fileobj: objeto tipo UploadedFile o file-like. Se detecta la extensión por fileobj.name si está disponible.
    Retorna un dict resumen con contadores y errores.
    CSV/Excel debe contener columnas (recomendadas):
      product_code, name, brand, category_path (o category), description, image_url, is_active, related_product_codes, spec_code, volume, dimensions, cap, outlet, accuracy, precision, additional_specs
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

    # agrupar por product_code (permitiendo product_code vacío -> se agrupa por nombre)
    products_data = {}
    errors = []
    for idx, row in enumerate(rows, start=2):
        # Las claves pueden venir con espacios o mayúsculas en Excel; normalizamos utilizando las claves originales
        # Convertimos todas las claves a lower_snake para mayor tolerancia (opcional)
        # Aquí asumimos que el CSV/Excel usa las mismas cabeceras que antes.
        code = (row.get('product_code') or row.get('product code') or '').strip()
        key = code or (row.get('name') or '').strip()
        if not key:
            errors.append({'row': idx, 'error': 'Falta product_code y name'})
            continue
        products_data.setdefault(key, {'rows': [], 'first_row': row}).get('rows').append((idx, row))

    summary = {
        'created_brands': 0,
        'created_categories': 0,
        'created_attachments': 0,
        'created_products': 0,
        'updated_products': 0,
        'created_specs': 0,
        'updated_specs': 0,
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

                # category
                cat_path = (first_row.get('category_path') or first_row.get('category') or '').strip()
                category = _get_or_create_category_by_path(cat_path, category_cache, summary) if (cat_path or create_missing) else None
                if cat_path and not category and not create_missing:
                    raise ValueError(f"Category '{cat_path}' not found and create_missing=False")

                # image attachment
                image_url = (first_row.get('image_url') or '').strip()
                image_attachment = None
                if image_url and not skip_downloads:
                    att = _generate_attachment_from_url(image_url, summary=summary)
                    if att:
                        image_attachment = att
                        summary['created_attachments'] += 1

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

                # specs (puede haber varias filas)
                for lineno, spec_row in rows_for_product:
                    spec_code = (spec_row.get('spec_code') or '').strip()
                    if not spec_code:
                        # si no existe spec_code, omitimos (evita crear specs sin clave)
                        continue
                    try:
                        defaults = {
                            'volume': spec_row.get('volume') or None,
                            'dimensions': spec_row.get('dimensions') or None,
                            'cap': spec_row.get('cap') or None,
                            'outlet': spec_row.get('outlet') or None,
                            'accuracy': spec_row.get('accuracy') or None,
                            'precision': spec_row.get('precision') or None,
                            'additional_specs': None
                        }
                        additional = spec_row.get('additional_specs')
                        if additional:
                            try:
                                defaults['additional_specs'] = json.loads(additional)
                            except Exception:
                                defaults['additional_specs'] = additional

                        # Upsert: buscar por product + code y actualizar o crear
                        obj, created_spec = ProductSpec.objects.update_or_create(
                            product=product,
                            code=spec_code,
                            defaults=defaults
                        )
                        if created_spec:
                            summary['created_specs'] += 1
                        else:
                            summary['updated_specs'] += 1
                    except Exception as e:
                        summary['errors'].append({'row': lineno, 'error': f"Error creando/actualizando spec para {product_key}: {e}"})

        except Exception as e:
            summary['errors'].append({'product': product_key, 'error': str(e)})

    # segunda pasada: relaciones (usando el campo related_product_codes en la primera fila)
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
                summary['errors'].append({'product': product_key, 'error': f'related product code {to_code} not found'})
                continue
            if target.pk == product.pk:
                continue
            obj, created = ProductRelation.objects.get_or_create(from_product=product, to_product=target)
            if created:
                summary['created_relations'] += 1

    return summary