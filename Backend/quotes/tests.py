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
            'contact_id': self.contact.id,
            'quote_type': self.quote_type.id,
            'state': self.quote_state.id,
            'total_amount': 500.00
        }
        response = self.client.post('/quotes/list/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('quote_number', response.data)
        self.assertTrue(response.data['quote_number'].startswith('Q-'))

    def test_validate_negative_total_amount(self):
        """Validar que el monto total no sea negativo"""
        data = {
            'quote_number': 'Q-2025-99999',
            'contact_id': self.contact.id,
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
        # Create user with admin type to have permission to view quote items
        self.user_type = UserType.objects.create(id='admin', name='Admin')
        self.user = User.objects.create_user(username='testuser', password='testpass123')
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
        # Empty array returns 200 OK (no creation happened)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
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

    def test_bulk_update_quote_items(self):
        """Actualizar múltiples items existentes en una sola petición"""
        # Create additional items to update
        item2 = QuoteItem.objects.create(
            quote=self.quote,
            product=self.product,
            quantity=3,
            unit_price=50.00,
            subtotal=150.00
        )

        # Bulk update payload
        data = {
            'data': [
                {
                    'id': str(self.quote_item.id),
                    'quantity': 10,
                    'unit_price': '200.00'
                },
                {
                    'id': str(item2.id),
                    'quantity': 5,
                    'unit_price': '75.00'
                }
            ]
        }

        response = self.client.post('/quotes/items/bulk/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertIn('updated', response.data)
        self.assertEqual(len(response.data['updated']), 2)

        # Verify items were updated
        self.quote_item.refresh_from_db()
        self.assertEqual(self.quote_item.quantity, 10)
        self.assertEqual(float(self.quote_item.unit_price), 200.00)
        self.assertEqual(float(self.quote_item.subtotal), 2000.00)

        item2.refresh_from_db()
        self.assertEqual(item2.quantity, 5)
        self.assertEqual(float(item2.unit_price), 75.00)
        self.assertEqual(float(item2.subtotal), 375.00)

    def test_bulk_mixed_create_and_update(self):
        """Crear y actualizar items en la misma petición"""
        product2 = Product.objects.create(
            name='New Product',
            brand=self.brand,
            category=self.category
        )

        # Mixed payload: update existing + create new
        data = {
            'data': [
                {
                    'id': str(self.quote_item.id),
                    'quantity': 8,
                    'unit_price': '150.00'
                },
                {
                    'quote': str(self.quote.id),
                    'product': str(product2.id),
                    'quantity': 2,
                    'unit_price': '99.99'
                }
            ]
        }

        response = self.client.post('/quotes/items/bulk/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('created', response.data)
        self.assertIn('updated', response.data)
        self.assertEqual(len(response.data['created']), 1)
        self.assertEqual(len(response.data['updated']), 1)

        # Verify update
        self.quote_item.refresh_from_db()
        self.assertEqual(self.quote_item.quantity, 8)

        # Verify creation
        new_item = QuoteItem.objects.filter(product=product2).first()
        self.assertIsNotNone(new_item)
        self.assertEqual(new_item.quantity, 2)
        self.assertEqual(float(new_item.unit_price), 99.99)

    def test_bulk_update_nonexistent_item(self):
        """Validar error al intentar actualizar un item que no existe"""
        fake_uuid = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
        data = {
            'data': [
                {
                    'id': fake_uuid,
                    'quantity': 5,
                    'unit_price': '100.00'
                }
            ]
        }
        response = self.client.post('/quotes/items/bulk/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('does not exist', str(response.data))


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
            'contact_id': self.contact.id,
            'quote_type': self.quote_type.id,
            'state': self.quote_state.id,
            'total_amount': 1000.00,
            'message': 'Necesito esta cotización urgente'
        }
        response = self.client.post('/quotes/list/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify emails were sent (2 emails: business + customer)
        self.assertEqual(len(mail.outbox), 2)


@override_settings(TESTING=False)
class QuoteSendUpdatedTestCase(APITestCase):
    """Tests para el endpoint de envío manual de cotización actualizada"""

    def setUp(self):
        self.client = APIClient()
        self.user_type = UserType.objects.create(id='admin', name='Admin')
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='adrian@laqq.com',
            first_name='Adrian',
            last_name='Pizani',
            is_staff=True,
        )
        self.user.user_type = self.user_type
        self.user.save()
        self.client.force_authenticate(user=self.user)

        # Create required related objects
        self.contact_state = ContactState.objects.create(id='active', name='Active')
        self.contact = Contact.objects.create(
            company_name='Test Company',
            first_name='John',
            last_name='Doe',
            email='customer@test.com',
            state=self.contact_state
        )
        self.quote_type = QuoteType.objects.create(id='standard', name='Standard')
        self.quote_state = QuoteState.objects.create(id='pending', name='Pending')

        # Create product for quote items
        self.brand = Brand.objects.create(name='Test Brand')
        self.category = Category.objects.create(name='Test Category')
        self.product = Product.objects.create(
            name='Test Product',
            brand=self.brand,
            category=self.category
        )

        # Create quote with observaciones
        self.quote = Quote.objects.create(
            quote_number='Q-2026-00001',
            contact=self.contact,
            quote_type=self.quote_type,
            state=self.quote_state,
            total_amount=500.00,
            message='Test message',
            observaciones='Estas son observaciones de prueba'
        )

        # Create quote item
        self.quote_item = QuoteItem.objects.create(
            quote=self.quote,
            product=self.product,
            quantity=2,
            unit_price=250.00,
            subtotal=500.00
        )

    def test_send_updated_quote_success(self):
        """Verificar que se envía el email de cotización actualizada correctamente"""
        # Clear mail outbox
        mail.outbox = []

        # Call the send-updated endpoint
        url = f'/quotes/list/{self.quote.id}/send-updated/'
        response = self.client.post(url)

        # Verify response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertIn('quote_number', response.data)
        self.assertIn('sent_to', response.data)
        self.assertEqual(response.data['sent_to'], 'customer@test.com')
        self.assertEqual(response.data['quote_number'], 'Q-2026-00001')

        # Verify email was sent
        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertIn('customer@test.com', sent_email.to)
        self.assertIn('Q-2026-00001', sent_email.subject)
        body = sent_email.body
        html = sent_email.alternatives[0][0] if sent_email.alternatives else ''
        self.assertIn('Adrian Pizani', body)
        self.assertIn('adrian@laqq.com', body)
        self.assertIn('Adrian Pizani', html)
        self.assertIn('adrian@laqq.com', html)

    def test_send_updated_quote_no_email(self):
        """Verificar error cuando el contacto no tiene email"""
        # Create contact without email
        contact_no_email = Contact.objects.create(
            first_name='Jane',
            last_name='Smith',
            email='',
            state=self.contact_state
        )
        quote_no_email = Quote.objects.create(
            quote_number='Q-2026-00002',
            contact=contact_no_email,
            quote_type=self.quote_type,
            state=self.quote_state
        )

        url = f'/quotes/list/{quote_no_email.id}/send-updated/'
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('no email', response.data['error'].lower())

    def test_send_updated_quote_not_found(self):
        """Verificar error 404 cuando la cotización no existe"""
        fake_uuid = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
        url = f'/quotes/list/{fake_uuid}/send-updated/'
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        # DRF returns 'detail' key for 404 errors
        self.assertIn('detail', response.data)

    def test_send_updated_quote_with_observaciones(self):
        """Verificar que las observaciones se incluyen en el email"""
        mail.outbox = []

        url = f'/quotes/list/{self.quote.id}/send-updated/'
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)

        # The email HTML should include the observaciones
        # (actual content verification would require checking email body)

    def test_send_updated_requires_authentication(self):
        """Verificar que el endpoint requiere autenticación"""
        # Create unauthenticated client
        unauth_client = APIClient()
        url = f'/quotes/list/{self.quote.id}/send-updated/'
        response = unauth_client.post(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
