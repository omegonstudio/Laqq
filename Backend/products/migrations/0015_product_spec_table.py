from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0014_add_insumo_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='spec_table',
            field=models.JSONField(blank=True, null=True),
        ),
    ]
