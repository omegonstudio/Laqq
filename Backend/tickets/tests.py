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
            'description': 'This is a new ticket description with enough characters to pass validation.'
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
            'contact': self.contact.id,
            'product_name': 'Test Product',
            'description': '   '
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
            'description': 'La pipeta no dispensa el volumen correcto según especificación.'
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
            'description': 'This is a test ticket description with enough characters for validation.'
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
    # Signal must run so ContextVar suppression is what blocks Contact emails.
    TESTING=False,
)
class TicketContactEmailSuppressTestCase(APITestCase):
    """
    T10/T12: ticket create sends only ticket emails; Contact notifications
    suppressed via ContextVar when Contact is created from from-package.

    ServiceTicket row duplication on a single submit is not demonstrated;
    no idempotency is implemented here.
    """

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

    def _package_payload(self, email):
        return {
            'contact': {
                'email': email,
                'first_name': 'Ana',
                'last_name': 'Pérez',
                'company_name': 'Empresa',
                'phone': '111',
            },
            'ticket': {
                'description': 'Equipo con falla de calibracion reportada por el cliente.',
                'producto_laqq': False,
                'marca': 'MarcaX',
                'modelo': 'ModeloY',
                'numero_de_serie': 'SN-T10',
            },
        }

    def test_from_package_new_contact_sends_exactly_two_ticket_emails(self):
        from django.core import mail
        from contacts.signals import suppress_contact_created_emails

        response = self.client.post(
            '/tickets/from-package/',
            self._package_payload('nuevo-t10@cliente.com'),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 2)
        recipients = {tuple(m.to) for m in mail.outbox}
        self.assertEqual(
            recipients,
            {('soporte@laqq.com.ar',), ('nuevo-t10@cliente.com',)},
        )
        self.assertFalse(
            any(m.to == ['negocio@example.com'] for m in mail.outbox),
            'Contact BUSINESS_EMAIL notice must not be sent',
        )
        subjects = [m.subject for m in mail.outbox]
        self.assertFalse(any(s.startswith('Nuevo Contacto:') for s in subjects))
        self.assertFalse(
            any(s.startswith('Gracias por contactarnos') for s in subjects)
        )
        self.assertTrue(
            any('Recibimos tu solicitud' in s for s in subjects)
        )
        self.assertFalse(suppress_contact_created_emails.get())

    def test_from_package_existing_contact_sends_exactly_two_ticket_emails(self):
        from django.core import mail

        Contact.objects.create(
            email='existente-t10@cliente.com',
            first_name='Ana',
            last_name='Pérez',
            company_name='Empresa Vieja',
            state=self.contact_state_active,
        )
        mail.outbox.clear()
        response = self.client.post(
            '/tickets/from-package/',
            self._package_payload('existente-t10@cliente.com'),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 2)
        recipients = {tuple(m.to) for m in mail.outbox}
        self.assertEqual(
            recipients,
            {('soporte@laqq.com.ar',), ('existente-t10@cliente.com',)},
        )

    def test_contact_create_without_suppress_sends_business_and_welcome(self):
        """
        Alta de Contact fuera del flujo ticket (mismo post_save que Contactos).
        POST /contacts/list/ devolvió 401 en este entorno de test; se valida el
        signal vía ORM, que es lo que dispara las notificaciones del módulo.
        """
        from django.core import mail

        mail.outbox.clear()
        Contact.objects.create(
            email='contacto-modulo@cliente.com',
            first_name='Luis',
            last_name='Gómez',
            company_name='Lab',
            state=self.contact_state_new,
        )
        self.assertEqual(len(mail.outbox), 2)
        recipients = {tuple(m.to) for m in mail.outbox}
        self.assertEqual(
            recipients,
            {('negocio@example.com',), ('contacto-modulo@cliente.com',)},
        )
        subjects = [m.subject for m in mail.outbox]
        self.assertTrue(any(s.startswith('Nuevo Contacto:') for s in subjects))
        self.assertTrue(
            any(s.startswith('Gracias por contactarnos') for s in subjects)
        )

    def test_suppress_flag_restored_after_ticket_create(self):
        from django.core import mail
        from contacts.signals import suppress_contact_created_emails

        self.client.post(
            '/tickets/from-package/',
            self._package_payload('restore-flag@cliente.com'),
            format='json',
        )
        self.assertFalse(suppress_contact_created_emails.get())

        mail.outbox.clear()
        Contact.objects.create(
            email='after-ticket@cliente.com',
            first_name='Post',
            last_name='Ticket',
            state=self.contact_state_new,
        )
        self.assertEqual(len(mail.outbox), 2)
        recipients = {tuple(m.to) for m in mail.outbox}
        self.assertIn(('negocio@example.com',), recipients)
        self.assertIn(('after-ticket@cliente.com',), recipients)

    def test_status_change_email_unaffected(self):
        from django.core import mail
        from tickets.emails import send_ticket_status_change_email

        contact = Contact.objects.create(
            email='status-t10@cliente.com',
            first_name='Status',
            last_name='User',
            state=self.contact_state_active,
        )
        ticket = ServiceTicket.objects.create(
            contact=contact,
            product_name='Prod',
            description='Ticket para cambio de estado T10.',
            state=TicketState.objects.get(id='closed'),
            priority=TicketPriority.objects.get(id='medium'),
        )
        mail.outbox.clear()
        ok = send_ticket_status_change_email(ticket)
        self.assertTrue(ok)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['status-t10@cliente.com'])
        self.assertIn('Actualización', mail.outbox[0].subject)

