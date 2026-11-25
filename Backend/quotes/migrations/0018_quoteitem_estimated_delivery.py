from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quotes', '0017_cleanup_legacy_quote_states'),
    ]

    operations = [
        migrations.AddField(
            model_name='quoteitem',
            name='estimated_delivery',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
    ]
