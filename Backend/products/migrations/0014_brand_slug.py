import uuid

from django.db import migrations, models
from django.utils.text import slugify


def forwards(apps, schema_editor):
    """DDL + backfill en SQL: el modelo histórico aún no conoce `slug`."""
    schema_editor.deferred_sql = [
        sql
        for sql in schema_editor.deferred_sql
        if 'products_brand_slug' not in str(sql)
    ]

    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            'DROP INDEX IF EXISTS products_brand_slug_925fd11b_like'
        )
        cursor.execute(
            'DROP INDEX IF EXISTS products_brand_slug_925fd11b'
        )
        cursor.execute(
            """
            ALTER TABLE products_brand
            ADD COLUMN IF NOT EXISTS slug varchar(120) NULL
            """
        )

        cursor.execute(
            'SELECT id, name, slug FROM products_brand ORDER BY created_at'
        )
        rows = cursor.fetchall()

        used = {slug for _, _, slug in rows if slug}
        updates = []
        for brand_id, name, slug in rows:
            if slug:
                used.add(slug)
                continue
            base = slugify(name)[:100] or str(uuid.uuid4())[:12]
            candidate = base
            suffix = 2
            while candidate in used:
                candidate = f'{base}-{suffix}'
                suffix += 1
            used.add(candidate)
            updates.append((candidate, brand_id))

        for candidate, brand_id in updates:
            cursor.execute(
                'UPDATE products_brand SET slug = %s WHERE id = %s',
                [candidate, brand_id],
            )

        cursor.execute(
            "UPDATE products_brand SET slug = '' WHERE slug IS NULL"
        )
        cursor.execute(
            'ALTER TABLE products_brand ALTER COLUMN slug SET NOT NULL'
        )
        cursor.execute(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'products_brand_slug_key'
                ) THEN
                    ALTER TABLE products_brand
                    ADD CONSTRAINT products_brand_slug_key UNIQUE (slug);
                END IF;
            END $$;
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS products_brand_slug_925fd11b_like
            ON products_brand (slug varchar_pattern_ops)
            """
        )

    schema_editor.deferred_sql = [
        sql
        for sql in schema_editor.deferred_sql
        if 'products_brand_slug' not in str(sql)
    ]


def backwards(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            'DROP INDEX IF EXISTS products_brand_slug_925fd11b_like'
        )
        cursor.execute(
            'DROP INDEX IF EXISTS products_brand_slug_925fd11b'
        )
        cursor.execute(
            'ALTER TABLE products_brand '
            'DROP CONSTRAINT IF EXISTS products_brand_slug_key'
        )
        cursor.execute(
            'ALTER TABLE products_brand DROP COLUMN IF EXISTS slug'
        )


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0013_alter_productvariant_options'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name='brand',
                    name='slug',
                    field=models.SlugField(
                        blank=True, max_length=120, unique=True
                    ),
                ),
            ],
            database_operations=[
                migrations.RunPython(forwards, backwards),
            ],
        ),
    ]
