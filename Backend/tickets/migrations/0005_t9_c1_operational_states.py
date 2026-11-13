"""
T9-C1: campos diagnosed_at/quoted_at, catálogo operativo, remap reversible new→received.

No elimina estados legacy. No toca open/in_progress/waiting_parts/resolved.
"""
import uuid

from django.db import migrations, models
import django.db.models.deletion
from django.utils import timezone


MIGRATION_NAME = 'tickets.0005_t9_c1_operational_states'

OPERATIONAL_STATES = [
    {
        'id': 'received',
        'name': 'Recibido',
        'color': '#3498db',
        'description': 'Solicitud ingresada, pendiente de diagnóstico',
        'is_final': False,
    },
    {
        'id': 'diagnosed',
        'name': 'Diagnosticado',
        'color': '#9b59b6',
        'description': 'El técnico revisó el equipo y determinó el problema',
        'is_final': False,
    },
    {
        'id': 'quoted',
        'name': 'Presupuestado',
        'color': '#f39c12',
        'description': 'Existe un presupuesto comunicado al cliente',
        'is_final': False,
    },
]

CLOSED_DEFAULTS = {
    'name': 'Cerrado',
    'color': '#27ae60',
    'description': 'Servicio técnico finalizado',
    'is_final': True,
}


def seed_operational_states(apps, schema_editor):
    """
    Garantiza los cuatro estados operativos con solo `migrate`
    (received, diagnosed, quoted, closed). No elimina legacy.
    """
    TicketState = apps.get_model('tickets', 'TicketState')
    now = timezone.now()

    all_operational = list(OPERATIONAL_STATES) + [
        {'id': 'closed', **CLOSED_DEFAULTS},
    ]

    for data in all_operational:
        obj, created = TicketState.objects.get_or_create(
            id=data['id'],
            defaults={
                'name': data['name'],
                'color': data['color'],
                'description': data['description'],
                'is_final': data['is_final'],
                'created_at': now,
            },
        )
        if not created:
            obj.name = data['name']
            obj.color = data['color']
            obj.description = data['description']
            obj.is_final = data['is_final']
            obj.save(update_fields=['name', 'color', 'description', 'is_final'])


def unseed_operational_states(apps, schema_editor):
    """
    Reverse del seed: elimina received/diagnosed/quoted solo si ningún ticket los usa.
    No elimina closed ni estados legacy.
    """
    TicketState = apps.get_model('tickets', 'TicketState')
    ServiceTicket = apps.get_model('tickets', 'ServiceTicket')

    for state_id in ('received', 'diagnosed', 'quoted'):
        if ServiceTicket.objects.filter(state_id=state_id).exists():
            continue
        TicketState.objects.filter(id=state_id).delete()


def remap_new_to_received(apps, schema_editor):
    ServiceTicket = apps.get_model('tickets', 'ServiceTicket')
    TicketStateMigrationAudit = apps.get_model('tickets', 'TicketStateMigrationAudit')

    ticket_ids = list(
        ServiceTicket.objects.filter(state_id='new').values_list('id', flat=True)
    )
    if not ticket_ids:
        return

    now = timezone.now()
    TicketStateMigrationAudit.objects.bulk_create(
        [
            TicketStateMigrationAudit(
                id=uuid.uuid4(),
                ticket_id=ticket_id,
                from_state_id='new',
                to_state_id='received',
                migration_name=MIGRATION_NAME,
                migrated_at=now,
            )
            for ticket_id in ticket_ids
        ]
    )
    ServiceTicket.objects.filter(id__in=ticket_ids, state_id='new').update(
        state_id='received'
    )


def reverse_remap_new_to_received(apps, schema_editor):
    """
    Restaura a `new` únicamente tickets auditados que **sigan** en `received`.

    - No modifica tickets en otros estados (p.ej. diagnosticado/cerrado/legado).
    - Solo elimina auditorías de tickets efectivamente restaurados.
    - Limitación: este reverse NO es una reversión temporal del workflow de
      negocio. Un ticket que abandonó `received` y luego volvió a ese estado
      (p.ej. reopen futuro) no se distingue aquí; no está soportado como caso
      de negocio del reverse.
    - El rollback completo de la migración `0005` elimina la tabla
      `ticket_state_migration_audits` (creada en esta misma migración); no
      queda forense de auditoría tras salir de 0005.
    """
    ServiceTicket = apps.get_model('tickets', 'ServiceTicket')
    TicketState = apps.get_model('tickets', 'TicketState')
    TicketStateMigrationAudit = apps.get_model('tickets', 'TicketStateMigrationAudit')

    # Garantizar que 'new' exista para poder restaurar FKs.
    if not TicketState.objects.filter(id='new').exists():
        TicketState.objects.create(
            id='new',
            name='Nuevo',
            color='#3498db',
            description='Ticket recién creado, sin asignar (legado)',
            is_final=False,
            created_at=timezone.now(),
        )

    audits = list(
        TicketStateMigrationAudit.objects.filter(
            migration_name=MIGRATION_NAME,
            from_state_id='new',
            to_state_id='received',
        )
    )
    if not audits:
        return

    restored_ticket_ids = set(
        ServiceTicket.objects.filter(
            id__in=[a.ticket_id for a in audits],
            state_id='received',
        ).values_list('id', flat=True)
    )
    if restored_ticket_ids:
        ServiceTicket.objects.filter(
            id__in=restored_ticket_ids,
            state_id='received',
        ).update(state_id='new')

    # Solo borrar audits de tickets restaurados; conservar el resto hasta el
    # DROP de la tabla si el rollback de 0005 continúa.
    TicketStateMigrationAudit.objects.filter(
        migration_name=MIGRATION_NAME,
        from_state_id='new',
        to_state_id='received',
        ticket_id__in=restored_ticket_ids,
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0004_serviceticket_marca_serviceticket_modelo_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='TicketStateMigrationAudit',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('from_state_id', models.CharField(max_length=50)),
                ('to_state_id', models.CharField(max_length=50)),
                ('migration_name', models.CharField(max_length=255)),
                ('migrated_at', models.DateTimeField(auto_now_add=True)),
                (
                    'ticket',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='state_migration_audits',
                        to='tickets.serviceticket',
                    ),
                ),
            ],
            options={
                'db_table': 'ticket_state_migration_audits',
                'ordering': ['-migrated_at'],
            },
        ),
        migrations.AddIndex(
            model_name='ticketstatemigrationaudit',
            index=models.Index(
                fields=['migration_name', 'from_state_id', 'to_state_id'],
                name='ticket_stat_migrati_7a1c2d_idx',
            ),
        ),
        migrations.AddField(
            model_name='serviceticket',
            name='diagnosed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='serviceticket',
            name='quoted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(seed_operational_states, unseed_operational_states),
        migrations.AlterField(
            model_name='serviceticket',
            name='state',
            field=models.ForeignKey(
                default='received',
                on_delete=django.db.models.deletion.PROTECT,
                related_name='tickets',
                to='tickets.ticketstate',
            ),
        ),
        migrations.RunPython(remap_new_to_received, reverse_remap_new_to_received),
    ]
