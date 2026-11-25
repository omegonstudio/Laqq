from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from contacts.models import Contact, ContactState
from products.models import Brand, Category, Product
from users.models import UserType
from .models import Quote, QuoteState, QuoteType, QuoteItem, QuoteVersion
from .tracing import next_version_meta

User = get_user_model()


class QuoteVersionAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_type = UserType.objects.create(id='admin', name='Admin')
        self.user = User.objects.create_user(username='adminv', password='x')
        self.user.user_type = self.user_type
        self.user.save()
        self.client.force_authenticate(user=self.user)

        QuoteType.objects.get_or_create(id='standard', defaults={'name': 'Estándar'})
        QuoteState.objects.get_or_create(id='pending', defaults={'name': 'Pendiente'})

        cs = ContactState.objects.create(id='new', name='Nuevo')
        self.contact = Contact.objects.create(
            email='v@example.com',
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
            state_id='pending',
            message='hola',
        )
        QuoteItem.objects.create(
            quote=self.quote,
            product=self.product,
            quantity=1,
            unit_price=10,
            subtotal=10,
        )

    def test_next_version_and_create_with_pdf(self):
        self.assertIsNone(self.quote.managed_at)
        self.assertEqual(QuoteVersion.objects.filter(quote=self.quote).count(), 0)

        next_resp = self.client.get(f'/quotes/list/{self.quote.id}/versions/next/')
        self.assertEqual(next_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(next_resp.data['version_number'], 1)
        self.assertEqual(
            next_resp.data['version_label'],
            f'{self.quote.quote_number}-1',
        )

        pdf = SimpleUploadedFile(
            'Q-test-1.pdf',
            b'%PDF-1.4 fake',
            content_type='application/pdf',
        )
        create_resp = self.client.post(
            f'/quotes/list/{self.quote.id}/versions/',
            {'pdf_file': pdf, 'reason': 'saved'},
            format='multipart',
        )
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_resp.data['version_number'], 1)
        self.assertEqual(
            create_resp.data['version_label'],
            f'{self.quote.quote_number}-1',
        )
        self.assertTrue(create_resp.data['has_pdf'])

        self.quote.refresh_from_db()
        self.assertIsNotNone(self.quote.managed_at)

        list_resp = self.client.get(f'/quotes/list/{self.quote.id}/versions/')
        self.assertEqual(list_resp.status_code, status.HTTP_200_OK)
        results = list_resp.data['results'] if 'results' in list_resp.data else list_resp.data
        self.assertEqual(len(results), 1)

        version_id = create_resp.data['id']
        pdf_resp = self.client.get(
            f'/quotes/list/{self.quote.id}/versions/{version_id}/pdf/'
        )
        self.assertEqual(pdf_resp.status_code, status.HTTP_200_OK)

        meta2 = next_version_meta(self.quote)
        self.assertEqual(meta2['version_number'], 2)
        self.assertEqual(meta2['version_label'], f'{self.quote.quote_number}-2')

    def test_web_create_does_not_create_version(self):
        """Sanity: alta de Quote no genera QuoteVersion (solo el save del BO)."""
        self.assertEqual(self.quote.versions.count(), 0)
