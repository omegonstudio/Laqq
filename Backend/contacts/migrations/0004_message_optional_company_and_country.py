from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contacts', '0003_message_required_fields_and_phone'),
    ]

    operations = [
        migrations.AlterField(
            model_name='message',
            name='company_name',
            field=models.CharField(blank=True, max_length=120, null=True),
        ),
        migrations.AlterField(
            model_name='message',
            name='country',
            field=models.CharField(blank=True, max_length=80, null=True),
        ),
    ]
