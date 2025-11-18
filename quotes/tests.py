from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User
from .models import QuoteType, QuoteState, Quote, QuoteItem
from contacts.models import Contact, ContactState


class QuoteTypeAPITestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.quote_type = QuoteType.objects.create(id='standard', name='Standard Quote')

    def test_list_quote_types(self):
        response = self.client.get('/quotes/quotetypes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_quote_type(self):
        data = {'id': 'express', 'name': 'Express Quote'}
        response = self.client.post('/quotes/quotetypes/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(QuoteType.objects.count(), 2)


class QuoteAPITestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123', is_staff=True)
        self.client.force_authenticate(user=self.user)

        # Create required related objects
        self.contact_state = ContactState.objects.create(id='active', name='Active')
        self.contact = Contact.objects.create(
            company_name='Test Company',
            first_name='John',
            last_name='Doe',
            email='john@test.com',
            state=self.contact_state
        )
        self.quote_type = QuoteType.objects.create(id='standard', name='Standard')
        self.quote_state = QuoteState.objects.create(id='draft', name='Draft')

        self.quote = Quote.objects.create(
            quote_number='Q-2025-00001',
            contact=self.contact,
            quote_type=self.quote_type,
            state=self.quote_state,
            total_amount=1000.00
        )

    def test_list_quotes(self):
        response = self.client.get('/quotes/quotes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_quote_auto_number(self):
        data = {
            'contact': self.contact.id,
            'quote_type': self.quote_type.id,
            'state': self.quote_state.id,
            'total_amount': 500.00
        }
        response = self.client.post('/quotes/quotes/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('quote_number', response.data)
        self.assertTrue(response.data['quote_number'].startswith('Q-'))

    def test_filter_by_state(self):
        response = self.client.get(f'/quotes/quotes/?state={self.quote_state.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_search_quote(self):
        response = self.client.get('/quotes/quotes/?search=Q-2025')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_validate_negative_total_amount(self):
        data = {
            'quote_number': 'Q-2025-99999',
            'contact': self.contact.id,
            'quote_type': self.quote_type.id,
            'state': self.quote_state.id,
            'total_amount': -100.00
        }
        response = self.client.post('/quotes/quotes/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class QuoteItemAPITestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)

        # Create required related objects
        self.contact_state = ContactState.objects.create(id='active', name='Active')
        self.contact = Contact.objects.create(
            company_name='Test Company',
            first_name='John',
            last_name='Doe',
            email='john@test.com',
            state=self.contact_state
        )
        self.quote_type = QuoteType.objects.create(id='standard', name='Standard')
        self.quote_state = QuoteState.objects.create(id='draft', name='Draft')
        self.quote = Quote.objects.create(
            quote_number='Q-2025-00001',
            contact=self.contact,
            quote_type=self.quote_type,
            state=self.quote_state
        )

        self.quote_item = QuoteItem.objects.create(
            quote=self.quote,
            product_name='Test Product',
            quantity=2,
            unit_price=100.00,
            subtotal=200.00
        )

    def test_list_quote_items(self):
        response = self.client.get('/quotes/quoteitems/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_quote_item_auto_subtotal(self):
        data = {
            'quote': self.quote.id,
            'product_name': 'New Product',
            'quantity': 3,
            'unit_price': 50.00
        }
        response = self.client.post('/quotes/quoteitems/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(response.data['subtotal']), 150.00)

    def test_validate_zero_quantity(self):
        data = {
            'quote': self.quote.id,
            'product_name': 'Test Product',
            'quantity': 0,
            'unit_price': 100.00
        }
        response = self.client.post('/quotes/quoteitems/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validate_negative_price(self):
        data = {
            'quote': self.quote.id,
            'product_name': 'Test Product',
            'quantity': 1,
            'unit_price': -50.00
        }
        response = self.client.post('/quotes/quoteitems/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filter_by_quote(self):
        response = self.client.get(f'/quotes/quoteitems/?quote={self.quote.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
