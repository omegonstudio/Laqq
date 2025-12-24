from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Brand, Category, Product, ProductSpec, ProductSpecification
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

    def test_retrieve_brand(self):
        """Obtener detalle de una marca específica por ID"""
        response = self.client.get(f'/products/brands/{self.brand.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Brand')

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

    def test_filter_by_display_order(self):
        """Filtrar categorías por orden de visualización"""
        Category.objects.create(name='Another Category', display_order=2)
        response = self.client.get('/products/categories/?display_order=1')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


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

    def test_pagination_multiple_pages(self):
        """Verificar que la paginación funciona con múltiples páginas"""
        # Create 10 additional products to test pagination
        for i in range(10):
            Product.objects.create(
                name=f'Test Product {i}',
                brand=self.brand,
                category=self.category,
                is_active=True
            )

        # Request with page_size=3 (should create 4 pages with 11 total products)
        response = self.client.get('/products/list/?page_size=3')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 11)  # 1 original + 10 new
        self.assertEqual(response.data['page_size'], 3)
        self.assertEqual(response.data['current_page'], 1)
        self.assertEqual(response.data['total_pages'], 4)  # 11 products / 3 per page = 4 pages
        self.assertEqual(len(response.data['results']), 3)  # First page has 3 products
        self.assertIsNotNone(response.data['next'])  # Should have next page
        self.assertIsNone(response.data['previous'])  # First page has no previous

        # Test page 2
        response = self.client.get('/products/list/?page_size=3&page=2')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['current_page'], 2)
        self.assertEqual(len(response.data['results']), 3)
        self.assertIsNotNone(response.data['next'])  # Should have next page
        self.assertIsNotNone(response.data['previous'])  # Should have previous page

        # Test last page (page 4)
        response = self.client.get('/products/list/?page_size=3&page=4')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['current_page'], 4)
        self.assertEqual(len(response.data['results']), 2)  # Last page has 2 products (11 % 3 = 2)
        self.assertIsNone(response.data['next'])  # Last page has no next
        self.assertIsNotNone(response.data['previous'])  # Should have previous page

        # Test invalid page
        response = self.client.get('/products/list/?page_size=3&page=5')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

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

class ProductSpecificationAPITestCase(APITestCase):
    """Tests para especificaciones dinámicas de productos"""

    def setUp(self):
        self.client = APIClient()
        self.user_type = UserType.objects.create(id='admin', name='Admin')
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.user.user_type = self.user_type
        self.user.save()
        self.client.force_authenticate(user=self.user)

        # Crear brand, category y product
        self.brand = Brand.objects.create(name='Test Brand')
        self.category = Category.objects.create(name='Test Category')
        self.product = Product.objects.create(
            name='Pipeta Automática 100ml',
            brand=self.brand,
            category=self.category
        )

        # Crear algunas especificaciones dinámicas
        self.spec1 = ProductSpecification.objects.create(
            product=self.product,
            key='Voltaje',
            value='220',
            unit='V',
            display_order=1
        )
        self.spec2 = ProductSpecification.objects.create(
            product=self.product,
            key='Material',
            value='Acero inoxidable',
            unit='',
            display_order=2
        )

    def test_product_includes_specifications(self):
        """Verificar que el endpoint de producto incluye las especificaciones dinámicas"""
        response = self.client.get(f'/products/list/{self.product.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('specifications', response.data)
        self.assertEqual(len(response.data['specifications']), 2)

    def test_specifications_ordered_correctly(self):
        """Verificar que las especificaciones se devuelven en orden correcto"""
        response = self.client.get(f'/products/list/{self.product.id}/')
        specs = response.data['specifications']
        self.assertEqual(specs[0]['key'], 'Voltaje')
        self.assertEqual(specs[1]['key'], 'Material')

    def test_specification_fields(self):
        """Verificar que las especificaciones tienen los campos correctos"""
        response = self.client.get(f'/products/list/{self.product.id}/')
        spec = response.data['specifications'][0]
        self.assertIn('key', spec)
        self.assertIn('value', spec)
        self.assertIn('unit', spec)
        self.assertIn('display_order', spec)
        self.assertIn('is_visible', spec)
        self.assertEqual(spec['key'], 'Voltaje')
        self.assertEqual(spec['value'], '220')
        self.assertEqual(spec['unit'], 'V')

    def test_invisible_specifications_included(self):
        """Verificar que las especificaciones ocultas también se incluyen en el API"""
        ProductSpecification.objects.create(
            product=self.product,
            key='Nota interna',
            value='Solo para admin',
            is_visible=False,
            display_order=3
        )
        response = self.client.get(f'/products/list/{self.product.id}/')
        self.assertEqual(len(response.data['specifications']), 3)

    def test_product_without_specifications(self):
        """Verificar que un producto sin specs dinámicas devuelve lista vacía"""
        product2 = Product.objects.create(
            name='Producto sin specs',
            brand=self.brand,
            category=self.category
        )
        response = self.client.get(f'/products/list/{product2.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['specifications']), 0)

    def test_product_has_both_fixed_and_dynamic_specs(self):
        """Verificar que un producto puede tener tanto specs fijas como dinámicas"""
        # Crear spec fija
        ProductSpec.objects.create(
            product=self.product,
            code='TEST-001',
            volume='100ml',
            dimensions='10x5x3 cm'
        )
        response = self.client.get(f'/products/list/{self.product.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('fixed_specs', response.data)
        self.assertIn('specifications', response.data)
        self.assertEqual(len(response.data['fixed_specs']), 1)
        self.assertEqual(len(response.data['specifications']), 2)
