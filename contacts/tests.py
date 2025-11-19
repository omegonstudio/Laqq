from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import ContactState, Contact, Message

User = get_user_model()


class ContactAPITestCase(APITestCase):
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
        response = self.client.get('/contacts/contacts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_contact(self):
        data = {
            'company_name': 'New Company',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'email': 'jane@example.com',
            'state': self.contact_state.id
        }
        response = self.client.post('/contacts/contacts/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Contact.objects.count(), 2)

    def test_validate_invalid_email(self):
        data = {
            'company_name': 'Test Company',
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'invalid-email',
            'state': self.contact_state.id
        }
        response = self.client.post('/contacts/contacts/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validate_short_phone(self):
        data = {
            'company_name': 'Test Company',
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john@example.com',
            'phone': '123',
            'state': self.contact_state.id
        }
        response = self.client.post('/contacts/contacts/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filter_by_state(self):
        response = self.client.get(f'/contacts/contacts/?state={self.contact_state.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_search_contact(self):
        response = self.client.get('/contacts/contacts/?search=John')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_filter_by_assigned_user(self):
        self.contact.assigned_user = self.user
        self.contact.save()
        response = self.client.get(f'/contacts/contacts/?assigned_user={self.user.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class MessageAPITestCase(APITestCase):
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
        response = self.client.get('/contacts/messages/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_message(self):
        data = {
            'company_name': 'New Company',
            'message': 'This is a new message with enough characters to pass validation.',
            'state': self.contact_state.id
        }
        response = self.client.post('/contacts/messages/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Message.objects.count(), 2)

    def test_validate_short_message(self):
        data = {
            'company_name': 'Test Company',
            'message': 'Short',
            'state': self.contact_state.id
        }
        response = self.client.post('/contacts/messages/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_search_message(self):
        response = self.client.get('/contacts/messages/?search=test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
