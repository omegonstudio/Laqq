from django.db import migrations

KNOWN = {
    'abierto',
    'enviado',
    'enviado_fuera',
    'aceptado',
    'rechazado',
    'cerrado',
}


def forwards(apps, schema_editor):
    QuoteState = apps.get_model('quotes', 'QuoteState')
    Quote = apps.get_model('quotes', 'Quote')
    legacy_ids = list(
        QuoteState.objects.exclude(id__in=KNOWN).values_list('id', flat=True)
    )
    if not legacy_ids:
        return
    Quote.objects.filter(state_id__in=legacy_ids).update(state_id='abierto')
    QuoteState.objects.filter(id__in=legacy_ids).delete()


def backwards(apps, schema_editor):
    # No-op: no restauramos catálogos legacy.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('quotes', '0016_quote_states_catalog'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
