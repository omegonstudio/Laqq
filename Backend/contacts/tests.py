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
        """Si el email ya existe, se retorna el contacto existente (dedup por email) ignorando datos inválidos"""
        data = {
            'company_name': 'Test Company',
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john@example.com',
            'phone': '123',
            'state': self.contact_state.id
        }
        response = self.client.post('/contacts/list/', data)
        # El email ya existe → retorna el contacto existente sin crear duplicado
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Contact.objects.count(), 1)

    def test_validate_short_phone_new_email(self):
        """Validar que el teléfono tenga al menos 7 caracteres para contactos nuevos"""
        data = {
            'company_name': 'Test Company',
            'first_name': 'New',
            'last_name': 'Person',
            'email': 'newperson@example.com',
            'phone': '123',
            'state': self.contact_state.id
        }
        response = self.client.post('/contacts/list/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


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
            email='john@example.com',
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
            'email': 'newcustomer@example.com',
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
            'email': 'test@example.com',
            'message': 'Short',
            'state': self.contact_state.id
        }
        response = self.client.post('/contacts/messages/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validate_invalid_email_in_message(self):
        """Validar que el email tenga formato correcto en mensajes"""
        data = {
            'company_name': 'Test Company',
            'email': 'invalid-email',
            'message': 'This is a valid message with enough characters.',
            'state': self.contact_state.id
        }
        response = self.client.post('/contacts/messages/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
