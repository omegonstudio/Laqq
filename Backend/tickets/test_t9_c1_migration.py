"""
T9-C1: pruebas de migración (forward/reverse), integridad FK y seed.

Limitación conocida (no soportada como comportamiento de negocio):
si un ticket migrado new→received abandona received y luego vuelve a received
(p.ej. reopen futuro), un reverse tardío puede restaurarlo a new. El reverse
de migración no es time-travel del workflow.
"""
import uuid

from django.core.management import call_command
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase


MIGRATE_FROM = [('tickets', '0004_serviceticket_marca_serviceticket_modelo_and_more')]
MIGRATE_TO = [('tickets', '0005_t9_c1_operational_states')]
MIGRATE_HEAD = [('tickets', '0006_serviceticket_internal_notes')]
OPERATIONAL_IDS = ('received', 'diagnosed', 'quoted', 'closed')
LEGACY_IDS = ('new', 'open', 'in_progress', 'waiting_parts', 'resolved')


def _table_exists(table_name: str) -> bool:
    with connection.cursor() as cursor:
        tables = connection.introspection.table_names(cursor)
    return table_name in tables


def _ensure_tickets_at_head():
    """Deja el esquema tickets en head (0006) para no contaminar tests posteriores."""
    executor = MigrationExecutor(connection)
    executor.loader.build_graph()
    executor.migrate(MIGRATE_HEAD)


class T9C1FreshInstallMigrationTestCase(TransactionTestCase):
    """Install limpia: solo migrate, sin TicketState previos ni populate."""

    def tearDown(self):
        _ensure_tickets_at_head()
        super().tearDown()

    def test_migrate_creates_four_operational_states_without_prior_seed(self):
        executor = MigrationExecutor(connection)
        executor.migrate(MIGRATE_FROM)
        apps_before = executor.loader.project_state(MIGRATE_FROM).apps
        TicketState = apps_before.get_model('tickets', 'TicketState')
        TicketState.objects.all().delete()
        self.assertEqual(TicketState.objects.count(), 0)

        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(MIGRATE_TO)
        apps_after = executor.loader.project_state(MIGRATE_TO).apps
        TicketState = apps_after.get_model('tickets', 'TicketState')

        for sid in OPERATIONAL_IDS:
            self.assertTrue(
                TicketState.objects.filter(id=sid).exists(),
                f'faltaba estado operativo {sid} tras migrate en DB vacía',
            )
        closed = TicketState.objects.get(id='closed')
        self.assertEqual(closed.name, 'Cerrado')
        self.assertTrue(closed.is_final)


