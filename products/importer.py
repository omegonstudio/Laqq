import csv
import json
import uuid
import requests
import os
from urllib.parse import urlparse
from django.utils.text import slugify
from django.db import transaction

from .models import Brand, Category, Product, ProductSpec, ProductRelation
from attachments.models import Attachment

REQUEST_TIMEOUT = 15

def parse_bool(value):
    if value is None:
        return False
    v = str(value).strip().lower()
    return v in ('1', 'true', 'yes', 'y', 't')

def _generate_attachment_from_url(image_url, timeout=REQUEST_TIMEOUT):
    """
    Descarga la URL y crea un Attachment. Devuelve el Attachment o None.
    """
    try:
        r = requests.get(image_url, timeout=timeout)
        r.raise_for_status()
        filename = os.path.basename(urlparse(image_url).path) or f'{uuid.uuid4().hex[:12]}.bin'
        content_type = r.headers.get('Content-Type', '')
        data_bytes = r.content
        att = Attachment.objects.create(
            file_name=filename,
            content_type=content_type,
            size_bytes=len(data_bytes),
            data=data_bytes
        )
        return att
    except Exception:
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

def import_products_csv(fileobj, *, encoding='utf-8', create_missing=True, skip_downloads=False):
    """
    fileobj: file-like object (bytes or text). If bytes, se decodifica.
    Retorna un dict resumen con contadores y errores.
    CSV debe contener columnas (recomendadas):
      product_code, name, brand, category_path (o category), description, image_url, is_active, related_product_codes, spec_code, volume, dimensions, cap, outlet, accuracy, precision, additional_specs
    """
    # leer contenido
    if hasattr(fileobj, 'read'):
        raw = fileobj.read()
    else:
        raw = fileobj

    if isinstance(raw, bytes):
        text = raw.decode(encoding)
    else:
        text = raw

    reader = csv.DictReader(text.splitlines())
    rows = [r for r in reader]
    if not rows:
        return {'error': 'CSV vacío'}

    # agrupar por product_code (permitiendo product_code vacío -> se agrupa por nombre)
    products_data = {}
    errors = []
    for idx, row in enumerate(rows, start=2):
        code = (row.get('product_code') or '').strip()
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
                brand_name = first_row.get('brand', '').strip()
                brand = _get_or_create_brand(brand_name, brand_cache, summary) if (brand_name or create_missing) else None
                if brand_name and not brand and not create_missing:
                    raise ValueError(f"Brand '{brand_name}' not found and create_missing=False")

                # category
                cat_path = first_row.get('category_path', '').strip() or first_row.get('category', '').strip()
                category = _get_or_create_category_by_path(cat_path, category_cache, summary) if (cat_path or create_missing) else None
                if cat_path and not category and not create_missing:
                    raise ValueError(f"Category '{cat_path}' not found and create_missing=False")

                # image attachment
                image_url = first_row.get('image_url', '').strip()
                image_attachment = None
                if image_url and not skip_downloads:
                    att = _generate_attachment_from_url(image_url)
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
                        product_lookup = {'name': first_row.get('name', '').strip(), 'brand': brand}
                    else:
                        product_lookup = {'name': first_row.get('name', '').strip()}

                product_vals = {
                    'name': first_row.get('name', '').strip(),
                    'brand': brand,
                    'category': category,
                    'description': first_row.get('description', '').strip() or None,
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