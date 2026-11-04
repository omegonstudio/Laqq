import django.db.models.deletion
from django.db import migrations, models


OLD_TO_NEW = {
    'pending': 'abierto',
    'assigned': 'abierto',
    'sent': 'enviado',
    'confirmed': 'aceptado',
    'rejected': 'rechazado',
    'expired': 'cerrado',
}

NEW_STATES = [
    {
        'id': 'abierto',
        'name': 'Abierto',
        'color': '#f39c12',
        'description': 'Cotización abierta / en curso',
    },
    {
        'id': 'enviado',
        'name': 'Enviado',
        'color': '#3498db',
        'description': 'Cotización enviada al cliente desde el sistema',
    },
    {
        'id': 'enviado_fuera',
        'name': 'Enviado por fuera del sistema',
        'color': '#2980b9',
        'description': 'Cotización enviada por un canal externo',
    },
    {
        'id': 'aceptado',
        'name': 'Aceptado',
        'color': '#27ae60',
        'description': 'Cotización aceptada por el cliente',
    },
    {
        'id': 'rechazado',
        'name': 'Rechazado',
        'color': '#e74c3c',
        'description': 'Cotización rechazada por el cliente',
    },
    {
        'id': 'cerrado',
        'name': 'Cerrado',
        'color': '#95a5a6',
        'description': 'Cotización cerrada',
    },
]


def forwards(apps, schema_editor):
    QuoteState = apps.get_model('quotes', 'QuoteState')
    Quote = apps.get_model('quotes', 'Quote')

    for state in NEW_STATES:
        QuoteState.objects.update_or_create(
            id=state['id'],
            defaults={
                'name': state['name'],
                'color': state['color'],
                'description': state['description'],
            },
        )

    for old_id, new_id in OLD_TO_NEW.items():
        Quote.objects.filter(state_id=old_id).update(state_id=new_id)

    # Cualquier estado desconocido residual → abierto
    known = {s['id'] for s in NEW_STATES}
    Quote.objects.exclude(state_id__in=known).update(state_id='abierto')

    QuoteState.objects.exclude(id__in=known).delete()


def backwards(apps, schema_editor):
    QuoteState = apps.get_model('quotes', 'QuoteState')
    Quote = apps.get_model('quotes', 'Quote')

    legacy = [
        {'id': 'pending', 'name': 'Pendiente', 'color': '#f39c12', 'description': ''},
        {'id': 'assigned', 'name': 'Asignada', 'color': '#8e44ad', 'description': ''},
        {'id': 'sent', 'name': 'Enviada', 'color': '#3498db', 'description': ''},
        {'id': 'confirmed', 'name': 'Confirmada', 'color': '#27ae60', 'description': ''},
        {'id': 'rejected', 'name': 'Rechazada', 'color': '#e74c3c', 'description': ''},
        {'id': 'expired', 'name': 'Vencida', 'color': '#95a5a6', 'description': ''},
    ]
    for state in legacy:
        QuoteState.objects.update_or_create(
            id=state['id'],
            defaults={
                'name': state['name'],
                'color': state['color'],
                'description': state['description'],
            },
        )

    reverse_map = {
        'abierto': 'pending',
        'enviado': 'sent',
        'enviado_fuera': 'sent',
        'aceptado': 'confirmed',
        'rechazado': 'rejected',
        'cerrado': 'expired',
    }
    for new_id, old_id in reverse_map.items():
        Quote.objects.filter(state_id=new_id).update(state_id=old_id)

    QuoteState.objects.filter(
        id__in=['abierto', 'enviado', 'enviado_fuera', 'aceptado', 'rechazado', 'cerrado']
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('quotes', '0015_quoteversion'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
        migrations.AlterField(
            model_name='quote',
            name='state',
            field=models.ForeignKey(
                default='abierto',
                on_delete=django.db.models.deletion.PROTECT,
                to='quotes.quotestate',
            ),
        ),
    ]
