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
            'contact': self.contact.id,
            'product_name': 'New Product',
            'description': 'This is a new ticket description with enough characters to pass validation.'
        }
        response = self.client.post('/tickets/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('ticket_number', response.data)
        self.assertTrue(response.data['ticket_number'].startswith('T-'))
        # Verificar defaults automáticos
        self.assertEqual(response.data['state'], 'new')
        self.assertEqual(response.data['priority'], 'medium')

    def test_validate_short_description(self):
        """Validar que la descripción tenga al menos 20 caracteres"""
        data = {
            'contact': self.contact.id,
            'product_name': 'Test Product',
            'description': 'Short desc'
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
            'contact': self.contact.id,
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
        self.admin_type = UserType.objects.create(
            id='admin',
            name='Administrador',
            description='Usuario admin'
        )
        self.client_type = UserType.objects.create(
            id='client',
            name='Cliente',
            description='Usuario cliente'
        )
        self.active_state = UserState.objects.create(
            id='active',
            name='Activo'
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
            'contact': self.client_contact.id,
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

        # Verificar que se llamó a send_email
        self.assertTrue(mock_send_email.called)

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

