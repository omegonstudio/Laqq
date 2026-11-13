from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0005_t9_c1_operational_states'),
    ]

    operations = [
        migrations.AddField(
            model_name='serviceticket',
            name='internal_notes',
            field=models.TextField(blank=True, null=True),
        ),
    ]
