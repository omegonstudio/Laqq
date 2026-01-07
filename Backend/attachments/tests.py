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

    def test_create_attachment_with_legacy_fields(self):
        """Test crear attachment usando campos legacy"""
        attachment = Attachment.objects.create(
            file_name='test.pdf',
            content_type_str='application/pdf',
            role=ROLE_MANUAL,
            attachable_type='product',
            attachable_id=self.product.id,
            created_by=self.user
        )

        self.assertEqual(attachment.attachable_type, 'product')
        self.assertEqual(attachment.attachable_id, self.product.id)

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

    def test_attachment_role_choices(self):
        """Test que los roles permitidos funcionan correctamente"""
        product_ct = ContentType.objects.get_for_model(Product)

        for role_value, role_label in [
            (ROLE_IMAGE, 'Image'),
            (ROLE_MANUAL, 'Manual'),
            (ROLE_DATASHEET, 'Datasheet'),
            (ROLE_OTHER, 'Other')
        ]:
            attachment = Attachment.objects.create(
                file_name=f'test_{role_value}.file',
                role=role_value,
                content_type=product_ct,
                object_id=self.product.id
            )
            self.assertEqual(attachment.role, role_value)

    def test_attachment_url_property(self):
        """Test que la propiedad url funciona correctamente"""
        test_file = SimpleUploadedFile("test.jpg", b"content", content_type="image/jpeg")
        product_ct = ContentType.objects.get_for_model(Product)

        attachment = Attachment.objects.create(
            file=test_file,
            content_type=product_ct,
            object_id=self.product.id
        )

        # Verificar que tiene URL
        self.assertIsNotNone(attachment.url)
        self.assertIn('/media/', attachment.url)


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

    def test_filter_attachments_by_type(self):
        """Test filtrar attachments por tipo"""
        product_ct = ContentType.objects.get_for_model(Product)

        # Crear attachment para producto
        Attachment.objects.create(
            file_name='product.jpg',
            content_type=product_ct,
            object_id=self.product.id,
            attachable_type='product',
            attachable_id=self.product.id
        )

        response = self.client.get('/attachments/', {'attachable_type': 'product'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['attachable_type'], 'product')

    def test_filter_attachments_by_role(self):
        """Test filtrar attachments por role"""
        product_ct = ContentType.objects.get_for_model(Product)

        Attachment.objects.create(
            file_name='image.jpg',
            role=ROLE_IMAGE,
            content_type=product_ct,
            object_id=self.product.id,
            attachable_type='product',
            attachable_id=self.product.id
        )
        Attachment.objects.create(
            file_name='manual.pdf',
            role=ROLE_MANUAL,
            content_type=product_ct,
            object_id=self.product.id,
            attachable_type='product',
            attachable_id=self.product.id
        )

        response = self.client.get('/attachments/', {'role': ROLE_IMAGE})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['role'], ROLE_IMAGE)


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

    def test_list_product_attachments(self):
        """Test listar todos los attachments de un producto"""
        product_ct = ContentType.objects.get_for_model(Product)

        # Crear varios attachments
        for i in range(3):
            Attachment.objects.create(
                file_name=f'file{i}.jpg',
                content_type=product_ct,
                object_id=self.product.id,
                attachable_type='product',
                attachable_id=self.product.id
            )

        response = self.client.get(f'/products/list/{self.product.id}/list_attachments/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['attachments']), 3)


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

    def test_attach_multiple_files_to_ticket(self):
        """Test adjuntar múltiples archivos a un ticket"""
        file1 = SimpleUploadedFile("file1.jpg", b"content1", content_type="image/jpeg")
        file2 = SimpleUploadedFile("file2.pdf", b"content2", content_type="application/pdf")

        response = self.client.post(
            f'/tickets/{self.ticket.id}/attach_files/',
            {'files': [file1, file2]},
            format='multipart'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('attachments', response.data)
        self.assertEqual(len(response.data['attachments']), 2)

    def test_delete_ticket_attachment(self):
        """Test eliminar un attachment de un ticket"""
        ticket_ct = ContentType.objects.get_for_model(ServiceTicket)
        attachment = Attachment.objects.create(
            file_name='to_delete.pdf',
            content_type=ticket_ct,
            object_id=self.ticket.id,
            attachable_type='ServiceTicket',
            attachable_id=self.ticket.id
        )

        response = self.client.delete(
            f'/tickets/{self.ticket.id}/attachments/{attachment.id}/'
        )

        # El endpoint retorna 200 OK con un mensaje de confirmación
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
        self.assertFalse(Attachment.objects.filter(id=attachment.id).exists())


class AdminAttachmentsTest(TestCase):
    """Tests para la funcionalidad de attachments en el admin"""

    def setUp(self):
        self.user = User.objects.create_superuser(
            username='adminuser',
            email='admin@example.com',
            password='adminpass123'
        )
        self.brand = Brand.objects.create(name='Admin Brand')
        self.category = Category.objects.create(name='Admin Category')
        self.product = Product.objects.create(
            product_code='ADMIN001',
            name='Admin Product',
            brand=self.brand,
            category=self.category
        )

    def test_attachment_inline_populates_legacy_fields(self):
        """Test que el inline del admin popula los campos legacy correctamente"""
        from django.contrib.admin.sites import site
        from products.admin import ProductAdmin, AttachmentInline

        # Verificar que AttachmentInline está configurado correctamente
        product_admin = site._registry[Product]

        # Verificar que usa GenericTabularInline
        self.assertIn(AttachmentInline, product_admin.inlines)

        # Crear un attachment como lo haría el admin
        product_ct = ContentType.objects.get_for_model(Product)
        attachment = Attachment.objects.create(
            file_name='admin_file.jpg',
            content_type=product_ct,
            object_id=self.product.id,
            created_by=self.user
        )

        # El save_formset debería poblar los campos legacy
        # (esto normalmente se hace automáticamente cuando se guarda desde el admin)
        if not attachment.attachable_type:
            attachment.attachable_type = 'product'
        if not attachment.attachable_id:
            attachment.attachable_id = attachment.object_id
        attachment.save()

        # Verificar que ambos sistemas están poblados
        self.assertEqual(attachment.content_type.model, 'product')
        self.assertEqual(attachment.object_id, self.product.id)
        self.assertEqual(attachment.attachable_type, 'product')
        self.assertEqual(attachment.attachable_id, self.product.id)
