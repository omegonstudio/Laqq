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

    def test_filter_by_contact(self):
        """Filtrar tickets por cliente/contacto"""
        response = self.client.get(f'/tickets/?contact={self.contact.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_filter_by_state(self):
        """Filtrar tickets por estado (abierto, en proceso, cerrado)"""
        response = self.client.get(f'/tickets/?state={self.ticket_state_new.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_search_ticket(self):
        """Buscar tickets por número o descripción"""
        response = self.client.get('/tickets/?search=T-2025')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_filter_by_assigned_user(self):
        """Filtrar tickets por técnico asignado"""
        self.ticket.assigned_user = self.user
        self.ticket.save()
        response = self.client.get(f'/tickets/?assigned_user={self.user.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

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

    # ========== NUEVOS TESTS: Prioridades ==========

    def test_create_ticket_with_priority(self):
        """Crear ticket con prioridad específica"""
        data = {
            'contact': self.contact.id,
            'product_name': 'Urgent Product',
            'description': 'This is an urgent ticket that requires immediate attention.',
            'priority': 'urgent'
        }
        response = self.client.post('/tickets/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['priority'], 'urgent')

    def test_filter_by_priority(self):
        """Filtrar tickets por prioridad"""
        # Crear ticket urgente
        ServiceTicket.objects.create(
            ticket_number='T-2025-00099',
            contact=self.contact,
            product_name='Urgent Product',
            description='This ticket needs immediate attention right now.',
            state=self.ticket_state_new,
            priority=self.priority_urgent
        )
        response = self.client.get(f'/tickets/?priority=urgent')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

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

    def test_create_ticket_without_product_link(self):
        """Crear ticket sin vincular a producto (solo texto libre)"""
        data = {
            'contact': self.contact.id,
            'product_name': 'Equipo personalizado XYZ',
            'description': 'Problema con equipo que no está en el catálogo de productos.'
        }
        response = self.client.post('/tickets/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['product_name'], 'Equipo personalizado XYZ')
        self.assertIsNone(response.data['product'])

    def test_filter_by_product(self):
        """Filtrar tickets por producto del catálogo"""
        ServiceTicket.objects.create(
            ticket_number='T-2025-00098',
            contact=self.contact,
            product=self.product,
            product_name=self.product.name,
            description='Another ticket for the same product with detailed description.',
            state=self.ticket_state_new,
            priority=self.priority_medium
        )
        response = self.client.get(f'/tickets/?product={self.product.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

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

    def test_manual_state_transition_sets_dates(self):
        """Cambiar estado manualmente debe actualizar fechas automáticamente"""
        # Cambiar a in_progress
        response = self.client.patch(
            f'/tickets/{self.ticket.id}/',
            {'state': 'in_progress'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ticket.refresh_from_db()
        self.assertIsNotNone(self.ticket.started_at)

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

    def test_list_ticket_states(self):
        """Listar todos los estados disponibles"""
        response = self.client.get('/tickets/states/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 5)

    def test_list_ticket_priorities(self):
        """Listar todas las prioridades disponibles"""
        response = self.client.get('/tickets/priorities/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 4)


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

    @patch('tickets.serializers.send_ticket_created_email')
    def test_create_ticket_existing_user_no_duplicate(self, mock_send_email):
        """Si el usuario cliente ya existe, no debe crear duplicado"""
        mock_send_email.return_value = {'business': True, 'customer': True, 'errors': []}

        # Crear usuario cliente existente
        existing_user = User.objects.create_user(
            username='janeclient',
            password='password123',
            email='jane@clientcompany.com',
            user_type=self.client_type,
            state=self.active_state
        )

        # Autenticar como admin
        self.client.force_authenticate(user=self.admin_user)

        # Crear ticket
        data = {
            'contact': self.client_contact.id,
            'product_name': 'Test Product',
            'description': 'This is a test ticket description with enough characters.'
        }
        response = self.client.post('/tickets/', data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verificar que solo existe un usuario con ese email
        users_count = User.objects.filter(email='jane@clientcompany.com').count()
        self.assertEqual(users_count, 1)

        # Email NO debe enviarse si el usuario ya existía
        self.assertFalse(mock_send_email.called)

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

    def test_client_cannot_modify_tickets(self):
        """Cliente no puede modificar tickets (solo lectura)"""
        # Crear cliente usuario
        client_user = User.objects.create_user(
            username='janeclient',
            password='password123',
            email='jane@clientcompany.com',
            user_type=self.client_type,
            state=self.active_state
        )

        # Crear ticket del cliente
        ticket = ServiceTicket.objects.create(
            ticket_number='T-2025-00001',
            contact=self.client_contact,
            product_name='Test Product',
            description='This is a test ticket with description.',
            state=self.ticket_state_new,
            priority=self.priority_medium
        )

        # Autenticar como cliente
        self.client.force_authenticate(user=client_user)

        # Intentar modificar ticket
        response = self.client.patch(
            f'/tickets/{ticket.id}/',
            {'description': 'Modified description'}
        )

        # Cliente no tiene permiso para modificar
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_can_attach_files(self):
        """Cliente puede adjuntar archivos a sus propios tickets"""
        # Crear cliente usuario
        client_user = User.objects.create_user(
            username='janeclient',
            password='password123',
            email='jane@clientcompany.com',
            user_type=self.client_type,
            state=self.active_state
        )

        # Crear ticket del cliente
        ticket = ServiceTicket.objects.create(
            ticket_number='T-2025-00001',
            contact=self.client_contact,
            product_name='Test Product',
            description='This is a test ticket with description.',
            state=self.ticket_state_new,
            priority=self.priority_medium
        )

        # Autenticar como cliente
        self.client.force_authenticate(user=client_user)

        # Adjuntar archivo usando multipart/form-data
        from django.core.files.uploadedfile import SimpleUploadedFile
        test_file = SimpleUploadedFile(
            'image.jpg',
            b'fake image content',
            content_type='image/jpeg'
        )
        response = self.client.post(
            f'/tickets/{ticket.id}/attach_file/',
            {'file': test_file},
            format='multipart'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('attachment_id', response.data)
        self.assertEqual(response.data['file_name'], 'image.jpg')

        # Verificar que el attachment se asoció al ticket
        ticket.refresh_from_db()
        self.assertIsNotNone(ticket.attachment)
        self.assertEqual(ticket.attachment.file_name, 'image.jpg')

    def test_client_cannot_attach_to_other_tickets(self):
        """Cliente no puede adjuntar archivos a tickets de otros clientes"""
        # Crear cliente usuario
        client_user = User.objects.create_user(
            username='janeclient',
            password='password123',
            email='jane@clientcompany.com',
            user_type=self.client_type,
            state=self.active_state
        )

        # Crear otro contacto y ticket
        other_contact = Contact.objects.create(
            company_name='Other Company',
            first_name='Bob',
            last_name='Jones',
            email='bob@other.com',
            state=self.contact_state
        )

        other_ticket = ServiceTicket.objects.create(
            ticket_number='T-2025-00002',
            contact=other_contact,
            product_name='Other Product',
            description='This is another ticket with description.',
            state=self.ticket_state_new,
            priority=self.priority_medium
        )

        # Autenticar como cliente
        self.client.force_authenticate(user=client_user)

        # Intentar adjuntar archivo a ticket de otro cliente
        response = self.client.post(
            f'/tickets/{other_ticket.id}/attach_file/',
            {
                'file_name': 'image.jpg',
                'content_type': 'image/jpeg'
            }
        )

        # Cliente no tiene permiso
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_can_view_all_tickets(self):
        """Admin puede ver todos los tickets"""
        # Crear tickets de diferentes clientes
        ticket1 = ServiceTicket.objects.create(
            ticket_number='T-2025-00001',
            contact=self.client_contact,
            product_name='Product 1',
            description='First ticket with description text.',
            state=self.ticket_state_new,
            priority=self.priority_medium
        )

        other_contact = Contact.objects.create(
            company_name='Other Company',
            first_name='Bob',
            last_name='Jones',
            email='bob@other.com',
            state=self.contact_state
        )

        ticket2 = ServiceTicket.objects.create(
            ticket_number='T-2025-00002',
            contact=other_contact,
            product_name='Product 2',
            description='Second ticket with description text.',
            state=self.ticket_state_new,
            priority=self.priority_medium
        )

        # Autenticar como admin
        self.client.force_authenticate(user=self.admin_user)

        # Listar todos los tickets
        response = self.client.get('/tickets/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Admin debe ver todos los tickets
        self.assertEqual(len(response.data['results']), 2)
