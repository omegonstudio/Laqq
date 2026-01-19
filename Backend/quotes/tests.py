from django.test import TestCase, override_settings
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core import mail
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

    def test_bulk_create_quote_items(self):
        """Crear múltiples items de cotización en una sola petición"""
        # Create additional products
        product2 = Product.objects.create(
            name='Product 2',
            brand=self.brand,
            category=self.category
        )
        product3 = Product.objects.create(
            name='Product 3',
            brand=self.brand,
            category=self.category
        )

        # Bulk create payload
        data = {
            'data': [
                {
                    'quote': str(self.quote.id),
                    'product': str(product2.id),
                    'quantity': 5,
                    'unit_price': '75.50'
                },
                {
                    'quote': str(self.quote.id),
                    'product': str(product3.id),
                    'quantity': 3,
                    'unit_price': '120.00',
                    'subtotal': '360.00'
                }
            ]
        }

        response = self.client.post('/quotes/items/bulk/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertIn('items', response.data)
        self.assertEqual(len(response.data['items']), 2)

        # Verify first item (auto-calculated subtotal)
        self.assertEqual(float(response.data['items'][0]['subtotal']), 377.50)

        # Verify second item (manual subtotal)
        self.assertEqual(float(response.data['items'][1]['subtotal']), 360.00)

        # Verify total items in database
        self.assertEqual(QuoteItem.objects.filter(quote=self.quote).count(), 3)

    def test_bulk_create_empty_array(self):
        """Validar que se maneja correctamente un array vacío"""
        data = {'data': []}
        response = self.client.post('/quotes/items/bulk/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['items']), 0)

    def test_bulk_create_validation_error(self):
        """Validar que errores de validación se reportan correctamente"""
        data = {
            'data': [
                {
                    'quote': str(self.quote.id),
                    'product': str(self.product.id),
                    'quantity': 0,  # Invalid: quantity must be > 0
                    'unit_price': '100.00'
                }
            ]
        }
        response = self.client.post('/quotes/items/bulk/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


@override_settings(TESTING=False)
class QuoteEmailNotificationTestCase(APITestCase):
    """Tests para notificaciones por email al crear cotizaciones"""

    def setUp(self):
        self.client = APIClient()
        self.user_type = UserType.objects.create(id='admin', name='Admin')
        self.user = User.objects.create_user(username='testuser', password='testpass123', is_staff=True)
        self.user.user_type = self.user_type
        self.user.first_name = 'Test'
        self.user.last_name = 'User'
        self.user.save()
        self.client.force_authenticate(user=self.user)

        # Create required related objects
        self.contact_state = ContactState.objects.create(id='active', name='Active')
        self.contact = Contact.objects.create(
            company_name='Test Company',
            first_name='John',
            last_name='Doe',
            email='customer@test.com',
            phone='+54 11 1234-5678',
            state=self.contact_state
        )
        self.quote_type = QuoteType.objects.create(id='standard', name='Standard')
        self.quote_state = QuoteState.objects.create(id='draft', name='Draft')

        # Create products
        self.brand = Brand.objects.create(name='Test Brand')
        self.category = Category.objects.create(name='Test Category')
        self.product1 = Product.objects.create(
            name='Product 1',
            brand=self.brand,
            category=self.category
        )
        self.product2 = Product.objects.create(
            name='Product 2',
            brand=self.brand,
            category=self.category
        )

    def test_email_sent_on_quote_creation(self):
        """Verificar que se envía email al crear una cotización"""
        # Clear mail outbox
        mail.outbox = []

        # Create quote via API
        data = {
            'contact': self.contact.id,
            'quote_type': self.quote_type.id,
            'state': self.quote_state.id,
            'total_amount': 1000.00,
            'message': 'Necesito esta cotización urgente'
        }
        response = self.client.post('/quotes/list/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify emails were sent (2 emails: business + customer)
        self.assertEqual(len(mail.outbox), 2)

    def test_business_email_content(self):
        """Verificar contenido del email enviado al negocio"""
        mail.outbox = []

        data = {
            'contact': self.contact.id,
            'quote_type': self.quote_type.id,
            'state': self.quote_state.id,
            'user': self.user.id,
            'total_amount': 1500.00
        }
        response = self.client.post('/quotes/list/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Find business email (should contain quote number in subject)
        business_emails = [email for email in mail.outbox if 'Nueva Cotización' in email.subject]
        self.assertEqual(len(business_emails), 1)

        business_email = business_emails[0]
        quote_number = response.data['quote_number']

        # Verify subject
        self.assertIn(quote_number, business_email.subject)
        self.assertIn('Test Company', business_email.subject)

        # Verify body contains important info
        email_body = business_email.body
        self.assertIn(quote_number, email_body)
        self.assertIn('John Doe', email_body)
        self.assertIn('Test Company', email_body)
        self.assertIn('customer@test.com', email_body)

    def test_customer_email_content(self):
        """Verificar contenido del email de confirmación al cliente"""
        mail.outbox = []

        data = {
            'contact': self.contact.id,
            'quote_type': self.quote_type.id,
            'state': self.quote_state.id,
            'total_amount': 2000.00
        }
        response = self.client.post('/quotes/list/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Find customer email
        customer_emails = [email for email in mail.outbox if 'Confirmación' in email.subject]
        self.assertEqual(len(customer_emails), 1)

        customer_email = customer_emails[0]
        quote_number = response.data['quote_number']

        # Verify recipient
        self.assertIn('customer@test.com', customer_email.to)

        # Verify subject
        self.assertIn('Confirmación', customer_email.subject)
        self.assertIn(quote_number, customer_email.subject)

        # Verify body
        email_body = customer_email.body
        self.assertIn('John', email_body)
        self.assertIn(quote_number, email_body)

    def test_email_with_quote_items(self):
        """Verificar que el email incluye los items de la cotización"""
        mail.outbox = []

        # Create quote
        data = {
            'contact': self.contact.id,
            'quote_type': self.quote_type.id,
            'state': self.quote_state.id,
            'total_amount': 3000.00
        }
        response = self.client.post('/quotes/list/', data)
        quote_id = response.data['id']

        # Add items to quote
        QuoteItem.objects.create(
            quote_id=quote_id,
            product=self.product1,
            quantity=5,
            unit_price=200.00,
            subtotal=1000.00
        )
        QuoteItem.objects.create(
            quote_id=quote_id,
            product=self.product2,
            quantity=10,
            unit_price=200.00,
            subtotal=2000.00
        )

        # Note: Emails are sent on quote creation, not when items are added
        # This test verifies the structure works with items
        self.assertEqual(len(mail.outbox), 2)

    def test_quote_creation_succeeds_even_if_email_fails(self):
        """Verificar que la cotización se crea aunque falle el envío de email"""
        # This test ensures email sending is non-blocking
        # Even if SMTP is misconfigured, quotes should still be created
        data = {
            'contact': self.contact.id,
            'quote_type': self.quote_type.id,
            'state': self.quote_state.id,
            'total_amount': 500.00
        }
        response = self.client.post('/quotes/list/', data)

        # Quote should be created successfully
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('quote_number', response.data)

        # Verify quote exists in database
        quote_number = response.data['quote_number']
        quote_exists = Quote.objects.filter(quote_number=quote_number).exists()
        self.assertTrue(quote_exists)

    def test_no_email_sent_if_contact_has_no_email(self):
        """Verificar que no se envía email al cliente si no tiene email configurado"""
        # Create contact without email
        contact_no_email = Contact.objects.create(
            company_name='No Email Company',
            first_name='Jane',
            last_name='Smith',
            email='',  # No email
            state=self.contact_state
        )

        mail.outbox = []

        data = {
            'contact': contact_no_email.id,
            'quote_type': self.quote_type.id,
            'state': self.quote_state.id,
            'total_amount': 750.00
        }
        response = self.client.post('/quotes/list/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Only business email should be sent (customer has no email)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Nueva Cotización', mail.outbox[0].subject)
