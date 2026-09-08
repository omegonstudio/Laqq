import uuid

from django.db import migrations, models
from django.utils.text import slugify


def backfill_brand_slugs(apps, schema_editor):
    Brand = apps.get_model('products', 'Brand')
    used = set(
        Brand.objects.exclude(slug__isnull=True)
        .exclude(slug='')
        .values_list('slug', flat=True)
    )
    for brand in Brand.objects.all().order_by('created_at'):
        if brand.slug:
            used.add(brand.slug)
            continue
        base = slugify(brand.name)[:100] or str(uuid.uuid4())[:12]
        candidate = base
        suffix = 2
        while candidate in used:
            candidate = f'{base}-{suffix}'
            suffix += 1
        brand.slug = candidate
        brand.save(update_fields=['slug'])
        used.add(candidate)


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0013_alter_productvariant_options'),
    ]

    operations = [
        # db_index=False explícito: SlugField defaultea db_index=True y en
        # Postgres eso + unique=True encola products_brand_slug_*_like 2 veces.
        migrations.AddField(
            model_name='brand',
            name='slug',
            field=models.SlugField(
                blank=True, db_index=False, max_length=120, null=True
            ),
        ),
        migrations.RunPython(backfill_brand_slugs, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='brand',
            name='slug',
            field=models.SlugField(
                blank=True, db_index=False, max_length=120, unique=True
            ),
        ),
    ]
