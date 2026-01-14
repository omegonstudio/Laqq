from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Brand, Category, Product, ProductSpec
from attachments.models import Attachment
from users.models import UserType

User = get_user_model()


class BrandAPITestCase(APITestCase):
    """Tests para el CRUD de Marcas de productos"""

    def setUp(self):
        self.client = APIClient()
        self.user_type = UserType.objects.create(id='admin', name='Admin')
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.user.user_type = self.user_type
        self.user.save()
        self.client.force_authenticate(user=self.user)
        self.brand = Brand.objects.create(name='Test Brand', description='Test Description')

    def test_list_brands(self):
        """Listar todas las marcas con paginación"""
        response = self.client.get('/products/brands/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_brand(self):
        """Crear una nueva marca con nombre y descripción"""
        data = {'name': 'New Brand', 'description': 'New Description'}
        response = self.client.post('/products/brands/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Brand.objects.count(), 2)

    def test_update_brand(self):
        """Actualizar nombre y descripción de una marca existente"""
        data = {'name': 'Updated Brand', 'description': 'Updated Description'}
        response = self.client.put(f'/products/brands/{self.brand.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.brand.refresh_from_db()
        self.assertEqual(self.brand.name, 'Updated Brand')

    def test_delete_brand(self):
        """Eliminar una marca del sistema"""
        response = self.client.delete(f'/products/brands/{self.brand.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Brand.objects.count(), 0)

    def test_search_brand(self):
        """Buscar marcas por nombre usando el parámetro search"""
        Brand.objects.create(name='Another Brand')
        response = self.client.get('/products/brands/?search=Test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_brand_with_logo_returns_url(self):
        """Verificar que logo_url se devuelve cuando hay logo_attachment"""
        from django.core.files.uploadedfile import SimpleUploadedFile

        # Create an attachment for the brand logo
        test_file = SimpleUploadedFile(
            'brand-logo.png',
            b'fake image content',
            content_type='image/png'
        )

        attachment = Attachment.objects.create(
            file=test_file,
            role='image',
            content_type_str='image/png',
            attachable_type='brand',
            attachable_id=self.brand.id
        )

        # Assign logo to brand
        self.brand.logo_attachment = attachment
        self.brand.save()

        # Fetch brand via API
        response = self.client.get(f'/products/brands/{self.brand.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['logo_url'])
        self.assertIn('logo_url', response.data)
        # Verify it's a URL string
        self.assertTrue(isinstance(response.data['logo_url'], str))

    def test_delete_brand_sets_products_brand_to_null(self):
        """Verificar que al borrar una marca, los productos quedan con brand=None"""
        # Create a product with this brand
        category = Category.objects.create(name='Test Category')
        product = Product.objects.create(
            name='Product with Brand',
            brand=self.brand,
            category=category
        )

        # Delete the brand
        self.brand.delete()

        # Verify product still exists but brand is None
        product.refresh_from_db()
        self.assertIsNone(product.brand)
        self.assertEqual(Product.objects.count(), 1)


class CategoryAPITestCase(APITestCase):
    """Tests para el CRUD de Categorías de productos"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.category = Category.objects.create(name='Test Category', display_order=1)

    def test_list_categories(self):
        """Listar todas las categorías con paginación"""
        response = self.client.get('/products/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_category(self):
        """Crear una nueva categoría con nombre y orden de visualización"""
        data = {'name': 'New Category', 'display_order': 2}
        response = self.client.post('/products/categories/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Category.objects.count(), 2)

    def test_create_category_with_level(self):
        """Crear categoría con nivel específico (usando parent para auto-calcular)"""
        # Create parent first
        parent = Category.objects.create(name='Parent Category', display_order=1)

        # Create child with parent - level should auto-calculate to 1
        data = {
            'name': 'Subcategory Level 1',
            'parent': parent.id,
            'display_order': 2
        }
        response = self.client.post('/products/categories/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['level'], 1)
        # Verify in database
        category = Category.objects.get(name='Subcategory Level 1')
        self.assertEqual(category.level, 1)

    def test_category_hierarchy_levels(self):
        """Verificar niveles en jerarquía de categorías"""
        # Create parent category (level 0)
        parent = Category.objects.create(name='Parent Category', level=0)

        # Create child category (level 1)
        child = Category.objects.create(
            name='Child Category',
            parent=parent,
            level=1
        )

        # Create grandchild category (level 2)
        grandchild = Category.objects.create(
            name='Grandchild Category',
            parent=child,
            level=2
        )

        # Verify parent has no parent and level 0
        response = self.client.get(f'/products/categories/{parent.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['level'], 0)
        self.assertIsNone(response.data['parent'])

        # Verify child has parent and level 1
        response = self.client.get(f'/products/categories/{child.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['level'], 1)
        self.assertEqual(str(response.data['parent']), str(parent.id))

        # Verify grandchild has parent and level 2
        response = self.client.get(f'/products/categories/{grandchild.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['level'], 2)
        self.assertEqual(str(response.data['parent']), str(child.id))

    def test_auto_calculate_level_without_parent(self):
        """Verificar que level se auto-calcula como 0 cuando no hay parent"""
        # Create category without parent (no level specified)
        category = Category.objects.create(name='Root Category', display_order=1)
        self.assertEqual(category.level, 0)

    def test_auto_calculate_level_with_parent(self):
        """Verificar que level se auto-calcula basándose en el parent"""
        # Create parent (level 0)
        parent = Category.objects.create(name='Parent', display_order=1)
        self.assertEqual(parent.level, 0)

        # Create child WITHOUT specifying level - should auto-calculate to 1
        child = Category.objects.create(name='Child', parent=parent, display_order=2)
        self.assertEqual(child.level, 1)

        # Create grandchild WITHOUT specifying level - should auto-calculate to 2
        grandchild = Category.objects.create(name='Grandchild', parent=child, display_order=3)
        self.assertEqual(grandchild.level, 2)

    def test_auto_calculate_level_via_api(self):
        """Verificar que level se auto-calcula al crear categoría via API"""
        # Create parent via API
        parent_data = {'name': 'API Parent', 'display_order': 1}
        parent_response = self.client.post('/products/categories/', parent_data)
        self.assertEqual(parent_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(parent_response.data['level'], 0)
        parent_id = parent_response.data['id']

        # Create child via API WITHOUT sending level - should auto-calculate
        child_data = {
            'name': 'API Child',
            'parent': parent_id,
            'display_order': 2
        }
        child_response = self.client.post('/products/categories/', child_data)
        self.assertEqual(child_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(child_response.data['level'], 1)

    def test_delete_category_sets_products_category_to_null(self):
        """Verificar que al borrar una categoría, los productos quedan con category=None"""
        # Create a product with this category
        brand = Brand.objects.create(name='Test Brand')
        product = Product.objects.create(
            name='Product with Category',
            brand=brand,
            category=self.category
        )

        # Delete the category
        self.category.delete()

        # Verify product still exists but category is None
        product.refresh_from_db()
        self.assertIsNone(product.category)
        self.assertEqual(Product.objects.count(), 1)


class ProductAPITestCase(APITestCase):
    """Tests para el CRUD de Productos"""

    def setUp(self):
        self.client = APIClient()
        self.user_type = UserType.objects.create(id='admin', name='Admin')
        self.user = User.objects.create_user(username='testuser', password='testpass123', is_staff=True)
        self.user.user_type = self.user_type
        self.user.save()
        self.client.force_authenticate(user=self.user)
        self.brand = Brand.objects.create(name='Test Brand')
        self.category = Category.objects.create(name='Test Category')
        self.product = Product.objects.create(
            name='Test Product',
            brand=self.brand,
            category=self.category,
            is_active=True
        )

    def test_list_products(self):
        """Listar todos los productos con paginación"""
        response = self.client.get('/products/list/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        # Verify pagination metadata
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        self.assertIn('page_size', response.data)
        self.assertIn('current_page', response.data)
        self.assertIn('total_pages', response.data)
        self.assertEqual(response.data['current_page'], 1)
        self.assertEqual(response.data['total_pages'], 1)
        self.assertEqual(response.data['page_size'], 25)

    def test_create_product(self):
        """Crear un nuevo producto asociado a marca y categoría"""
        data = {
            'name': 'New Product',
            'brand_id': self.brand.id,
            'category_id': self.category.id,
            'is_active': True
        }
        response = self.client.post('/products/list/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 2)
        # Verify brand and category are returned as names, not IDs
        self.assertEqual(response.data['brand'], self.brand.name)
        self.assertEqual(response.data['category'], self.category.name)

    def test_filter_by_brand(self):
        """Filtrar productos por marca específica"""
        response = self.client.get(f'/products/list/?brand={self.brand.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_filter_by_active(self):
        """Filtrar productos por estado activo/inactivo"""
        Product.objects.create(
            name='Inactive Product',
            brand=self.brand,
            category=self.category,
            is_active=False
        )
        response = self.client.get('/products/list/?is_active=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_search_product(self):
        """Buscar productos por nombre usando el parámetro search"""
        response = self.client.get('/products/list/?search=Test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_filter_featured_products(self):
        """Filtrar solo productos destacados"""
        # Create a featured product
        Product.objects.create(
            name='Featured Product',
            brand=self.brand,
            category=self.category,
            is_active=True,
            is_featured=True
        )
        # Create a non-featured product
        Product.objects.create(
            name='Regular Product',
            brand=self.brand,
            category=self.category,
            is_active=True,
            is_featured=False
        )
        response = self.client.get('/products/list/?is_featured=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Featured Product')


class ProductSpecAPITestCase(APITestCase):
    """Tests para el CRUD de Especificaciones de productos (variantes)"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.brand = Brand.objects.create(name='Test Brand')
        self.category = Category.objects.create(name='Test Category')
        self.product = Product.objects.create(
            name='Test Product',
            brand=self.brand,
            category=self.category
        )
        self.spec = ProductSpec.objects.create(
            product=self.product,
            code='TEST-001',
            volume='100ml'
        )

    def test_list_specs(self):
        """Listar todas las especificaciones/variantes de productos"""
        response = self.client.get('/products/specs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_spec(self):
        """Crear una nueva especificación con código y volumen"""
        data = {
            'product': self.product.id,
            'code': 'TEST-002',
            'volume': '200ml'
        }
        response = self.client.post('/products/specs/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ProductSpec.objects.count(), 2)

    def test_filter_by_product(self):
        """Filtrar especificaciones por producto específico"""
        response = self.client.get(f'/products/specs/?product={self.product.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
