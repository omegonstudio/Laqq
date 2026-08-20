from django.db import migrations, models


def fill_message_nulls(apps, schema_editor):
    Message = apps.get_model('contacts', 'Message')
    Message.objects.filter(company_name__isnull=True).update(company_name='')
    Message.objects.filter(first_name__isnull=True).update(first_name='')
    Message.objects.filter(last_name__isnull=True).update(last_name='')
    Message.objects.filter(country__isnull=True).update(country='')


class Migration(migrations.Migration):

    dependencies = [
        ('contacts', '0002_add_email_to_message'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='phone',
            field=models.CharField(default='', max_length=30),
            preserve_default=False,
        ),
        migrations.RunPython(fill_message_nulls, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='message',
            name='company_name',
            field=models.CharField(max_length=120),
        ),
        migrations.AlterField(
            model_name='message',
            name='country',
            field=models.CharField(max_length=80),
        ),
        migrations.AlterField(
            model_name='message',
            name='first_name',
            field=models.CharField(max_length=80),
        ),
        migrations.AlterField(
            model_name='message',
            name='last_name',
            field=models.CharField(max_length=80),
        ),
    ]
