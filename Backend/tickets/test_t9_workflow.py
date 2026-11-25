"""
T9: workflow operativo, permisos, notas internas, export, PUT freeze.
"""
from io import BytesIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from contacts.models import Contact, ContactState
from users.models import UserType, UserState
from tickets.models import ServiceTicket, TicketState, TicketPriority

User = get_user_model()


class T9WorkflowBase(APITestCase):
    def setUp(self):
        self.admin_type, _ = UserType.objects.get_or_create(
            id='admin', defaults={'name': 'Administrador'}
        )
        self.back_type, _ = UserType.objects.get_or_create(
            id='back', defaults={'name': 'Back Office'}
        )
        self.back_full_type, _ = UserType.objects.get_or_create(
            id='back_full', defaults={'name': 'Back Office Full'}
        )
        self.st_type, _ = UserType.objects.get_or_create(
            id='servicio_tecnico', defaults={'name': 'Servicio Técnico'}
        )
        self.client_type, _ = UserType.objects.get_or_create(
            id='client', defaults={'name': 'Cliente'}
        )
        self.active_state, _ = UserState.objects.get_or_create(
            id='active', defaults={'name': 'Activo'}
        )

        for sid, name, final in [
            ('received', 'Recibido', False),
            ('diagnosed', 'Diagnosticado', False),
            ('quoted', 'Presupuestado', False),
            ('closed', 'Cerrado', True),
            ('new', 'Nuevo', False),
            ('open', 'Abierto', False),
            ('in_progress', 'En progreso', False),
            ('waiting_parts', 'Esperando', False),
            ('resolved', 'Resuelto', False),
        ]:
            TicketState.objects.get_or_create(
                id=sid,
                defaults={'name': name, 'color': '#000', 'is_final': final},
            )
        TicketPriority.objects.get_or_create(
            id='medium',
            defaults={'name': 'Media', 'level': 2, 'color': '#3498db'},
        )
        TicketPriority.objects.get_or_create(
            id='urgent',
            defaults={'name': 'Urgente', 'level': 4, 'color': '#e74c3c'},
        )

        contact_state, _ = ContactState.objects.get_or_create(
            id='active', defaults={'name': 'Active'}
        )
        self.contact = Contact.objects.create(
            email='t9-wf@example.com',
            first_name='T9',
            last_name='WF',
            company_name='Acme',
            state=contact_state,
        )

        self.admin = User.objects.create_user(
            username='t9admin',
            email='t9admin@example.com',
            password='pass',
            user_type=self.admin_type,
            state=self.active_state,
        )
        self.st_user = User.objects.create_user(
            username='t9st',
            email='t9st@example.com',
            password='pass',
            user_type=self.st_type,
            state=self.active_state,
        )
        self.back_user = User.objects.create_user(
            username='t9back',
            email='t9back@example.com',
            password='pass',
            user_type=self.back_type,
            state=self.active_state,
        )
        self.back_full_user = User.objects.create_user(
            username='t9backfull',
            email='t9backfull@example.com',
            password='pass',
            user_type=self.back_full_type,
            state=self.active_state,
        )
        self.tech = User.objects.create_user(
            username='t9tech',
            email='t9tech@example.com',
            password='pass',
            user_type=self.st_type,
            state=self.active_state,
        )

    def auth(self, user):
        token = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')

    def create_ticket(self, state_id='received', **kwargs):
        defaults = dict(
            contact=self.contact,
            product_name='Prod',
            description='Descripción suficiente para ticket T9 workflow test.',
            state_id=state_id,
            priority_id='medium',
            numero_de_serie='SN-T9',
        )
        defaults.update(kwargs)
        return ServiceTicket.objects.create(**defaults)


