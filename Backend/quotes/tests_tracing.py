from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

from contacts.models import Contact, ContactState
from products.models import Brand, Category, Product
from users.models import UserType
from .models import Quote, QuoteState, QuoteType, QuoteTrace, QuoteItem
from .tracing import can_transition_state, record_quote_trace

User = get_user_model()


class TracingHelpersTest(TestCase):
    def test_can_transition_between_new_states(self):
        self.assertTrue(can_transition_state('enviado', 'aceptado'))
        self.assertTrue(can_transition_state('rechazado', 'abierto'))
        self.assertTrue(can_transition_state('cerrado', 'enviado_fuera'))
        self.assertTrue(can_transition_state('abierto', 'abierto'))


class QuoteTraceAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_type = UserType.objects.create(id='admin', name='Admin')
        self.user = User.objects.create_user(username='adminq', password='x')
        self.user.user_type = self.user_type
        self.user.save()
        self.client.force_authenticate(user=self.user)

        QuoteType.objects.get_or_create(id='standard', defaults={'name': 'Estándar'})
        for sid, name in [
            ('abierto', 'Abierto'),
            ('enviado', 'Enviado'),
            ('enviado_fuera', 'Enviado por fuera del sistema'),
            ('aceptado', 'Aceptado'),
            ('rechazado', 'Rechazado'),
            ('cerrado', 'Cerrado'),
        ]:
            QuoteState.objects.get_or_create(id=sid, defaults={'name': name})

        cs = ContactState.objects.create(id='new', name='Nuevo')
        self.contact = Contact.objects.create(
            email='c@example.com',
            first_name='A',
            last_name='B',
            state=cs,
        )
        brand = Brand.objects.create(name='B')
        cat = Category.objects.create(name='Root')
        self.product = Product.objects.create(
            name='P', brand=brand, category=cat, is_active=True
        )
        self.quote = Quote.objects.create(
            contact=self.contact,
            quote_type_id='standard',
            state_id='abierto',
            message='hola',
        )
        QuoteItem.objects.create(
            quote=self.quote,
            product=self.product,
            quantity=1,
            unit_price=10,
            subtotal=10,
        )

    def test_lifecycle_received_then_managed_on_update(self):
        r = self.client.get('/quotes/list/?lifecycle=received')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        ids = [q['id'] for q in r.data['results']]
        self.assertIn(str(self.quote.id), ids)

        resp = self.client.patch(
            f'/quotes/list/{self.quote.id}/',
            {
                'contact_id': str(self.contact.id),
                'user': str(self.user.id),
                'message': 'editado',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.quote.refresh_from_db()
        self.assertIsNotNone(self.quote.managed_at)
        self.assertTrue(
            QuoteTrace.objects.filter(
                quote=self.quote, reason=QuoteTrace.REASON_ASSIGNEE_CHANGED
            ).exists()
        )

        r2 = self.client.get('/quotes/list/?lifecycle=managed')
        ids2 = [q['id'] for q in r2.data['results']]
        self.assertIn(str(self.quote.id), ids2)

    def test_state_transition_creates_trace(self):
        self.quote.state_id = 'enviado'
        self.quote.save(update_fields=['state'])
        resp = self.client.patch(
            f'/quotes/list/{self.quote.id}/',
            {
                'contact_id': str(self.contact.id),
                'state_id': 'aceptado',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(
            QuoteTrace.objects.filter(
                quote=self.quote, reason=QuoteTrace.REASON_STATE_CHANGED
            ).exists()
        )

    def test_any_state_is_modifiable(self):
        resp = self.client.patch(
            f'/quotes/list/{self.quote.id}/',
            {
                'contact_id': str(self.contact.id),
                'state_id': 'cerrado',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.quote.refresh_from_db()
        self.assertEqual(self.quote.state_id, 'cerrado')

        resp2 = self.client.patch(
            f'/quotes/list/{self.quote.id}/',
            {
                'contact_id': str(self.contact.id),
                'state_id': 'abierto',
            },
            format='json',
        )
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.quote.refresh_from_db()
        self.assertEqual(self.quote.state_id, 'abierto')

    def test_traces_endpoint(self):
        record_quote_trace(self.quote, QuoteTrace.REASON_CREATED, mark_managed=False)
        resp = self.client.get(f'/quotes/list/{self.quote.id}/traces/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data['results'] if 'results' in resp.data else resp.data
        self.assertGreaterEqual(len(results), 1)
