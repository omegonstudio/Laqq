from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import ContactState, Contact, Message

User = get_user_model()


class ContactAPITestCase(APITestCase):
    """Tests para el CRUD de Contactos (clientes/prospectos)"""

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
            phone='+1234567890',
            state=self.contact_state
        )

    def test_list_contacts(self):
        """Listar todos los contactos con paginación"""
        response = self.client.get('/contacts/list/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_contact(self):
        """Crear un nuevo contacto con empresa, nombre y email"""
        data = {
            'company_name': 'New Company',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'email': 'jane@example.com',
            'state': self.contact_state.id
        }
        response = self.client.post('/contacts/list/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Contact.objects.count(), 2)

    def test_validate_invalid_email(self):
        """Validar que el email tenga formato correcto"""
        data = {
            'company_name': 'Test Company',
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'invalid-email',
            'state': self.contact_state.id
        }
        response = self.client.post('/contacts/list/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validate_short_phone(self):
        """Validar que el teléfono tenga al menos 7 caracteres"""
        data = {
            'company_name': 'Test Company',
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john@example.com',
            'phone': '123',
            'state': self.contact_state.id
        }
        response = self.client.post('/contacts/list/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filter_by_state(self):
        """Filtrar contactos por estado (activo, inactivo, etc.)"""
        response = self.client.get(f'/contacts/list/?state={self.contact_state.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_search_contact(self):
        """Buscar contactos por nombre, empresa o email"""
        response = self.client.get('/contacts/list/?search=John')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_filter_by_assigned_user(self):
        """Filtrar contactos por usuario asignado"""
        self.contact.assigned_user = self.user
        self.contact.save()
        response = self.client.get(f'/contacts/list/?assigned_user={self.user.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class MessageAPITestCase(APITestCase):
    """Tests para el CRUD de Mensajes de contacto (formulario web)"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.contact_state = ContactState.objects.create(id='active', name='Active')
        self.message = Message.objects.create(
            company_name='Test Company',
            first_name='John',
            last_name='Doe',
            message='This is a test message with enough characters to pass validation.',
            state=self.contact_state
        )

    def test_list_messages(self):
        """Listar todos los mensajes recibidos con paginación"""
        response = self.client.get('/contacts/messages/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_message(self):
        """Crear un nuevo mensaje desde formulario de contacto"""
        data = {
            'company_name': 'New Company',
            'message': 'This is a new message with enough characters to pass validation.',
            'state': self.contact_state.id
        }
        response = self.client.post('/contacts/messages/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Message.objects.count(), 2)

    def test_validate_short_message(self):
        """Validar que el mensaje tenga al menos 10 caracteres"""
        data = {
            'company_name': 'Test Company',
            'message': 'Short',
            'state': self.contact_state.id
        }
        response = self.client.post('/contacts/messages/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_search_message(self):
        """Buscar mensajes por contenido o empresa"""
        response = self.client.get('/contacts/messages/?search=test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
