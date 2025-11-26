from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import QuoteType, QuoteState, Quote, QuoteItem
from contacts.models import Contact, ContactState
from users.models import UserType
from products.models import Product, Brand, Category

User = get_user_model()


class QuoteTypeAPITestCase(APITestCase):
    """Tests para el CRUD de Tipos de cotización"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.quote_type = QuoteType.objects.create(id='standard', name='Standard Quote')

    def test_list_quote_types(self):
        """Listar todos los tipos de cotización disponibles"""
        response = self.client.get('/quotes/types/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_quote_type(self):
        """Crear un nuevo tipo de cotización (estándar, express, etc.)"""
        data = {'id': 'express', 'name': 'Express Quote'}
        response = self.client.post('/quotes/types/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(QuoteType.objects.count(), 2)


class QuoteAPITestCase(APITestCase):
    """Tests para el CRUD de Cotizaciones"""

    def setUp(self):
        self.client = APIClient()
        self.user_type = UserType.objects.create(id='admin', name='Admin')
        self.user = User.objects.create_user(username='testuser', password='testpass123', is_staff=True)
        self.user.user_type = self.user_type
        self.user.save()
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
        """Listar todas las cotizaciones con paginación"""
        response = self.client.get('/quotes/list/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_quote_auto_number(self):
        """Crear cotización con número automático (Q-YYYY-XXXXX)"""
        data = {
            'contact': self.contact.id,
            'quote_type': self.quote_type.id,
            'state': self.quote_state.id,
            'total_amount': 500.00
        }
        response = self.client.post('/quotes/list/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('quote_number', response.data)
        self.assertTrue(response.data['quote_number'].startswith('Q-'))

    def test_filter_by_state(self):
        """Filtrar cotizaciones por estado (borrador, enviada, aprobada)"""
        response = self.client.get(f'/quotes/list/?state={self.quote_state.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_search_quote(self):
        """Buscar cotizaciones por número o mensaje"""
        response = self.client.get('/quotes/list/?search=Q-2025')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_validate_negative_total_amount(self):
        """Validar que el monto total no sea negativo"""
        data = {
            'quote_number': 'Q-2025-99999',
            'contact': self.contact.id,
            'quote_type': self.quote_type.id,
            'state': self.quote_state.id,
            'total_amount': -100.00
        }
        response = self.client.post('/quotes/list/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class QuoteItemAPITestCase(APITestCase):
    """Tests para el CRUD de Items de cotización (líneas de detalle)"""

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

        # Create product for quote items
        self.brand = Brand.objects.create(name='Test Brand')
        self.category = Category.objects.create(name='Test Category')
        self.product = Product.objects.create(
            name='Test Product',
            brand=self.brand,
            category=self.category
        )

        self.quote_item = QuoteItem.objects.create(
            quote=self.quote,
            product=self.product,
            quantity=2,
            unit_price=100.00,
            subtotal=200.00
        )

    def test_list_quote_items(self):
        """Listar todos los items/líneas de cotizaciones"""
        response = self.client.get('/quotes/items/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_quote_item_auto_subtotal(self):
        """Crear item con cálculo automático de subtotal (cantidad x precio)"""
        new_product = Product.objects.create(
            name='New Product',
            brand=self.brand,
            category=self.category
        )
        data = {
            'quote': self.quote.id,
            'product': new_product.id,
            'quantity': 3,
            'unit_price': 50.00
        }
        response = self.client.post('/quotes/items/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(response.data['subtotal']), 150.00)

    def test_validate_zero_quantity(self):
        """Validar que la cantidad sea mayor a cero"""
        data = {
            'quote': self.quote.id,
            'product': self.product.id,
            'quantity': 0,
            'unit_price': 100.00
        }
        response = self.client.post('/quotes/items/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validate_negative_price(self):
        """Validar que el precio unitario no sea negativo"""
        data = {
            'quote': self.quote.id,
            'product': self.product.id,
            'quantity': 1,
            'unit_price': -50.00
        }
        response = self.client.post('/quotes/items/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filter_by_quote(self):
        """Filtrar items por cotización específica"""
        response = self.client.get(f'/quotes/items/?quote={self.quote.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
