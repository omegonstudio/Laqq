import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
from django.utils import timezone


def backfill_traces(apps, schema_editor):
    """
    Cotizaciones que ya no están en pending puro (o tienen responsable / sent)
    reciben un evento backfill y managed_at.
    """
    Quote = apps.get_model('quotes', 'Quote')
    QuoteTrace = apps.get_model('quotes', 'QuoteTrace')

    qs = Quote.objects.exclude(state_id='pending').filter(managed_at__isnull=True)
    # También pending con usuario asignado (ya hubo gestión)
    qs_assigned_pending = Quote.objects.filter(
        state_id='pending', user__isnull=False, managed_at__isnull=True
    )

    now = timezone.now()

    def _backfill_one(quote):
        when = quote.updated_at or quote.created_at or now
        trace = QuoteTrace.objects.create(
            id=uuid.uuid4(),
            quote_id=quote.id,
            reason='backfill',
            actor=None,
            snapshot={
                'kind': 'light',
                'note': 'Histórico previo a trazabilidad; sin detalle de cambios.',
                'state_id': quote.state_id,
                'quote_number': quote.quote_number,
                'total_amount': str(quote.total_amount) if quote.total_amount is not None else None,
                'currency': quote.currency,
            },
        )
        QuoteTrace.objects.filter(pk=trace.pk).update(created_at=when)
        Quote.objects.filter(pk=quote.pk).update(managed_at=when)

    for quote in qs.iterator():
        _backfill_one(quote)

    for quote in qs_assigned_pending.iterator():
        if QuoteTrace.objects.filter(quote_id=quote.id).exists():
            continue
        _backfill_one(quote)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('quotes', '0012_quote_currency'),
    ]

    operations = [
        migrations.AddField(
            model_name='quote',
            name='managed_at',
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
        migrations.CreateModel(
            name='QuoteTrace',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('reason', models.CharField(choices=[
                    ('created', 'Creada'),
                    ('updated', 'Editada'),
                    ('assignee_changed', 'Cambio de responsable'),
                    ('state_changed', 'Cambio de estado'),
                    ('sent', 'Enviada al cliente'),
                    ('backfill', 'Histórico (sin detalle)'),
                ], max_length=32)),
                ('snapshot', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('actor', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='quote_traces',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('quote', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='traces',
                    to='quotes.quote',
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='quotetrace',
            index=models.Index(fields=['quote', '-created_at'], name='quotes_trace_quote_created'),
        ),
        migrations.AddIndex(
            model_name='quotetrace',
            index=models.Index(fields=['reason'], name='quotes_trace_reason'),
        ),
        migrations.RunPython(backfill_traces, noop_reverse),
    ]
