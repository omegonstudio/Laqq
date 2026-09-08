import uuid

from django.db import migrations, models
from django.utils.text import slugify


def backfill_brand_slugs(apps, schema_editor):
    Brand = apps.get_model('products', 'Brand')
    used = set(
        Brand.objects.exclude(slug='').values_list('slug', flat=True)
    )
    for brand in Brand.objects.all().order_by('created_at'):
        if brand.slug:
            used.add(brand.slug)
            continue
        base = slugify(brand.name)[:100] or str(uuid.uuid4())[:12]
        candidate = base
        suffix = 2
        while candidate in used:
            candidate = f"{base}-{suffix}"
            suffix += 1
        brand.slug = candidate
        brand.save(update_fields=['slug'])
        used.add(candidate)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0015_product_spec_table'),
    ]

    operations = [
        migrations.AddField(
            model_name='brand',
            name='slug',
            field=models.SlugField(blank=True, db_index=True, default='', max_length=120),
            preserve_default=False,
        ),
        migrations.RunPython(backfill_brand_slugs, noop_reverse),
        migrations.AlterField(
            model_name='brand',
            name='slug',
            field=models.SlugField(blank=True, db_index=True, max_length=120, unique=True),
        ),
    ]
