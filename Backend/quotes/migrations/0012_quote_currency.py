from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quotes', '0011_add_specs_to_quote'),
    ]

    operations = [
        migrations.AddField(
            model_name='quote',
            name='currency',
            field=models.CharField(
                choices=[
                    ('ARS', 'Pesos'),
                    ('USD', 'Dólares'),
                    ('EUR', 'Euros'),
                ],
                default='ARS',
                max_length=3,
            ),
        ),
    ]