class T9C1MigrationTestCase(TransactionTestCase):
    """Aplica 0004 → siembra datos → 0005; casos forward/reverse."""

    def setUp(self):
        super().setUp()
        executor = MigrationExecutor(connection)
        executor.migrate(MIGRATE_FROM)
        self.apps_before = executor.loader.project_state(MIGRATE_FROM).apps
        self._seed_before_migration()
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(MIGRATE_TO)
        self.apps_after = executor.loader.project_state(MIGRATE_TO).apps

    def tearDown(self):
        _ensure_tickets_at_head()
        super().tearDown()

    def _seed_before_migration(self):
        apps = self.apps_before
        TicketState = apps.get_model('tickets', 'TicketState')
        TicketPriority = apps.get_model('tickets', 'TicketPriority')
        ServiceTicket = apps.get_model('tickets', 'ServiceTicket')
        Contact = apps.get_model('contacts', 'Contact')
        ContactState = apps.get_model('contacts', 'ContactState')

        from django.utils import timezone

        now = timezone.now()
        for state_id, name, is_final in [
            ('new', 'Nuevo', False),
            ('open', 'Abierto', False),
            ('in_progress', 'En progreso', False),
            ('waiting_parts', 'Esperando repuestos', False),
            ('resolved', 'Resuelto', False),
            ('closed', 'Cerrado', True),
        ]:
            TicketState.objects.get_or_create(
                id=state_id,
                defaults={
                    'name': name,
                    'color': '#000000',
                    'description': name,
                    'is_final': is_final,
                    'created_at': now,
                },
            )

        TicketPriority.objects.get_or_create(
            id='medium',
            defaults={
                'name': 'Media',
                'level': 2,
                'color': '#3498db',
                'description': 'Media',
                'created_at': now,
            },
        )

        contact_state, _ = ContactState.objects.get_or_create(
            id='active',
            defaults={'name': 'Active', 'created_at': now},
        )
        contact_kwargs = {
            'email': 't9c1-migration@example.com',
            'first_name': 'T9',
            'last_name': 'C1',
            'state': contact_state,
        }
        try:
            contact = Contact.objects.create(id=uuid.uuid4(), **contact_kwargs)
        except TypeError:
            contact = Contact.objects.create(**contact_kwargs)

        self.ticket_ids_by_state = {}
        for state_id in (
            'new',
            'open',
            'in_progress',
            'waiting_parts',
            'resolved',
            'closed',
        ):
            ticket = ServiceTicket.objects.create(
                id=uuid.uuid4(),
                ticket_number=f'T-C1-{state_id}'[:20],
                contact_id=contact.id,
                product_name='Prod C1',
                description='Ticket de prueba migración T9-C1 con descripción suficiente.',
                state_id=state_id,
                priority_id='medium',
                producto_laqq=True,
                numero_de_serie='SN-C1',
                marca='',
                modelo='',
            )
            self.ticket_ids_by_state[state_id] = ticket.id

        self.new_ticket_id = self.ticket_ids_by_state['new']

    def test_forward_remaps_only_new_and_adds_fields_and_states(self):
        ServiceTicket = self.apps_after.get_model('tickets', 'ServiceTicket')
        TicketState = self.apps_after.get_model('tickets', 'TicketState')
        Audit = self.apps_after.get_model('tickets', 'TicketStateMigrationAudit')

        for sid in OPERATIONAL_IDS:
            self.assertTrue(TicketState.objects.filter(id=sid).exists(), sid)

        closed = TicketState.objects.get(id='closed')
        self.assertEqual(closed.name, 'Cerrado')
        self.assertTrue(closed.is_final)

        for sid in LEGACY_IDS:
            self.assertTrue(TicketState.objects.filter(id=sid).exists(), sid)

        remapped = ServiceTicket.objects.get(id=self.new_ticket_id)
        self.assertEqual(remapped.state_id, 'received')

        for sid in ('open', 'in_progress', 'waiting_parts', 'resolved', 'closed'):
            t = ServiceTicket.objects.get(id=self.ticket_ids_by_state[sid])
            self.assertEqual(t.state_id, sid)

        self.assertFalse(ServiceTicket.objects.filter(state_id__isnull=True).exists())

        audits = Audit.objects.filter(
            migration_name='tickets.0005_t9_c1_operational_states',
            from_state_id='new',
            to_state_id='received',
        )
        self.assertEqual(audits.count(), 1)
        self.assertEqual(audits.get().ticket_id, self.new_ticket_id)

        t = ServiceTicket.objects.get(id=self.new_ticket_id)
        self.assertIsNone(t.diagnosed_at)
        self.assertIsNone(t.quoted_at)

        orphan = [
            row.state_id
            for row in ServiceTicket.objects.all()
            if not TicketState.objects.filter(id=row.state_id).exists()
        ]
        self.assertEqual(orphan, [])

        self.assertTrue(_table_exists('ticket_state_migration_audits'))

    def test_reverse_restores_only_still_received(self):
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(MIGRATE_FROM)
        apps = executor.loader.project_state(MIGRATE_FROM).apps
        ServiceTicket = apps.get_model('tickets', 'ServiceTicket')

        restored = ServiceTicket.objects.get(id=self.new_ticket_id)
        self.assertEqual(restored.state_id, 'new')

        for sid in ('open', 'in_progress', 'waiting_parts', 'resolved', 'closed'):
            t = ServiceTicket.objects.get(id=self.ticket_ids_by_state[sid])
            self.assertEqual(t.state_id, sid)

        self.assertFalse(ServiceTicket.objects.filter(state_id__isnull=True).exists())
        self.assertFalse(_table_exists('ticket_state_migration_audits'))

    def test_reverse_does_not_overwrite_ticket_moved_off_received(self):
        """Tras forward, si el ticket deja received, reverse no lo toca."""
        import importlib

        mig = importlib.import_module(
            'tickets.migrations.0005_t9_c1_operational_states'
        )

        ServiceTicket = self.apps_after.get_model('tickets', 'ServiceTicket')
        Audit = self.apps_after.get_model('tickets', 'TicketStateMigrationAudit')

        # Simular cambio legítimo posterior al forward (sin C2).
        ServiceTicket.objects.filter(id=self.new_ticket_id).update(state_id='open')
        self.assertEqual(
            ServiceTicket.objects.get(id=self.new_ticket_id).state_id,
            'open',
        )
        self.assertEqual(
            Audit.objects.filter(
                migration_name='tickets.0005_t9_c1_operational_states',
                ticket_id=self.new_ticket_id,
            ).count(),
            1,
        )

        # Reverse RunPython solo: no toca el ticket ni borra su auditoría.
        mig.reverse_remap_new_to_received(self.apps_after, None)
        self.assertEqual(
            ServiceTicket.objects.get(id=self.new_ticket_id).state_id,
            'open',
        )
        self.assertEqual(
            Audit.objects.filter(
                migration_name='tickets.0005_t9_c1_operational_states',
                ticket_id=self.new_ticket_id,
            ).count(),
            1,
        )

        # Rollback completo de 0005: sí elimina la tabla de auditoría.
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(MIGRATE_FROM)
        apps = executor.loader.project_state(MIGRATE_FROM).apps
        ServiceTicket = apps.get_model('tickets', 'ServiceTicket')

        self.assertEqual(
            ServiceTicket.objects.get(id=self.new_ticket_id).state_id,
            'open',
        )
        self.assertFalse(_table_exists('ticket_state_migration_audits'))


