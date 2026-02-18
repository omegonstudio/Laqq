from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
import uuid

from .models import Attachment, ROLE_IMAGE, ROLE_MANUAL, ROLE_DATASHEET, ROLE_OTHER
from products.models import Product, Brand, Category
from tickets.models import ServiceTicket, TicketState, TicketPriority
from contacts.models import Contact, ContactState
from users.models import UserType

User = get_user_model()


class AttachmentModelTest(TestCase):
    """Tests para el modelo Attachment"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.brand = Brand.objects.create(name='Test Brand')
        self.category = Category.objects.create(name='Test Category')
        self.product = Product.objects.create(
            product_code='TEST001',
            name='Test Product',
            brand=self.brand,
            category=self.category
        )

    def test_create_attachment_with_generic_fk(self):
        """Test crear attachment usando GenericForeignKey"""
        product_ct = ContentType.objects.get_for_model(Product)

        attachment = Attachment.objects.create(
            file_name='test.jpg',
            content_type_str='image/jpeg',
            role=ROLE_IMAGE,
            content_type=product_ct,
            object_id=self.product.id,
            created_by=self.user
        )

        self.assertEqual(attachment.content_object, self.product)
        self.assertEqual(attachment.role, ROLE_IMAGE)
        self.assertEqual(attachment.created_by, self.user)

    def test_attachment_file_upload_path(self):
        """Test que el archivo se sube al path correcto"""
        product_ct = ContentType.objects.get_for_model(Product)

        # Crear archivo de prueba
        test_file = SimpleUploadedFile(
            "test_image.jpg",
            b"fake image content",
            content_type="image/jpeg"
        )

        attachment = Attachment.objects.create(
            file=test_file,
            role=ROLE_IMAGE,
            content_type=product_ct,
            object_id=self.product.id,
            attachable_type='product',
            attachable_id=self.product.id,
            created_by=self.user
        )

        # Verificar que el path incluye el tipo y el ID
        self.assertIn('attachments/product/', attachment.file.name)
        self.assertIn(str(self.product.id), attachment.file.name)

        # Verificar que se auto-pobló file_name y size_bytes
        self.assertTrue(attachment.file_name)
        self.assertGreater(attachment.size_bytes, 0)


class AttachmentAPITest(APITestCase):
    """Tests para los endpoints de la API de attachments"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='apiuser',
            email='api@example.com',
            password='apipass123'
        )
        self.client.force_authenticate(user=self.user)

        self.brand = Brand.objects.create(name='API Brand')
        self.category = Category.objects.create(name='API Category')
        self.product = Product.objects.create(
            product_code='API001',
            name='API Product',
            brand=self.brand,
            category=self.category
        )

    def test_list_attachments(self):
        """Test listar todos los attachments"""
        # Crear algunos attachments
        product_ct = ContentType.objects.get_for_model(Product)
        Attachment.objects.create(
            file_name='test1.jpg',
            content_type=product_ct,
            object_id=self.product.id,
            attachable_type='product',
            attachable_id=self.product.id
        )
        Attachment.objects.create(
            file_name='test2.pdf',
            content_type=product_ct,
            object_id=self.product.id,
            attachable_type='product',
            attachable_id=self.product.id
        )

        response = self.client.get('/attachments/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)


class ProductAttachmentsTest(APITestCase):
    """Tests para los attachments de productos"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='productuser',
            email='product@example.com',
            password='productpass123'
        )
        self.client.force_authenticate(user=self.user)

        self.brand = Brand.objects.create(name='Product Brand')
        self.category = Category.objects.create(name='Product Category')
        self.product = Product.objects.create(
            product_code='PROD001',
            name='Test Product',
            brand=self.brand,
            category=self.category
        )

    def test_product_serializer_includes_attachments(self):
        """Test que el serializer de producto incluye los attachments"""
        # Crear attachments
        product_ct = ContentType.objects.get_for_model(Product)
        Attachment.objects.create(
            file_name='product_image.jpg',
            role=ROLE_IMAGE,
            content_type=product_ct,
            object_id=self.product.id,
            attachable_type='product',
            attachable_id=self.product.id
        )

        response = self.client.get(f'/products/list/{self.product.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('attachments', response.data)
        self.assertEqual(len(response.data['attachments']), 1)
        self.assertEqual(response.data['attachments'][0]['file_name'], 'product_image.jpg')

    def test_upload_attachments_to_product(self):
        """Test subir múltiples archivos a un producto"""
        # Crear archivos de prueba
        file1 = SimpleUploadedFile("image1.jpg", b"image content", content_type="image/jpeg")
        file2 = SimpleUploadedFile("manual.pdf", b"pdf content", content_type="application/pdf")

        response = self.client.post(
            f'/products/list/{self.product.id}/upload_attachments/',
            {'files': [file1, file2]},
            format='multipart'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('attachments', response.data)
        self.assertEqual(len(response.data['attachments']), 2)

        # Verificar que se crearon en la base de datos
        attachments = Attachment.objects.filter(
            attachable_type='product',
            attachable_id=self.product.id
        )
        self.assertEqual(attachments.count(), 2)

    def test_delete_attachment_from_product(self):
        """Test eliminar un attachment de un producto"""
        product_ct = ContentType.objects.get_for_model(Product)
        attachment = Attachment.objects.create(
            file_name='to_delete.jpg',
            content_type=product_ct,
            object_id=self.product.id,
            attachable_type='product',
            attachable_id=self.product.id
        )

        response = self.client.delete(
            f'/products/list/{self.product.id}/attachments/{attachment.id}/'
        )

        # El endpoint retorna 200 OK con un mensaje de confirmación
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])

        # Verificar que se eliminó
        self.assertFalse(Attachment.objects.filter(id=attachment.id).exists())


class TicketAttachmentsTest(APITestCase):
    """Tests para los attachments de tickets"""

    def setUp(self):
        self.client = APIClient()

        # Crear UserType para backoffice (usar 'back' que es lo que espera el código de permisos)
        self.user_type, _ = UserType.objects.get_or_create(
            id='back',
            defaults={'name': 'Backoffice'}
        )

        self.user = User.objects.create_user(
            username='ticketuser',
            email='ticket@example.com',
            password='ticketpass123',
            user_type=self.user_type
        )
        self.client.force_authenticate(user=self.user)

        # Crear datos necesarios para el ticket
        self.contact_state = ContactState.objects.create(name='Active')
        self.contact = Contact.objects.create(
            email='contact@example.com',
            first_name='Test',
            last_name='Contact',
            state=self.contact_state
        )
        self.ticket_state = TicketState.objects.create(name='Open')
        self.ticket_priority = TicketPriority.objects.create(name='High', level=1)

        self.ticket = ServiceTicket.objects.create(
            ticket_number='TICK-001',
            contact=self.contact,
            product_name='Test Product',
            description='Test ticket',
            state=self.ticket_state,
            priority=self.ticket_priority
        )

    def test_ticket_serializer_includes_attachments(self):
        """Test que el serializer de ticket incluye los attachments"""
        ticket_ct = ContentType.objects.get_for_model(ServiceTicket)
        Attachment.objects.create(
            file_name='ticket_screenshot.png',
            role=ROLE_IMAGE,
            content_type=ticket_ct,
            object_id=self.ticket.id,
            attachable_type='ServiceTicket',
            attachable_id=self.ticket.id
        )

        response = self.client.get(f'/tickets/{self.ticket.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('attachments', response.data)
        self.assertEqual(len(response.data['attachments']), 1)

    def test_attach_file_to_ticket(self):
        """Test adjuntar un archivo a un ticket"""
        test_file = SimpleUploadedFile("screenshot.png", b"image data", content_type="image/png")

        response = self.client.post(
            f'/tickets/{self.ticket.id}/attach_file/',
            {'file': test_file},
            format='multipart'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('attachment_id', response.data)

        # Verificar que se creó
        attachments = Attachment.objects.filter(
            attachable_type='ServiceTicket',
            attachable_id=self.ticket.id
        )
        self.assertEqual(attachments.count(), 1)
        self.assertEqual(attachments.first().role, ROLE_IMAGE)


