import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
import quotes.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('quotes', '0014_rename_quotes_trace_quote_created_quotes_quot_quote_i_9c6c73_idx_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='QuoteVersion',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('version_number', models.PositiveIntegerField()),
                ('version_label', models.CharField(max_length=120)),
                ('reason', models.CharField(
                    choices=[
                        ('saved', 'Guardada'),
                        ('sent', 'Enviada'),
                        ('state_changed', 'Cambio de estado'),
                        ('assignee_changed', 'Cambio de responsable'),
                    ],
                    default='saved',
                    max_length=32,
                )),
                ('snapshot', models.JSONField(blank=True, default=dict)),
                ('pdf', models.FileField(
                    blank=True,
                    null=True,
                    upload_to=quotes.models.quote_version_pdf_upload_to,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('actor', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='quote_versions',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('quote', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='versions',
                    to='quotes.quote',
                )),
            ],
            options={
                'ordering': ['-version_number'],
                'unique_together': {('quote', 'version_number')},
            },
        ),
        migrations.AddIndex(
            model_name='quoteversion',
            index=models.Index(fields=['quote', '-version_number'], name='quotes_quot_quote_i_vnum_idx'),
        ),
    ]