class T9C1PopulateSeedTestCase(TransactionTestCase):
    """Seed idempotente con esquema en 0005 (hermanos MigrationTestCase pueden dejar 0004)."""

    def test_populate_twice_idempotent_and_keeps_tickets(self):
        # Restaurar head (0006) por si un test de migración previo hizo reverse.
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(MIGRATE_HEAD)

        from contacts.models import Contact, ContactState
        from tickets.models import ServiceTicket, TicketPriority, TicketState

        contact_state, _ = ContactState.objects.get_or_create(
            id='active',
            defaults={'name': 'Active'},
        )
        contact = Contact.objects.create(
            email='t9c1-populate@example.com',
            first_name='Pop',
            last_name='Twice',
            state=contact_state,
        )
        TicketPriority.objects.get_or_create(
            id='medium',
            defaults={'name': 'Media', 'level': 2, 'color': '#3498db'},
        )
        received, _ = TicketState.objects.get_or_create(
            id='received',
            defaults={
                'name': 'Recibido',
                'color': '#3498db',
                'is_final': False,
            },
        )
        ticket = ServiceTicket.objects.create(
            ticket_number='T-C1-POP-00001',
            contact=contact,
            product_name='Seed Guard',
            description='Ticket de control para populate idempotente T9-C1.',
            state=received,
            priority_id='medium',
            numero_de_serie='SN-POP',
        )
        ticket_id = ticket.id
        state_before = ticket.state_id
        description_before = ticket.description

        call_command('populate_ticket_data', verbosity=0)
        call_command('populate_ticket_data', verbosity=0)

        for sid in OPERATIONAL_IDS + LEGACY_IDS:
            self.assertTrue(TicketState.objects.filter(id=sid).exists(), sid)

        self.assertEqual(TicketState.objects.filter(id='received').count(), 1)
        self.assertEqual(TicketState.objects.get(id='received').name, 'Recibido')
        self.assertEqual(TicketState.objects.get(id='closed').name, 'Cerrado')

        ticket.refresh_from_db()
        self.assertEqual(ticket.id, ticket_id)
        self.assertEqual(ticket.state_id, state_before)
        self.assertEqual(ticket.description, description_before)
