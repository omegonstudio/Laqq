# Generated manually - refactor ProductSpec -> ProductVariant, ProductSpecification -> TechnicalSpec

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0008_alter_product_brand_alter_product_category'),
    ]

    operations = [
        # 1. Crear TechnicalSpec (standalone)
        migrations.CreateModel(
            name='TechnicalSpec',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('key', models.CharField(max_length=100)),
                ('value', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Especificación Técnica',
                'verbose_name_plural': 'Especificaciones Técnicas',
                'ordering': ['key'],
            },
        ),

        # 2. Crear ProductVariant (reemplaza ProductSpec)
        migrations.CreateModel(
            name='ProductVariant',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('code', models.CharField(max_length=120)),
                ('name', models.CharField(blank=True, default='', max_length=255)),
                ('dimensions', models.CharField(blank=True, max_length=100, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('product', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='variants',
                    to='products.product',
                )),
            ],
        ),
        migrations.AddConstraint(
            model_name='productvariant',
            constraint=models.UniqueConstraint(
                fields=('product', 'code'),
                name='unique_variant_per_product_code',
            ),
        ),

        # 3. Crear tabla intermedia Product <-> TechnicalSpec
        migrations.CreateModel(
            name='ProductTechnicalSpec',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('product', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='product_technical_specs',
                    to='products.product',
                )),
                ('technical_spec', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='product_links',
                    to='products.technicalspec',
                )),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='producttechnicalspec',
            unique_together={('product', 'technical_spec')},
        ),

        # 4. Crear tabla intermedia ProductVariant <-> TechnicalSpec
        migrations.CreateModel(
            name='VariantTechnicalSpec',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('variant', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='variant_technical_specs',
                    to='products.productvariant',
                )),
                ('technical_spec', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='variant_links',
                    to='products.technicalspec',
                )),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='varianttechnicalspec',
            unique_together={('variant', 'technical_spec')},
        ),

        # 5. Agregar M2M en Product
        migrations.AddField(
            model_name='product',
            name='technical_specs',
            field=models.ManyToManyField(
                blank=True,
                related_name='products',
                through='products.ProductTechnicalSpec',
                to='products.technicalspec',
            ),
        ),

        # 6. Agregar M2M en ProductVariant
        migrations.AddField(
            model_name='productvariant',
            name='technical_specs',
            field=models.ManyToManyField(
                blank=True,
                related_name='product_variants',
                through='products.VariantTechnicalSpec',
                to='products.technicalspec',
            ),
        ),
    ]
