from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import ServiceTicket
from contacts.models import Contact, ContactState

User = get_user_model()


class ServiceTicketAPITestCase(APITestCase):
    """Tests para el CRUD de Tickets de servicio técnico"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)

        self.contact_state = ContactState.objects.create(id='active', name='Active')
        self.contact = Contact.objects.create(
            company_name='Test Company',
            first_name='John',
            last_name='Doe',
            email='john@example.com',
            state=self.contact_state
        )

        self.ticket = ServiceTicket.objects.create(
            ticket_number='T-2025-00001',
            contact=self.contact,
            product_name='Test Product',
            description='This is a test description with enough characters to pass validation requirements.',
            state=self.contact_state
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
            'description': 'This is a new ticket description with enough characters to pass validation.',
            'state': self.contact_state.id
        }
        response = self.client.post('/tickets/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('ticket_number', response.data)
        self.assertTrue(response.data['ticket_number'].startswith('T-'))

    def test_validate_short_description(self):
        """Validar que la descripción tenga al menos 20 caracteres"""
        data = {
            'contact': self.contact.id,
            'product_name': 'Test Product',
            'description': 'Short desc',
            'state': self.contact_state.id
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
        response = self.client.get(f'/tickets/?state={self.contact_state.id}')
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
            'ticket_number': self.ticket.ticket_number,
            'contact': self.contact.id,
            'product_name': 'Updated Product',
            'description': 'This is an updated description with enough characters.',
            'state': self.contact_state.id
        }
        response = self.client.put(f'/tickets/{self.ticket.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.product_name, 'Updated Product')