class T9WorkflowTransitionsTestCase(T9WorkflowBase):
    @patch('tickets.views.send_ticket_status_change_email')
    def test_create_received_and_full_happy_path(self, _mail):
        self.auth(self.admin)
        response = self.client.post(
            '/tickets/from-package/',
            {
                'contact': {
                    'email': 'new-t9@example.com',
                    'first_name': 'New',
                    'last_name': 'User',
                    'company_name': '',
                },
                'ticket': {
                    'description': 'Descripción suficientemente larga para crear.',
                    'numero_de_serie': ' SN-NEW ',
                    'producto_laqq': True,
                    'product_name': 'Equipo',
                    'priority': 'urgent',
                },
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        ticket_data = response.data['ticket']
        self.assertEqual(ticket_data['state'], 'received')
        self.assertNotIn('priority', ticket_data)
        # Admin autenticado puede ver internal_notes (vacío); anónimo no.
        self.assertIn('internal_notes', ticket_data)
        ticket = ServiceTicket.objects.get(id=ticket_data['id'])
        self.assertEqual(ticket.priority_id, 'medium')
        self.assertEqual(ticket.numero_de_serie, 'SN-NEW')

        tid = ticket.id
        r = self.client.post(f'/tickets/{tid}/start/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['state'], 'diagnosed')
        ticket.refresh_from_db()
        self.assertIsNotNone(ticket.diagnosed_at)

        r = self.client.post(
            f'/tickets/{tid}/resolve/',
            {'resolution_notes': 'Presupuesto OK'},
            format='json',
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['state'], 'quoted')
        ticket.refresh_from_db()
        self.assertIsNotNone(ticket.quoted_at)

        r = self.client.post(f'/tickets/{tid}/close/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['state'], 'closed')

    @patch('tickets.views.send_ticket_status_change_email')
    def test_close_from_each_operational_non_final(self, _mail):
        self.auth(self.st_user)
        for sid in ('received', 'diagnosed', 'quoted'):
            t = self.create_ticket(state_id=sid)
            r = self.client.post(f'/tickets/{t.id}/close/')
            self.assertEqual(r.status_code, 200, sid)
            self.assertEqual(r.data['state'], 'closed')

    def test_invalid_transitions(self):
        self.auth(self.admin)
        t = self.create_ticket(state_id='quoted')
        r = self.client.post(f'/tickets/{t.id}/diagnose/')
        self.assertEqual(r.status_code, 400)

        t2 = self.create_ticket(state_id='received')
        r = self.client.post(f'/tickets/{t2.id}/quote/')
        self.assertEqual(r.status_code, 400)

    @patch('tickets.views.send_ticket_status_change_email')
    def test_reopen_preserves_timestamps(self, _mail):
        self.auth(self.admin)
        t = self.create_ticket(state_id='received')
        self.client.post(f'/tickets/{t.id}/diagnose/')
        self.client.post(f'/tickets/{t.id}/quote/')
        self.client.post(f'/tickets/{t.id}/close/')
        t.refresh_from_db()
        diagnosed_at = t.diagnosed_at
        quoted_at = t.quoted_at
        self.assertIsNotNone(diagnosed_at)
        self.assertIsNotNone(quoted_at)

        r = self.client.post(f'/tickets/{t.id}/reopen/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['state'], 'received')
        t.refresh_from_db()
        self.assertEqual(t.diagnosed_at, diagnosed_at)
        self.assertEqual(t.quoted_at, quoted_at)

        # ST no puede reopen
        self.auth(self.st_user)
        t2 = self.create_ticket(state_id='closed')
        r = self.client.post(f'/tickets/{t2.id}/reopen/')
        self.assertEqual(r.status_code, 403)

    def test_classify_legacy_no_timestamps(self):
        self.auth(self.admin)
        t = self.create_ticket(state_id='open')
        r = self.client.post(
            f'/tickets/{t.id}/classify/',
            {'state': 'diagnosed'},
            format='json',
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['state'], 'diagnosed')
        t.refresh_from_db()
        self.assertIsNone(t.diagnosed_at)
        self.assertIsNone(t.quoted_at)

        # No clasificar operativo
        t2 = self.create_ticket(state_id='received')
        r = self.client.post(
            f'/tickets/{t2.id}/classify/',
            {'state': 'quoted'},
            format='json',
        )
        self.assertEqual(r.status_code, 400)

        self.auth(self.st_user)
        t3 = self.create_ticket(state_id='in_progress')
        r = self.client.post(
            f'/tickets/{t3.id}/classify/',
            {'state': 'received'},
            format='json',
        )
        self.assertEqual(r.status_code, 403)

    @patch('tickets.views.send_ticket_assigned_email')
    @patch('tickets.views.send_ticket_status_change_email')
    def test_assign_does_not_change_state(self, _status, _assign_mail):
        self.auth(self.admin)
        t = self.create_ticket(state_id='received')
        r = self.client.post(
            f'/tickets/{t.id}/assign/',
            {'assigned_user': str(self.tech.id)},
            format='json',
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['state'], 'received')
        t.refresh_from_db()
        self.assertEqual(t.state_id, 'received')
        self.assertEqual(t.assigned_user_id, self.tech.id)

        # Desasignar
        r = self.client.post(
            f'/tickets/{t.id}/assign/',
            {'assigned_user': None},
            format='json',
        )
        self.assertEqual(r.status_code, 200)
        t.refresh_from_db()
        self.assertIsNone(t.assigned_user_id)
        self.assertEqual(t.state_id, 'received')

    def test_put_cannot_change_or_reopen_state(self):
        self.auth(self.admin)
        t = self.create_ticket(state_id='received')
        self.client.post(f'/tickets/{t.id}/close/')
        t.refresh_from_db()
        self.assertEqual(t.state_id, 'closed')

        r = self.client.put(
            f'/tickets/{t.id}/',
            {
                'contact_id': str(self.contact.id),
                'product_name': t.product_name,
                'description': t.description,
                'state': 'received',
                'priority': 'urgent',
                'numero_de_serie': t.numero_de_serie,
            },
            format='json',
        )
        self.assertEqual(r.status_code, 200)
        t.refresh_from_db()
        self.assertEqual(t.state_id, 'closed')
        self.assertEqual(t.priority_id, 'medium')

    def test_back_cannot_manage_workflow(self):
        self.auth(self.back_user)
        t = self.create_ticket(state_id='received')
        self.assertEqual(self.client.post(f'/tickets/{t.id}/diagnose/').status_code, 403)
        self.assertEqual(self.client.post(f'/tickets/{t.id}/close/').status_code, 403)
        r = self.client.put(
            f'/tickets/{t.id}/',
            {
                'contact_id': str(self.contact.id),
                'description': t.description,
                'product_name': t.product_name,
            },
            format='json',
        )
        self.assertEqual(r.status_code, 403)


class T9InternalNotesTestCase(T9WorkflowBase):
    def _ticket_with_notes(self, note='Secreto técnico'):
        t = self.create_ticket()
        t.internal_notes = note
        t.save(update_fields=['internal_notes'])
        return t

    def _assert_no_notes_in_list(self, response):
        self.assertEqual(response.status_code, 200)
        results = response.data.get('results', response.data)
        if isinstance(results, dict):
            results = [results]
        self.assertTrue(len(results) >= 1)
        for item in results:
            self.assertNotIn('internal_notes', item)

    def test_admin_and_st_can_read_and_write_notes(self):
        t = self.create_ticket()

        self.auth(self.admin)
        r = self.client.patch(
            f'/tickets/{t.id}/',
            {'internal_notes': 'Nota admin'},
            format='json',
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data.get('internal_notes'), 'Nota admin')

        r = self.client.get(f'/tickets/{t.id}/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data.get('internal_notes'), 'Nota admin')

        r = self.client.get('/tickets/')
        self.assertEqual(r.status_code, 200)
        results = r.data.get('results', r.data)
        match = next(item for item in results if item['id'] == str(t.id))
        self.assertEqual(match.get('internal_notes'), 'Nota admin')

        self.auth(self.st_user)
        r = self.client.patch(
            f'/tickets/{t.id}/',
            {'internal_notes': 'Nota ST'},
            format='json',
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data.get('internal_notes'), 'Nota ST')
        r = self.client.get(f'/tickets/{t.id}/')
        self.assertEqual(r.data.get('internal_notes'), 'Nota ST')

    def test_back_and_back_full_do_not_receive_notes_on_list_or_detail(self):
        t = self._ticket_with_notes('Privado BF')

        self.auth(self.back_user)
        r = self.client.get('/tickets/')
        self._assert_no_notes_in_list(r)
        r = self.client.get(f'/tickets/{t.id}/')
        self.assertEqual(r.status_code, 200)
        self.assertNotIn('internal_notes', r.data)

        self.auth(self.back_full_user)
        r = self.client.get('/tickets/')
        self._assert_no_notes_in_list(r)
        r = self.client.get(f'/tickets/{t.id}/')
        self.assertEqual(r.status_code, 200)
        self.assertNotIn('internal_notes', r.data)

    def test_client_and_anonymous_do_not_receive_notes(self):
        t = self._ticket_with_notes('Privado cliente')

        client_user = User.objects.create_user(
            username='t9client',
            email=self.contact.email,
            password='pass',
            user_type=self.client_type,
            state=self.active_state,
        )
        self.auth(client_user)
        r = self.client.get(f'/tickets/{t.id}/')
        self.assertEqual(r.status_code, 200)
        self.assertNotIn('internal_notes', r.data)

        self.client.credentials()
        r = self.client.get(f'/tickets/{t.id}/', {'email': self.contact.email})
        self.assertEqual(r.status_code, 200)
        self.assertNotIn('internal_notes', r.data)

    def test_unauthorized_write_of_notes_returns_403(self):
        t = self._ticket_with_notes('Original')

        # back: sin manage → 403 (permission class o serializer)
        self.auth(self.back_user)
        r = self.client.patch(
            f'/tickets/{t.id}/',
            {'internal_notes': 'hack back'},
            format='json',
        )
        self.assertEqual(r.status_code, 403)

        self.auth(self.back_full_user)
        r = self.client.patch(
            f'/tickets/{t.id}/',
            {'internal_notes': 'hack back_full'},
            format='json',
        )
        self.assertEqual(r.status_code, 403)

        # create público con internal_notes explícito → 403 (no silent drop)
        self.client.credentials()
        r = self.client.post(
            '/tickets/from-package/',
            {
                'contact': {
                    'email': 'notes-leak@example.com',
                    'first_name': 'Leak',
                    'last_name': 'Test',
                },
                'ticket': {
                    'description': 'Descripción suficientemente larga para crear ticket.',
                    'numero_de_serie': 'SN-LEAK',
                    'producto_laqq': True,
                    'product_name': 'Equipo',
                    'internal_notes': 'no deberia',
                },
            },
            format='json',
        )
        self.assertEqual(r.status_code, 403)
        t.refresh_from_db()
        self.assertEqual(t.internal_notes, 'Original')


class T9ExportTestCase(T9WorkflowBase):
    def test_export_permissions_and_notes(self):
        self.auth(self.admin)
        t = self.create_ticket()
        t.internal_notes = 'Nota privada export'
        t.save(update_fields=['internal_notes'])

        r = self.client.get('/tickets/export/')
        self.assertEqual(r.status_code, 200)
        self.assertIn('spreadsheetml', r['Content-Type'])
        from openpyxl import load_workbook
        wb = load_workbook(BytesIO(r.content))
        rows = list(wb.active.iter_rows(values_only=True))
        headers = rows[0]
        self.assertIn('internal_notes', headers)
        self.assertIn('ticket_number', headers)
        self.assertNotIn('priority_id', headers)
        self.assertNotIn('priority_name', headers)
        note_idx = headers.index('internal_notes')
        self.assertTrue(
            any(row[note_idx] == 'Nota privada export' for row in rows[1:])
        )

        self.auth(self.back_user)
        r = self.client.get('/tickets/export/')
        self.assertEqual(r.status_code, 403)

        self.auth(self.st_user)
        r = self.client.get('/tickets/export/')
        self.assertEqual(r.status_code, 200)
        wb = load_workbook(BytesIO(r.content))
        headers = list(wb.active.iter_rows(values_only=True))[0]
        self.assertIn('internal_notes', headers)
        self.assertNotIn('priority_id', headers)
        self.assertNotIn('priority_name', headers)
