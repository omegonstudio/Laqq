# Generated manually - eliminar modelos viejos una vez que quotes ya no los referencia

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0009_producttechnicalspec_productvariant_technicalspec_and_more'),
        ('quotes', '0010_remove_quoteitem_fixed_spec_quoteitem_variant'),
    ]

    operations = [
        migrations.DeleteModel(name='ProductSpec'),
        migrations.DeleteModel(name='ProductSpecification'),
    ]
