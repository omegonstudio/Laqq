from django.test import TestCase, override_settings
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import ServiceTicket, TicketState, TicketPriority
from contacts.models import Contact, ContactState
from products.models import Product, Brand, Category
from users.models import UserType, UserState
from datetime import datetime
from unittest.mock import patch

User = get_user_model()


class ServiceTicketAPITestCase(APITestCase):
    """Tests para el CRUD de Tickets de servicio técnico"""

    def setUp(self):
        self.client = APIClient()

        # Crear user types y states
        self.admin_type = UserType.objects.create(
            id='admin',
            name='Administrador',
            description='Usuario admin'
        )
        self.active_state = UserState.objects.create(
            id='active',
            name='Activo'
        )

        # Crear usuario admin para los tests
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            user_type=self.admin_type,
            state=self.active_state
        )
        self.client.force_authenticate(user=self.user)

        # Crear estados y prioridades de tickets
        self.ticket_state_new = TicketState.objects.create(
            id='new',
            name='Nuevo',
            color='#3498db',
            is_final=False
        )
        self.ticket_state_open = TicketState.objects.create(
            id='open',
            name='Abierto',
            color='#f39c12',
            is_final=False
        )
        self.ticket_state_in_progress = TicketState.objects.create(
            id='in_progress',
            name='En progreso',
            color='#9b59b6',
            is_final=False
        )
        self.ticket_state_resolved = TicketState.objects.create(
            id='resolved',
            name='Resuelto',
            color='#1abc9c',
            is_final=False
        )
        self.ticket_state_closed = TicketState.objects.create(
            id='closed',
            name='Cerrado',
            color='#27ae60',
            is_final=True
        )

        self.priority_low = TicketPriority.objects.create(
            id='low',
            name='Baja',
            level=1,
            color='#95a5a6'
        )
        self.priority_medium = TicketPriority.objects.create(
            id='medium',
            name='Media',
            level=2,
            color='#3498db'
        )
        self.priority_high = TicketPriority.objects.create(
            id='high',
            name='Alta',
            level=3,
            color='#f39c12'
        )
        self.priority_urgent = TicketPriority.objects.create(
            id='urgent',
            name='Urgente',
            level=4,
            color='#e74c3c'
        )

        # Crear contacto
        self.contact_state = ContactState.objects.create(id='active', name='Active')
        self.contact = Contact.objects.create(
            company_name='Test Company',
            first_name='John',
            last_name='Doe',
            email='john@example.com',
            state=self.contact_state
        )

        # Crear producto (opcional para vincular)
        self.brand = Brand.objects.create(name='Test Brand')
        self.category = Category.objects.create(name='Test Category')
        self.product = Product.objects.create(
            name='Pipeta Automática 100ml',
            brand=self.brand,
            category=self.category,
            is_active=True
        )

        # Crear ticket de prueba
        self.ticket = ServiceTicket.objects.create(
            ticket_number='T-2025-00001',
            contact=self.contact,
            product_name='Test Product',
            description='This is a test description with enough characters to pass validation requirements.',
            state=self.ticket_state_new,
            priority=self.priority_medium
        )

    def test_list_tickets(self):
        """Listar todos los tickets de servicio con paginación"""
        response = self.client.get('/tickets/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_ticket_auto_number(self):
        """Crear ticket con número automático (T-YYYY-XXXXX)"""
        data = {
            'contact_id': self.contact.id,
            'product_name': 'New Product',
            'description': 'This is a new ticket description with enough characters to pass validation.',
            'numero_de_serie': 'SN-CREATE-001',
        }
        response = self.client.post('/tickets/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('ticket_number', response.data)
        self.assertTrue(response.data['ticket_number'].startswith('T-'))
        # Verificar defaults automáticos
        self.assertEqual(response.data['state'], 'open')
        self.assertEqual(response.data['priority'], 'medium')

    def test_validate_empty_description(self):
        """Validar que la descripción no esté vacía"""
        data = {
            'contact_id': self.contact.id,
            'product_name': 'Test Product',
            'description': '   ',
            'numero_de_serie': 'SN-EMPTY-DESC',
        }
        response = self.client.post('/tickets/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_ticket(self):
        """Actualizar información de un ticket existente"""
        data = {
            'product_name': 'Updated Product',
            'description': 'This is an updated description with enough characters.'
        }
        response = self.client.patch(f'/tickets/{self.ticket.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.product_name, 'Updated Product')

    # ========== NUEVOS TESTS: Relación con Producto ==========

    def test_create_ticket_with_product_link(self):
        """Crear ticket vinculado a un producto del catálogo"""
        data = {
            'contact_id': self.contact.id,
            'product': self.product.id,
            'product_name': 'Nombre manual',  # Se debería sobrescribir
            'description': 'La pipeta no dispensa el volumen correcto según especificación.',
            'numero_de_serie': 'SN-PIPETA-001',
        }
        response = self.client.post('/tickets/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Verificar que product_name se sincronizó con product.name
        self.assertEqual(response.data['product_name'], 'Pipeta Automática 100ml')

    # ========== NUEVOS TESTS: Transiciones de Estado y Fechas ==========

    def test_assign_ticket_to_user(self):
        """Asignar ticket a técnico usando endpoint personalizado"""
        response = self.client.post(
            f'/tickets/{self.ticket.id}/assign/',
            {'assigned_user': self.user.id}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.assigned_user.id, self.user.id)
        self.assertIsNotNone(self.ticket.assigned_at)
        # Verificar transición automática de estado new -> open
        self.assertEqual(self.ticket.state.id, 'open')

    def test_start_ticket(self):
        """Marcar ticket como en progreso"""
        response = self.client.post(f'/tickets/{self.ticket.id}/start/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.state.id, 'in_progress')
        self.assertIsNotNone(self.ticket.started_at)

    def test_resolve_ticket(self):
        """Marcar ticket como resuelto con notas"""
        resolution_notes = 'Se reemplazó el pistón defectuoso. Equipo calibrado y probado.'
        response = self.client.post(
            f'/tickets/{self.ticket.id}/resolve/',
            {'resolution_notes': resolution_notes}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.state.id, 'resolved')
        self.assertEqual(self.ticket.resolution_notes, resolution_notes)
        self.assertIsNotNone(self.ticket.resolved_at)

    def test_close_ticket(self):
        """Cerrar ticket"""
        response = self.client.post(f'/tickets/{self.ticket.id}/close/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.state.id, 'closed')
        self.assertIsNotNone(self.ticket.closed_at)
        # Si no tenía resolved_at, también se setea
        self.assertIsNotNone(self.ticket.resolved_at)

    def test_close_then_put_with_closed_state_persists_on_reload(self):
        """
        Simula el flujo FE corregido (Ticket 9A): close() + PUT con state
        tomado de la respuesta de close, y verifica persistencia al recargar.
        """
        close_response = self.client.post(f'/tickets/{self.ticket.id}/close/')
        self.assertEqual(close_response.status_code, status.HTTP_200_OK)
        self.assertEqual(close_response.data['state'], 'closed')

        put_response = self.client.put(
            f'/tickets/{self.ticket.id}/',
            {
                'contact_id': self.contact.id,
                'product_name': self.ticket.product_name,
                'description': self.ticket.description,
                'state': close_response.data['state'],
                'priority': 'medium',
            },
        )
        self.assertEqual(put_response.status_code, status.HTTP_200_OK)
        self.assertEqual(put_response.data['state'], 'closed')

        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.state_id, 'closed')

        reload_response = self.client.get(f'/tickets/{self.ticket.id}/')
        self.assertEqual(reload_response.status_code, status.HTTP_200_OK)
        self.assertEqual(reload_response.data['state'], 'closed')

    def test_put_with_stale_open_state_after_close_would_reopen(self):
        """Documenta el bug previo: PUT con state viejo tras close revierte el cierre."""
        close_response = self.client.post(f'/tickets/{self.ticket.id}/close/')
        self.assertEqual(close_response.status_code, status.HTTP_200_OK)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.state_id, 'closed')

        put_response = self.client.put(
            f'/tickets/{self.ticket.id}/',
            {
                'contact_id': self.contact.id,
                'product_name': self.ticket.product_name,
                'description': self.ticket.description,
                'state': 'open',
                'priority': 'medium',
            },
        )
        self.assertEqual(put_response.status_code, status.HTTP_200_OK)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.state_id, 'open')

    # ========== NUEVOS TESTS: Estadísticas ==========

    def test_statistics_endpoint(self):
        """Obtener estadísticas de tickets"""
        # Crear algunos tickets adicionales
        ServiceTicket.objects.create(
            ticket_number='T-2025-00097',
            contact=self.contact,
            product_name='Product A',
            description='Ticket for testing statistics endpoint functionality.',
            state=self.ticket_state_open,
            priority=self.priority_high
        )
        ServiceTicket.objects.create(
            ticket_number='T-2025-00096',
            contact=self.contact,
            product_name='Product B',
            description='Another ticket for testing statistics endpoint.',
            state=self.ticket_state_closed,
            priority=self.priority_urgent
        )

        response = self.client.get('/tickets/statistics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total', response.data)
        self.assertIn('by_state', response.data)
        self.assertIn('by_priority', response.data)
        self.assertIn('unassigned', response.data)
        self.assertIn('created_last_7_days', response.data)
        self.assertEqual(response.data['total'], 3)

    # ========== TESTS: Estados y Prioridades ==========


@override_settings(TESTING=False)
class ClientPortalAPITestCase(APITestCase):
    """Tests para el portal de clientes y creación automática de usuarios"""

    def setUp(self):
        self.client = APIClient()

        # Crear user types y states
        self.admin_type, _ = UserType.objects.get_or_create(
            id='admin',
            defaults={
                'name': 'Administrador',
                'description': 'Usuario admin'
            }
        )
        self.client_type, _ = UserType.objects.get_or_create(
            id='client',
            defaults={
                'name': 'Cliente',
                'description': 'Usuario cliente'
            }
        )
        self.active_state, _ = UserState.objects.get_or_create(
            id='active',
            defaults={'name': 'Activo'}
        )

        # Crear usuario admin
        self.admin_user = User.objects.create_user(
            username='admin',
            password='admin123',
            email='admin@example.com',
            user_type=self.admin_type,
            state=self.active_state
        )

        # Crear estados y prioridades de tickets
        self.ticket_state_new = TicketState.objects.create(
            id='new',
            name='Nuevo',
            color='#3498db',
            is_final=False
        )
        self.priority_medium = TicketPriority.objects.create(
            id='medium',
            name='Media',
            level=2,
            color='#3498db'
        )

        # Crear contacto para cliente
        self.contact_state = ContactState.objects.create(id='active', name='Active')
        self.client_contact = Contact.objects.create(
            company_name='Client Company',
            first_name='Jane',
            last_name='Smith',
            email='jane@clientcompany.com',
            state=self.contact_state
        )

    @patch('tickets.serializers.send_ticket_created_email')
    def test_create_ticket_creates_client_user(self, mock_send_email):
        """Crear ticket debe crear automáticamente un usuario cliente"""
        # Mock email sending to avoid errors
        mock_send_email.return_value = {'business': True, 'customer': True, 'errors': []}

        # Autenticar como admin
        self.client.force_authenticate(user=self.admin_user)

        # Verificar que no existe usuario con ese email
        self.assertFalse(User.objects.filter(email='jane@clientcompany.com').exists())

        # Crear ticket
        data = {
            'contact_id': self.client_contact.id,
            'product_name': 'Test Product',
            'description': 'This is a test ticket description with enough characters for validation.',
            'numero_de_serie': 'SN-CLIENT-PORTAL',
        }
        response = self.client.post('/tickets/', data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verificar que se creó el usuario cliente
        client_user = User.objects.filter(email='jane@clientcompany.com').first()
        self.assertIsNotNone(client_user)
        self.assertEqual(client_user.user_type.id, 'client')
        self.assertEqual(client_user.state.id, 'active')
        self.assertEqual(client_user.first_name, 'Jane')
        self.assertEqual(client_user.last_name, 'Smith')

        # Exactamente una notificación de creación (Ticket 8)
        self.assertEqual(mock_send_email.call_count, 1)

    def test_client_can_only_view_own_tickets(self):
        """Cliente solo puede ver sus propios tickets"""
        # Crear cliente usuario
        client_user = User.objects.create_user(
            username='janeclient',
            password='password123',
            email='jane@clientcompany.com',
            user_type=self.client_type,
            state=self.active_state
        )

        # Crear otro contacto y ticket de otro cliente
        other_contact = Contact.objects.create(
            company_name='Other Company',
            first_name='Bob',
            last_name='Jones',
            email='bob@other.com',
            state=self.contact_state
        )

        # Ticket del cliente actual
        my_ticket = ServiceTicket.objects.create(
            ticket_number='T-2025-00001',
            contact=self.client_contact,
            product_name='My Product',
            description='This is my ticket with enough description text.',
            state=self.ticket_state_new,
            priority=self.priority_medium
        )

        # Ticket de otro cliente
        other_ticket = ServiceTicket.objects.create(
            ticket_number='T-2025-00002',
            contact=other_contact,
            product_name='Other Product',
            description='This is another client ticket with description.',
            state=self.ticket_state_new,
            priority=self.priority_medium
        )

        # Autenticar como cliente
        self.client.force_authenticate(user=client_user)

        # Listar tickets
        response = self.client.get('/tickets/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Cliente solo debe ver su propio ticket
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['ticket_number'], 'T-2025-00001')


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    TICKETS_EMAIL='soporte@laqq.com.ar',
    BUSINESS_EMAIL='negocio@example.com',
    TESTING=True,
)
class TicketCreateNotificationTestCase(APITestCase):
    """Ticket 8: un correo a soporte + uno al cliente por creación."""

    def setUp(self):
        from django.core import mail

        mail.outbox.clear()
        self.client = APIClient()

        self.client_type, _ = UserType.objects.get_or_create(
            id='client',
            defaults={'name': 'Cliente', 'description': 'Usuario cliente'},
        )
        self.admin_type, _ = UserType.objects.get_or_create(
            id='admin',
            defaults={'name': 'Administrador', 'description': 'Admin'},
        )
        self.active_state, _ = UserState.objects.get_or_create(
            id='active',
            defaults={'name': 'Activo'},
        )
        TicketState.objects.get_or_create(
            id='open',
            defaults={'name': 'Abierto', 'color': '#f39c12', 'is_final': False},
        )
        TicketState.objects.get_or_create(
            id='closed',
            defaults={'name': 'Cerrado', 'color': '#27ae60', 'is_final': True},
        )
        TicketPriority.objects.get_or_create(
            id='medium',
            defaults={'name': 'Media', 'level': 2, 'color': '#3498db'},
        )
        self.contact_state_new, _ = ContactState.objects.get_or_create(
            id='new',
            defaults={'name': 'New'},
        )
        self.contact_state_active, _ = ContactState.objects.get_or_create(
            id='active',
            defaults={'name': 'Active'},
        )
        self.admin_user = User.objects.create_user(
            username='t8admin',
            password='admin123',
            email='t8admin@example.com',
            user_type=self.admin_type,
            state=self.active_state,
        )

    def _package_payload(self, email, company_name='', marca='', modelo='', serie='SN-001'):
        ticket = {
            'description': 'Equipo con falla de calibracion reportada por el cliente.',
            'producto_laqq': False,
            'marca': marca or 'MarcaX',
            'modelo': modelo or 'ModeloY',
            'numero_de_serie': serie,
        }
        return {
            'contact': {
                'email': email,
                'first_name': 'Ana',
                'last_name': 'Pérez',
                'company_name': company_name,
                'phone': '111',
            },
            'ticket': ticket,
        }

    def test_from_package_new_contact_sends_exactly_two_emails(self):
        from django.core import mail

        response = self.client.post(
            '/tickets/from-package/',
            self._package_payload('nuevo@cliente.com', company_name='Empresa Nueva'),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 2)
        recipients = {tuple(m.to) for m in mail.outbox}
        self.assertEqual(
            recipients,
            {('soporte@laqq.com.ar',), ('nuevo@cliente.com',)},
        )
        customer_mail = next(m for m in mail.outbox if m.to == ['nuevo@cliente.com'])
        self.assertIn('Recibimos tu solicitud', customer_mail.subject)
        self.assertIn('SN-001', customer_mail.body)
        self.assertIn('MarcaX', customer_mail.body)
        self.assertIn('ModeloY', customer_mail.body)
        self.assertIn('soporte@laqq.com.ar', customer_mail.body)
        self.assertNotIn('Prioridad', customer_mail.body)
        self.assertNotIn('portal de cliente', customer_mail.body.lower())
        business_mail = next(m for m in mail.outbox if m.to == ['soporte@laqq.com.ar'])
        self.assertIn('SN-001', business_mail.body)
        self.assertNotIn('Prioridad', business_mail.body)
        self.assertNotIn('credenciales', business_mail.body.lower())

    def test_from_package_existing_contact_sends_exactly_two_emails(self):
        from django.core import mail

        Contact.objects.create(
            email='existente@cliente.com',
            first_name='Ana',
            last_name='Pérez',
            company_name='Empresa Vieja',
            state=self.contact_state_active,
        )
        User.objects.create_user(
            username='existente',
            email='existente@cliente.com',
            password='pass12345',
            user_type=self.client_type,
            state=self.active_state,
        )
        response = self.client.post(
            '/tickets/from-package/',
            self._package_payload('existente@cliente.com'),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 2)
        recipients = {tuple(m.to) for m in mail.outbox}
        self.assertEqual(
            recipients,
            {('soporte@laqq.com.ar',), ('existente@cliente.com',)},
        )

    @patch('tickets.serializers.send_ticket_created_email')
    def test_post_tickets_calls_send_once(self, mock_send):
        mock_send.return_value = {'business': True, 'customer': True, 'errors': []}
        contact = Contact.objects.create(
            email='api@cliente.com',
            first_name='Api',
            last_name='User',
            state=self.contact_state_active,
        )
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            '/tickets/',
            {
                'contact_id': contact.id,
                'product_name': 'Producto API',
                'description': 'Descripcion suficiente para crear el ticket via API.',
                'numero_de_serie': 'SN-T8-API',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(mock_send.call_count, 1)

    def test_business_failure_still_sends_customer_and_keeps_ticket(self):
        from django.core import mail
        from tickets.emails import send_ticket_created_email

        contact = Contact.objects.create(
            email='failbiz@cliente.com',
            first_name='Fail',
            last_name='Biz',
            state=self.contact_state_active,
        )
        ticket = ServiceTicket.objects.create(
            contact=contact,
            product_name='Prod',
            description='Ticket para probar fallo de envio a soporte.',
            state=TicketState.objects.get(id='open'),
            priority=TicketPriority.objects.get(id='medium'),
            numero_de_serie='SER-99',
        )
        mail.outbox.clear()
        with patch(
            'tickets.emails.send_ticket_to_business',
            side_effect=Exception('smtp down'),
        ):
            results = send_ticket_created_email(ticket)
        self.assertFalse(results['business'])
        self.assertTrue(results['customer'])
        self.assertTrue(results['errors'])
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['failbiz@cliente.com'])
        self.assertTrue(ServiceTicket.objects.filter(pk=ticket.pk).exists())

    def test_customer_failure_keeps_ticket_and_support_email(self):
        from django.core import mail
        from tickets.emails import send_ticket_created_email

        contact = Contact.objects.create(
            email='failcust@cliente.com',
            first_name='Fail',
            last_name='Cust',
            state=self.contact_state_active,
        )
        ticket = ServiceTicket.objects.create(
            contact=contact,
            product_name='Prod',
            description='Ticket para probar fallo de envio al cliente.',
            state=TicketState.objects.get(id='open'),
            priority=TicketPriority.objects.get(id='medium'),
        )
        mail.outbox.clear()
        with patch(
            'tickets.emails.send_ticket_to_customer',
            side_effect=Exception('smtp down'),
        ):
            results = send_ticket_created_email(ticket)
        self.assertTrue(results['business'])
        self.assertFalse(results['customer'])
        self.assertTrue(results['errors'])
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['soporte@laqq.com.ar'])
        self.assertTrue(ServiceTicket.objects.filter(pk=ticket.pk).exists())

    def test_status_change_email_still_works(self):
        from django.core import mail
        from tickets.emails import send_ticket_status_change_email

        contact = Contact.objects.create(
            email='status@cliente.com',
            first_name='Status',
            last_name='User',
            state=self.contact_state_active,
        )
        ticket = ServiceTicket.objects.create(
            contact=contact,
            product_name='Prod',
            description='Ticket para cambio de estado.',
            state=TicketState.objects.get(id='closed'),
            priority=TicketPriority.objects.get(id='medium'),
        )
        mail.outbox.clear()
        ok = send_ticket_status_change_email(ticket)
        self.assertTrue(ok)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['status@cliente.com'])
        self.assertIn('Actualización', mail.outbox[0].subject)
        self.assertNotIn('Prioridad', mail.outbox[0].body)
        html_part = mail.outbox[0].alternatives[0][0] if mail.outbox[0].alternatives else ''
        self.assertNotIn('Prioridad', html_part)

    def test_contacts_and_quotes_still_use_business_email_settings(self):
        import inspect
        import contacts.emails as contacts_emails
        import quotes.emails as quotes_emails

        self.assertIn('settings.BUSINESS_EMAIL', inspect.getsource(contacts_emails))
        self.assertNotIn('TICKETS_EMAIL', inspect.getsource(contacts_emails))
        self.assertIn('settings.QUOTES_EMAIL', inspect.getsource(quotes_emails))
        self.assertNotIn('TICKETS_EMAIL', inspect.getsource(quotes_emails))


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    TICKETS_EMAIL='soporte@laqq.com.ar',
    BUSINESS_EMAIL='negocio@example.com',
    TESTING=True,
)
class TicketPriorityInternalTestCase(APITestCase):
    """Ticket 9B: prioridad exclusiva de usuarios internos (admin/back)."""

    def setUp(self):
        from django.core import mail

        mail.outbox.clear()
        self.client = APIClient()

        self.admin_type, _ = UserType.objects.get_or_create(
            id='admin',
            defaults={'name': 'Administrador', 'description': 'Admin'},
        )
        self.back_type, _ = UserType.objects.get_or_create(
            id='back',
            defaults={'name': 'BackOffice', 'description': 'Back office'},
        )
        self.client_type, _ = UserType.objects.get_or_create(
            id='client',
            defaults={'name': 'Cliente', 'description': 'Usuario cliente'},
        )
        self.active_state, _ = UserState.objects.get_or_create(
            id='active',
            defaults={'name': 'Activo'},
        )

        for state_id, name, color, is_final in [
            ('open', 'Abierto', '#f39c12', False),
            ('in_progress', 'En progreso', '#9b59b6', False),
            ('resolved', 'Resuelto', '#1abc9c', False),
            ('closed', 'Cerrado', '#27ae60', True),
        ]:
            TicketState.objects.get_or_create(
                id=state_id,
                defaults={'name': name, 'color': color, 'is_final': is_final},
            )

        TicketPriority.objects.get_or_create(
            id='medium',
            defaults={'name': 'Media', 'level': 2, 'color': '#3498db'},
        )
        TicketPriority.objects.get_or_create(
            id='high',
            defaults={'name': 'Alta', 'level': 3, 'color': '#f39c12'},
        )

        self.contact_state, _ = ContactState.objects.get_or_create(
            id='active',
            defaults={'name': 'Active'},
        )
        self.contact = Contact.objects.create(
            email='cliente9b@example.com',
            first_name='Cliente',
            last_name='NueveB',
            state=self.contact_state,
        )

        self.admin_user = User.objects.create_user(
            username='admin9b',
            password='admin123',
            email='admin9b@example.com',
            user_type=self.admin_type,
            state=self.active_state,
        )
        self.back_user = User.objects.create_user(
            username='back9b',
            password='back123',
            email='back9b@example.com',
            user_type=self.back_type,
            state=self.active_state,
        )
        self.client_user = User.objects.create_user(
            username='client9b',
            password='client123',
            email='cliente9b@example.com',
            user_type=self.client_type,
            state=self.active_state,
        )

        self.ticket = ServiceTicket.objects.create(
            contact=self.contact,
            product_name='Producto 9B',
            description='Ticket de prueba para ocultar prioridad al cliente.',
            state=TicketState.objects.get(id='open'),
            priority=TicketPriority.objects.get(id='medium'),
        )

    def test_admin_get_ticket_includes_priority(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f'/tickets/{self.ticket.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('priority', response.data)
        self.assertEqual(response.data['priority'], 'medium')

    def test_back_get_ticket_includes_priority(self):
        self.client.force_authenticate(user=self.back_user)
        response = self.client.get(f'/tickets/{self.ticket.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('priority', response.data)
        self.assertEqual(response.data['priority'], 'medium')

    def test_client_get_ticket_excludes_priority(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.get(f'/tickets/{self.ticket.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('priority', response.data)

    def test_anonymous_get_by_email_excludes_priority(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/tickets/', {'email': self.contact.email})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertTrue(len(results) >= 1)
        self.assertNotIn('priority', results[0])

    def test_client_cannot_patch_priority(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.patch(
            f'/tickets/{self.ticket.id}/',
            {'priority': 'high'},
            format='json',
        )
        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.priority_id, 'medium')

    def test_client_cannot_put_priority(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.put(
            f'/tickets/{self.ticket.id}/',
            {
                'contact_id': self.contact.id,
                'product_name': self.ticket.product_name,
                'description': self.ticket.description,
                'state': 'open',
                'priority': 'high',
            },
            format='json',
        )
        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.priority_id, 'medium')

    def test_admin_can_change_priority(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(
            f'/tickets/{self.ticket.id}/',
            {'priority': 'high'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['priority'], 'high')
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.priority_id, 'high')

    def test_anonymous_cannot_list_priorities(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/tickets/priorities/')
        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

    def test_client_cannot_list_priorities(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.get('/tickets/priorities/')
        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

    def test_admin_and_back_can_list_priorities(self):
        self.client.force_authenticate(user=self.admin_user)
        admin_response = self.client.get('/tickets/priorities/')
        self.assertEqual(admin_response.status_code, status.HTTP_200_OK)
        admin_results = admin_response.data.get('results', admin_response.data)
        self.assertTrue(len(admin_results) >= 1)

        self.client.force_authenticate(user=self.back_user)
        back_response = self.client.get('/tickets/priorities/')
        self.assertEqual(back_response.status_code, status.HTTP_200_OK)
        back_results = back_response.data.get('results', back_response.data)
        self.assertTrue(len(back_results) >= 1)

    @patch('tickets.serializers.send_ticket_created_email')
    def test_from_package_works_without_exposing_priority(self, mock_send):
        mock_send.return_value = {'business': True, 'customer': True, 'errors': []}
        self.client.force_authenticate(user=None)
        response = self.client.post(
            '/tickets/from-package/',
            {
                'contact': {
                    'email': 'publico9b@example.com',
                    'first_name': 'Publico',
                    'last_name': 'Cliente',
                },
                'ticket': {
                    'description': 'Creacion publica sin exponer prioridad interna.',
                    'producto_laqq': False,
                    'marca': 'MarcaZ',
                    'modelo': 'ModeloZ',
                    'numero_de_serie': 'SN-9B',
                },
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('ticket', response.data)
        self.assertNotIn('priority', response.data['ticket'])
        created = ServiceTicket.objects.get(id=response.data['ticket']['id'])
        self.assertEqual(created.priority_id, 'medium')

    @patch('tickets.serializers.send_ticket_created_email')
    def test_post_tickets_serializer_by_role(self, mock_send):
        mock_send.return_value = {'business': True, 'customer': True, 'errors': []}
        payload = {
            'contact_id': self.contact.id,
            'product_name': 'Producto POST',
            'description': 'Creacion autenticada respetando serializer por rol.',
            'numero_de_serie': 'SN-POST-ROLE',
        }

        self.client.force_authenticate(user=self.admin_user)
        admin_response = self.client.post('/tickets/', payload, format='json')
        self.assertEqual(admin_response.status_code, status.HTTP_201_CREATED)
        self.assertIn('priority', admin_response.data)

        self.client.force_authenticate(user=None)
        anon_response = self.client.post(
            '/tickets/',
            {
                'contact_id': self.contact.id,
                'product_name': 'Producto Anon',
                'description': 'Creacion anonima sin prioridad en la respuesta.',
                'numero_de_serie': 'SN-POST-ANON',
            },
            format='json',
        )
        self.assertEqual(anon_response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('priority', anon_response.data)

    @patch('tickets.serializers.send_ticket_created_email')
    def test_from_package_ignores_client_priority_high(self, mock_send):
        """Cliente/anónimo no puede fijar priority al crear vía from-package."""
        mock_send.return_value = {'business': True, 'customer': True, 'errors': []}
        self.client.force_authenticate(user=None)
        response = self.client.post(
            '/tickets/from-package/',
            {
                'contact': {
                    'email': 'prio-package@example.com',
                    'first_name': 'Prio',
                    'last_name': 'Package',
                },
                'ticket': {
                    'description': 'Intento de crear ticket con prioridad alta desde publico.',
                    'producto_laqq': False,
                    'marca': 'MarcaP',
                    'modelo': 'ModeloP',
                    'priority': 'high',
                    'numero_de_serie': 'SN-PRIO-PKG',
                },
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('priority', response.data['ticket'])
        created = ServiceTicket.objects.get(id=response.data['ticket']['id'])
        self.assertEqual(created.priority_id, 'medium')
        self.assertEqual(mock_send.call_count, 1)

        self.client.force_authenticate(user=self.client_user)
        client_response = self.client.post(
            '/tickets/from-package/',
            {
                'contact': {
                    'email': 'prio-package-client@example.com',
                    'first_name': 'Prio',
                    'last_name': 'Client',
                },
                'ticket': {
                    'description': 'Cliente autenticado intenta forzar prioridad high.',
                    'producto_laqq': False,
                    'marca': 'MarcaC',
                    'modelo': 'ModeloC',
                    'priority': 'high',
                    'numero_de_serie': 'SN-PRIO-CLIENT',
                },
            },
            format='json',
        )
        self.assertEqual(client_response.status_code, status.HTTP_201_CREATED)
        created_client = ServiceTicket.objects.get(id=client_response.data['ticket']['id'])
        self.assertEqual(created_client.priority_id, 'medium')

    @patch('tickets.serializers.send_ticket_created_email')
    def test_post_tickets_ignores_client_priority_high(self, mock_send):
        """Cliente/anónimo no puede fijar priority al crear vía POST /tickets/."""
        mock_send.return_value = {'business': True, 'customer': True, 'errors': []}
        self.client.force_authenticate(user=None)
        anon_response = self.client.post(
            '/tickets/',
            {
                'contact_id': self.contact.id,
                'product_name': 'Producto High Anon',
                'description': 'Intento anonimo de forzar prioridad high en POST tickets.',
                'priority': 'high',
                'numero_de_serie': 'SN-HIGH-ANON',
            },
            format='json',
        )
        self.assertEqual(anon_response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('priority', anon_response.data)
        created_anon = ServiceTicket.objects.get(id=anon_response.data['id'])
        self.assertEqual(created_anon.priority_id, 'medium')

        self.client.force_authenticate(user=self.client_user)
        client_response = self.client.post(
            '/tickets/',
            {
                'contact_id': self.contact.id,
                'product_name': 'Producto High Client',
                'description': 'Intento de cliente de forzar prioridad high en POST tickets.',
                'priority': 'high',
                'numero_de_serie': 'SN-HIGH-CLIENT',
            },
            format='json',
        )
        self.assertEqual(client_response.status_code, status.HTTP_201_CREATED)
        created_client = ServiceTicket.objects.get(id=client_response.data['id'])
        self.assertEqual(created_client.priority_id, 'medium')

    @patch('tickets.serializers.send_ticket_created_email')
    def test_create_without_priority_defaults_to_medium(self, mock_send):
        mock_send.return_value = {'business': True, 'customer': True, 'errors': []}
        self.client.force_authenticate(user=None)
        package_response = self.client.post(
            '/tickets/from-package/',
            {
                'contact': {
                    'email': 'default-medium@example.com',
                    'first_name': 'Default',
                    'last_name': 'Medium',
                },
                'ticket': {
                    'description': 'Creacion sin priority debe usar default medium.',
                    'producto_laqq': False,
                    'marca': 'MarcaD',
                    'modelo': 'ModeloD',
                    'numero_de_serie': 'SN-DEF-PKG',
                },
            },
            format='json',
        )
        self.assertEqual(package_response.status_code, status.HTTP_201_CREATED)
        package_ticket = ServiceTicket.objects.get(id=package_response.data['ticket']['id'])
        self.assertEqual(package_ticket.priority_id, 'medium')

        post_response = self.client.post(
            '/tickets/',
            {
                'contact_id': self.contact.id,
                'product_name': 'Producto Default',
                'description': 'POST tickets sin priority debe usar default medium.',
                'numero_de_serie': 'SN-DEF-POST',
            },
            format='json',
        )
        self.assertEqual(post_response.status_code, status.HTTP_201_CREATED)
        post_ticket = ServiceTicket.objects.get(id=post_response.data['id'])
        self.assertEqual(post_ticket.priority_id, 'medium')

    @patch('tickets.serializers.send_ticket_created_email')
    def test_internal_users_can_set_priority_on_create(self, mock_send):
        """BackOffice conserva poder fijar prioridad al crear."""
        mock_send.return_value = {'business': True, 'customer': True, 'errors': []}
        self.client.force_authenticate(user=self.admin_user)
        admin_response = self.client.post(
            '/tickets/',
            {
                'contact_id': self.contact.id,
                'product_name': 'Producto Admin High',
                'description': 'Admin puede crear ticket con prioridad high.',
                'priority': 'high',
                'numero_de_serie': 'SN-ADMIN-HIGH',
            },
            format='json',
        )
        self.assertEqual(admin_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(admin_response.data['priority'], 'high')
        admin_ticket = ServiceTicket.objects.get(id=admin_response.data['id'])
        self.assertEqual(admin_ticket.priority_id, 'high')

        self.client.force_authenticate(user=self.back_user)
        back_response = self.client.post(
            '/tickets/from-package/',
            {
                'contact': {
                    'email': 'back-prio@example.com',
                    'first_name': 'Back',
                    'last_name': 'Prio',
                },
                'ticket': {
                    'description': 'Usuario back puede fijar prioridad en from-package.',
                    'producto_laqq': False,
                    'marca': 'MarcaB',
                    'modelo': 'ModeloB',
                    'priority': 'high',
                    'numero_de_serie': 'SN-BACK-HIGH',
                },
            },
            format='json',
        )
        self.assertEqual(back_response.status_code, status.HTTP_201_CREATED)
        back_ticket = ServiceTicket.objects.get(id=back_response.data['ticket']['id'])
        self.assertEqual(back_ticket.priority_id, 'high')

    def test_status_change_email_excludes_priority(self):
        from django.core import mail
        from tickets.emails import send_ticket_status_change_email

        mail.outbox.clear()
        ok = send_ticket_status_change_email(self.ticket)
        self.assertTrue(ok)
        self.assertEqual(len(mail.outbox), 1)
        body = mail.outbox[0].body
        html = mail.outbox[0].alternatives[0][0] if mail.outbox[0].alternatives else ''
        self.assertNotIn('Prioridad', body)
        self.assertNotIn('Prioridad', html)
        self.assertNotIn(self.ticket.priority.name, body)

    @patch('tickets.serializers.send_ticket_created_email')
    def test_t8_creation_email_regression(self, mock_send):
        mock_send.return_value = {'business': True, 'customer': True, 'errors': []}
        self.client.force_authenticate(user=None)
        response = self.client.post(
            '/tickets/from-package/',
            {
                'contact': {
                    'email': 't8reg@example.com',
                    'first_name': 'Reg',
                    'last_name': 'T8',
                },
                'ticket': {
                    'description': 'Regresion T8: creacion sigue enviando notificacion.',
                    'producto_laqq': False,
                    'marca': 'MarcaR',
                    'modelo': 'ModeloR',
                    'numero_de_serie': 'SN-T8-REG',
                },
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(mock_send.call_count, 1)

    def test_close_assign_start_resolve_still_work(self):
        self.client.force_authenticate(user=self.admin_user)

        assign_response = self.client.post(
            f'/tickets/{self.ticket.id}/assign/',
            {'assigned_user': self.admin_user.id},
            format='json',
        )
        self.assertEqual(assign_response.status_code, status.HTTP_200_OK)
        self.assertIn('priority', assign_response.data)

        start_response = self.client.post(f'/tickets/{self.ticket.id}/start/')
        self.assertEqual(start_response.status_code, status.HTTP_200_OK)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.state_id, 'in_progress')

        resolve_response = self.client.post(
            f'/tickets/{self.ticket.id}/resolve/',
            {'resolution_notes': 'Resuelto en 9B'},
            format='json',
        )
        self.assertEqual(resolve_response.status_code, status.HTTP_200_OK)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.state_id, 'resolved')

        close_response = self.client.post(f'/tickets/{self.ticket.id}/close/')
        self.assertEqual(close_response.status_code, status.HTTP_200_OK)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.state_id, 'closed')
        self.assertIsNotNone(self.ticket.closed_at)


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    TICKETS_EMAIL='soporte@laqq.com.ar',
    BUSINESS_EMAIL='negocio@example.com',
    TESTING=True,
)
class TicketAssignNotificationTestCase(APITestCase):
    """Ticket 9C: asignación y correo al técnico."""

    def setUp(self):
        from django.core import mail

        mail.outbox.clear()
        self.client = APIClient()

        self.admin_type, _ = UserType.objects.get_or_create(
            id='admin',
            defaults={'name': 'Administrador', 'description': 'Admin'},
        )
        self.back_type, _ = UserType.objects.get_or_create(
            id='back',
            defaults={'name': 'BackOffice', 'description': 'Back office'},
        )
        self.client_type, _ = UserType.objects.get_or_create(
            id='client',
            defaults={'name': 'Cliente', 'description': 'Usuario cliente'},
        )
        self.active_state, _ = UserState.objects.get_or_create(
            id='active',
            defaults={'name': 'Activo'},
        )
        TicketState.objects.get_or_create(
            id='new',
            defaults={'name': 'Nuevo', 'color': '#3498db', 'is_final': False},
        )
        TicketState.objects.get_or_create(
            id='open',
            defaults={'name': 'Abierto', 'color': '#f39c12', 'is_final': False},
        )
        TicketPriority.objects.get_or_create(
            id='medium',
            defaults={'name': 'Media', 'level': 2, 'color': '#3498db'},
        )
        TicketPriority.objects.get_or_create(
            id='high',
            defaults={'name': 'Alta', 'level': 3, 'color': '#f39c12'},
        )
        self.contact_state, _ = ContactState.objects.get_or_create(
            id='active',
            defaults={'name': 'Active'},
        )
        self.contact = Contact.objects.create(
            email='cliente9c@example.com',
            first_name='Cliente',
            last_name='NueveC',
            state=self.contact_state,
        )
        self.admin_user = User.objects.create_user(
            username='admin9c',
            password='admin123',
            email='admin9c@example.com',
            first_name='Admin',
            last_name='User',
            user_type=self.admin_type,
            state=self.active_state,
        )
        self.tech_user = User.objects.create_user(
            username='tech9c',
            password='tech123',
            email='tech9c@example.com',
            first_name='Tecnico',
            last_name='Uno',
            user_type=self.admin_type,
            state=self.active_state,
        )
        self.tech_other = User.objects.create_user(
            username='tech9c2',
            password='tech123',
            email='tech9c2@example.com',
            first_name='Tecnico',
            last_name='Dos',
            user_type=self.admin_type,
            state=self.active_state,
        )
        self.tech_no_email = User.objects.create_user(
            username='tech_no_email',
            password='tech123',
            email='',
            first_name='Sin',
            last_name='Email',
            user_type=self.admin_type,
            state=self.active_state,
        )
        self.back_user = User.objects.create_user(
            username='back9c',
            password='back123',
            email='back9c@example.com',
            user_type=self.back_type,
            state=self.active_state,
        )
        self.client_user = User.objects.create_user(
            username='client9c',
            password='client123',
            email='cliente9c@example.com',
            user_type=self.client_type,
            state=self.active_state,
        )
        self.ticket = ServiceTicket.objects.create(
            contact=self.contact,
            product_name='Producto 9C',
            description='Ticket para probar asignacion y notificacion al tecnico.',
            state=TicketState.objects.get(id='open'),
            priority=TicketPriority.objects.get(id='high'),
        )

    def _mails_to(self, address):
        from django.core import mail

        return [m for m in mail.outbox if address in m.to]

    def test_assign_sends_one_email_to_technician(self):
        from django.core import mail

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/tickets/{self.ticket.id}/assign/',
            {'assigned_user': self.tech_user.id},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.assigned_user_id, self.tech_user.id)

        tech_mails = self._mails_to('tech9c@example.com')
        self.assertEqual(len(tech_mails), 1)
        self.assertIn(self.ticket.ticket_number, tech_mails[0].subject)
        self.assertIn(self.ticket.ticket_number, tech_mails[0].body)
        self.assertIn('Producto 9C', tech_mails[0].body)
        self.assertIn(self.ticket.description, tech_mails[0].body)
        self.assertIn('Abierto', tech_mails[0].body)
        self.assertIn('soporte@laqq.com.ar', tech_mails[0].body)
        self.assertNotIn('Prioridad', tech_mails[0].body)
        self.assertNotIn('Alta', tech_mails[0].body)
        html = tech_mails[0].alternatives[0][0] if tech_mails[0].alternatives else ''
        self.assertNotIn('Prioridad', html)

        # Cliente conserva mail de status (comportamiento previo)
        customer_mails = self._mails_to('cliente9c@example.com')
        self.assertEqual(len(customer_mails), 1)
        self.assertEqual(len(mail.outbox), 2)

    def test_reassign_notifies_only_new_technician(self):
        from django.core import mail

        self.ticket.assigned_user = self.tech_user
        self.ticket.save()
        mail.outbox.clear()

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/tickets/{self.ticket.id}/assign/',
            {'assigned_user': self.tech_other.id},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.assigned_user_id, self.tech_other.id)

        self.assertEqual(len(self._mails_to('tech9c2@example.com')), 1)
        self.assertEqual(len(self._mails_to('tech9c@example.com')), 0)
        self.assertEqual(len(self._mails_to('cliente9c@example.com')), 1)

    def test_reassign_same_technician_skips_tech_email(self):
        from django.core import mail

        self.ticket.assigned_user = self.tech_user
        self.ticket.save()
        mail.outbox.clear()

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/tickets/{self.ticket.id}/assign/',
            {'assigned_user': self.tech_user.id},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(self._mails_to('tech9c@example.com')), 0)
        # Cliente sigue recibiendo status change
        self.assertEqual(len(self._mails_to('cliente9c@example.com')), 1)

    def test_unassign_skips_tech_email(self):
        from django.core import mail

        self.ticket.assigned_user = self.tech_user
        self.ticket.save()
        mail.outbox.clear()

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'/tickets/{self.ticket.id}/assign/',
            {'assigned_user': None},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ticket.refresh_from_db()
        self.assertIsNone(self.ticket.assigned_user_id)
        self.assertEqual(len(self._mails_to('tech9c@example.com')), 0)
        self.assertEqual(len(self._mails_to('cliente9c@example.com')), 1)

    def test_technician_without_email_assignment_succeeds(self):
        from django.core import mail

        mail.outbox.clear()
        self.client.force_authenticate(user=self.admin_user)
        with self.assertLogs('tickets.emails', level='WARNING') as logs:
            response = self.client.post(
                f'/tickets/{self.ticket.id}/assign/',
                {'assigned_user': self.tech_no_email.id},
                format='json',
            )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.assigned_user_id, self.tech_no_email.id)
        self.assertTrue(any('has no email' in line for line in logs.output))
        self.assertEqual(len(self._mails_to('')), 0)
        self.assertEqual(len(self._mails_to('cliente9c@example.com')), 1)

    def test_provider_failure_keeps_assignment_and_sends_customer(self):
        from django.core import mail

        mail.outbox.clear()
        self.client.force_authenticate(user=self.admin_user)
        with patch(
            'tickets.views.send_ticket_assigned_email',
            side_effect=Exception('resend down'),
        ):
            response = self.client.post(
                f'/tickets/{self.ticket.id}/assign/',
                {'assigned_user': self.tech_user.id},
                format='json',
            )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.assigned_user_id, self.tech_user.id)
        # Fallo del mail técnico no bloquea el intento de mail al cliente
        self.assertEqual(len(self._mails_to('cliente9c@example.com')), 1)

    def test_back_cannot_assign(self):
        self.client.force_authenticate(user=self.back_user)
        response = self.client.post(
            f'/tickets/{self.ticket.id}/assign/',
            {'assigned_user': self.tech_user.id},
            format='json',
        )
        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )
        self.ticket.refresh_from_db()
        self.assertIsNone(self.ticket.assigned_user_id)

    def test_client_cannot_assign(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(
            f'/tickets/{self.ticket.id}/assign/',
            {'assigned_user': self.tech_user.id},
            format='json',
        )
        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )
        self.ticket.refresh_from_db()
        self.assertIsNone(self.ticket.assigned_user_id)


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    TICKETS_EMAIL='soporte@laqq.com.ar',
    BUSINESS_EMAIL='negocio@example.com',
    TESTING=True,
)
class TicketCompanyNameOptionalTestCase(APITestCase):
    """Ticket 9D: empresa opcional en from-package; no mutar contactos existentes."""

    def setUp(self):
        from django.core import mail

        mail.outbox.clear()
        self.client = APIClient()
        self.client_type, _ = UserType.objects.get_or_create(
            id='client',
            defaults={'name': 'Cliente', 'description': 'Usuario cliente'},
        )
        self.active_state, _ = UserState.objects.get_or_create(
            id='active',
            defaults={'name': 'Activo'},
        )
        TicketState.objects.get_or_create(
            id='open',
            defaults={'name': 'Abierto', 'color': '#f39c12', 'is_final': False},
        )
        TicketPriority.objects.get_or_create(
            id='medium',
            defaults={'name': 'Media', 'level': 2, 'color': '#3498db'},
        )
        self.contact_state_new, _ = ContactState.objects.get_or_create(
            id='new',
            defaults={'name': 'New'},
        )
        self.contact_state_active, _ = ContactState.objects.get_or_create(
            id='active',
            defaults={'name': 'Active'},
        )

    def _ticket_body(self):
        return {
            'description': 'Solicitud de servicio tecnico con empresa opcional en formulario.',
            'producto_laqq': False,
            'marca': 'Marca9D',
            'modelo': 'Modelo9D',
            'numero_de_serie': 'SN-9D',
        }

    def _payload(self, email, company_name=None, omit_company=False):
        contact = {
            'email': email,
            'first_name': 'Juan',
            'last_name': 'Empresa',
        }
        if not omit_company:
            contact['company_name'] = company_name if company_name is not None else ''
        return {'contact': contact, 'ticket': self._ticket_body()}

    @patch('tickets.serializers.send_ticket_created_email')
    def test_new_contact_with_company_persists(self, mock_send):
        mock_send.return_value = {'business': True, 'customer': True, 'errors': []}
        response = self.client.post(
            '/tickets/from-package/',
            self._payload('nuevo-emp@example.com', company_name='Acme Lab'),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        contact = Contact.objects.get(email='nuevo-emp@example.com')
        self.assertEqual(contact.company_name, 'Acme Lab')

    @patch('tickets.serializers.send_ticket_created_email')
    def test_new_contact_without_company_saves_empty(self, mock_send):
        mock_send.return_value = {'business': True, 'customer': True, 'errors': []}
        response = self.client.post(
            '/tickets/from-package/',
            self._payload('nuevo-vacio@example.com', company_name=''),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        contact = Contact.objects.get(email='nuevo-vacio@example.com')
        self.assertEqual(contact.company_name, '')

    @patch('tickets.serializers.send_ticket_created_email')
    def test_existing_contact_keeps_data_when_company_sent(self, mock_send):
        mock_send.return_value = {'business': True, 'customer': True, 'errors': []}
        existing = Contact.objects.create(
            email='existente-emp@example.com',
            first_name='Ana',
            last_name='Vieja',
            company_name='Empresa Original',
            phone='111',
            state=self.contact_state_active,
        )
        response = self.client.post(
            '/tickets/from-package/',
            self._payload('existente-emp@example.com', company_name='Empresa Nueva Intento'),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        existing.refresh_from_db()
        self.assertEqual(existing.company_name, 'Empresa Original')
        self.assertEqual(existing.first_name, 'Ana')
        self.assertEqual(existing.last_name, 'Vieja')
        self.assertEqual(existing.phone, '111')

    @patch('tickets.serializers.send_ticket_created_email')
    def test_existing_contact_keeps_data_when_company_empty(self, mock_send):
        mock_send.return_value = {'business': True, 'customer': True, 'errors': []}
        existing = Contact.objects.create(
            email='existente-vacio@example.com',
            first_name='Luis',
            last_name='Prev',
            company_name='Empresa Guardada',
            state=self.contact_state_active,
        )
        response = self.client.post(
            '/tickets/from-package/',
            self._payload('existente-vacio@example.com', company_name=''),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        existing.refresh_from_db()
        self.assertEqual(existing.company_name, 'Empresa Guardada')

    @patch('tickets.serializers.send_ticket_created_email')
    def test_existing_company_not_overwritten(self, mock_send):
        mock_send.return_value = {'business': True, 'customer': True, 'errors': []}
        existing = Contact.objects.create(
            email='no-overwrite@example.com',
            first_name='Maria',
            last_name='BO',
            company_name='Registrada En BackOffice',
            state=self.contact_state_active,
        )
        response = self.client.post(
            '/tickets/from-package/',
            self._payload('no-overwrite@example.com', company_name='Intentar Sobrescribir'),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        existing.refresh_from_db()
        self.assertEqual(existing.company_name, 'Registrada En BackOffice')

    @patch('tickets.serializers.send_ticket_created_email')
    def test_omitting_company_is_valid(self, mock_send):
        mock_send.return_value = {'business': True, 'customer': True, 'errors': []}
        response = self.client.post(
            '/tickets/from-package/',
            self._payload('omit-company@example.com', omit_company=True),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        contact = Contact.objects.get(email='omit-company@example.com')
        self.assertEqual(contact.company_name, '')

    def test_t8_creation_emails_still_work_with_company(self):
        from django.core import mail

        mail.outbox.clear()
        response = self.client.post(
            '/tickets/from-package/',
            self._payload('t8-emp@example.com', company_name='Empresa T8'),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 2)
        recipients = {tuple(m.to) for m in mail.outbox}
        self.assertEqual(
            recipients,
            {('soporte@laqq.com.ar',), ('t8-emp@example.com',)},
        )


@override_settings(TESTING=True)
class TicketSerialNumberRequiredTestCase(APITestCase):
    """Ticket 9E: número de serie obligatorio en creación; históricos intactos."""

    def setUp(self):
        self.client = APIClient()
        self.admin_type, _ = UserType.objects.get_or_create(
            id='admin',
            defaults={'name': 'Administrador', 'description': 'Admin'},
        )
        self.active_state, _ = UserState.objects.get_or_create(
            id='active',
            defaults={'name': 'Activo'},
        )
        TicketState.objects.get_or_create(
            id='open',
            defaults={'name': 'Abierto', 'color': '#f39c12', 'is_final': False},
        )
        TicketPriority.objects.get_or_create(
            id='medium',
            defaults={'name': 'Media', 'level': 2, 'color': '#3498db'},
        )
        self.contact_state, _ = ContactState.objects.get_or_create(
            id='active',
            defaults={'name': 'Active'},
        )
        self.contact = Contact.objects.create(
            email='serie9e@example.com',
            first_name='Serie',
            last_name='NueveE',
            company_name='Lab',
            state=self.contact_state,
        )
        self.admin_user = User.objects.create_user(
            username='admin9e',
            password='admin123',
            email='admin9e@example.com',
            user_type=self.admin_type,
            state=self.active_state,
        )
        self.historic = ServiceTicket.objects.create(
            contact=self.contact,
            product_name='Historico sin serie',
            description='Ticket historico sin numero de serie para 9E.',
            state=TicketState.objects.get(id='open'),
            priority=TicketPriority.objects.get(id='medium'),
            numero_de_serie='',
        )

    def _package(self, email, serie=None, omit_serie=False, null_serie=False):
        ticket = {
            'description': 'Solicitud con validacion de numero de serie obligatorio.',
            'producto_laqq': False,
            'marca': 'Marca9E',
            'modelo': 'Modelo9E',
        }
        if null_serie:
            ticket['numero_de_serie'] = None
        elif not omit_serie:
            ticket['numero_de_serie'] = serie
        return {
            'contact': {
                'email': email,
                'first_name': 'Serie',
                'last_name': 'User',
            },
            'ticket': ticket,
        }

    @patch('tickets.serializers.send_ticket_created_email')
    def test_from_package_valid_serial(self, mock_send):
        mock_send.return_value = {'business': True, 'customer': True, 'errors': []}
        response = self.client.post(
            '/tickets/from-package/',
            self._package('ok-pkg@example.com', serie='ABC123'),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = ServiceTicket.objects.get(id=response.data['ticket']['id'])
        self.assertEqual(created.numero_de_serie, 'ABC123')

    @patch('tickets.serializers.send_ticket_created_email')
    def test_from_package_strips_serial(self, mock_send):
        mock_send.return_value = {'business': True, 'customer': True, 'errors': []}
        response = self.client.post(
            '/tickets/from-package/',
            self._package('strip-pkg@example.com', serie='   ABC123   '),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = ServiceTicket.objects.get(id=response.data['ticket']['id'])
        self.assertEqual(created.numero_de_serie, 'ABC123')

    @patch('tickets.serializers.send_ticket_created_email')
    def test_from_package_rejects_missing_empty_null_spaces(self, mock_send):
        mock_send.return_value = {'business': True, 'customer': True, 'errors': []}
        cases = [
            self._package('omit@example.com', omit_serie=True),
            self._package('null@example.com', null_serie=True),
            self._package('empty@example.com', serie=''),
            self._package('spaces@example.com', serie='   '),
        ]
        for payload in cases:
            response = self.client.post('/tickets/from-package/', payload, format='json')
            self.assertEqual(
                response.status_code,
                status.HTTP_400_BAD_REQUEST,
                msg=payload,
            )

    @patch('tickets.serializers.send_ticket_created_email')
    def test_post_tickets_valid_and_rejects_invalid(self, mock_send):
        mock_send.return_value = {'business': True, 'customer': True, 'errors': []}
        self.client.force_authenticate(user=self.admin_user)

        ok = self.client.post(
            '/tickets/',
            {
                'contact_id': self.contact.id,
                'product_name': 'Prod 9E',
                'description': 'Create con serie valida via POST tickets.',
                'numero_de_serie': '   XYZ789   ',
            },
            format='json',
        )
        self.assertEqual(ok.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ok.data['numero_de_serie'], 'XYZ789')
        created = ServiceTicket.objects.get(id=ok.data['id'])
        self.assertEqual(created.numero_de_serie, 'XYZ789')

        for data in (
            {
                'contact_id': self.contact.id,
                'product_name': 'Prod',
                'description': 'Omit serial field completely in POST tickets body.',
            },
            {
                'contact_id': self.contact.id,
                'product_name': 'Prod',
                'description': 'Null serial field in POST tickets body request.',
                'numero_de_serie': None,
            },
            {
                'contact_id': self.contact.id,
                'product_name': 'Prod',
                'description': 'Empty serial field in POST tickets body request.',
                'numero_de_serie': '',
            },
            {
                'contact_id': self.contact.id,
                'product_name': 'Prod',
                'description': 'Spaces only serial in POST tickets body request.',
                'numero_de_serie': '   ',
            },
        ):
            response = self.client.post('/tickets/', data, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, msg=data)

    def test_historic_without_serial_get_and_patch_other_fields(self):
        self.client.force_authenticate(user=self.admin_user)
        get_response = self.client.get(f'/tickets/{self.historic.id}/')
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertEqual(get_response.data.get('numero_de_serie'), '')

        patch_response = self.client.patch(
            f'/tickets/{self.historic.id}/',
            {'product_name': 'Historico actualizado'},
            format='json',
        )
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        self.historic.refresh_from_db()
        self.assertEqual(self.historic.product_name, 'Historico actualizado')
        self.assertEqual(self.historic.numero_de_serie, '')

    @patch('tickets.serializers.send_ticket_created_email')
    def test_backoffice_from_package_still_works(self, mock_send):
        """BackOffice usa from-package vía TicketForm; serie válida crea OK."""
        mock_send.return_value = {'business': True, 'customer': True, 'errors': []}
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            '/tickets/from-package/',
            self._package('bo-form@example.com', serie='BO-SERIE-1'),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(mock_send.call_count, 1)

