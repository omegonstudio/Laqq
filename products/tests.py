from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth.models import User
from .models import Brand, Category, Product, ProductSpec
from attachments.models import Attachment
from users.models import UserType


class BrandAPITestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_type = UserType.objects.create(id='admin', name='Admin')
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.user.user_type = self.user_type
        self.user.save()
        self.client.force_authenticate(user=self.user)
        self.brand = Brand.objects.create(name='Test Brand', description='Test Description')

    def test_list_brands(self):
        response = self.client.get('/products/brands/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_brand(self):
        data = {'name': 'New Brand', 'description': 'New Description'}
        response = self.client.post('/products/brands/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Brand.objects.count(), 2)

    def test_retrieve_brand(self):
        response = self.client.get(f'/products/brands/{self.brand.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Brand')

    def test_update_brand(self):
        data = {'name': 'Updated Brand', 'description': 'Updated Description'}
        response = self.client.put(f'/products/brands/{self.brand.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.brand.refresh_from_db()
        self.assertEqual(self.brand.name, 'Updated Brand')

    def test_delete_brand(self):
        response = self.client.delete(f'/products/brands/{self.brand.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Brand.objects.count(), 0)

    def test_search_brand(self):
        Brand.objects.create(name='Another Brand')
        response = self.client.get('/products/brands/?search=Test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class CategoryAPITestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client.force_authenticate(user=self.user)
        self.category = Category.objects.create(name='Test Category', display_order=1)

    def test_list_categories(self):
        response = self.client.get('/products/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_category(self):
        data = {'name': 'New Category', 'display_order': 2}
        response = self.client.post('/products/categories/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Category.objects.count(), 2)

    def test_filter_by_display_order(self):
        Category.objects.create(name='Another Category', display_order=2)
        response = self.client.get('/products/categories/?display_order=1')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class ProductAPITestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123', is_staff=True)
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
        response = self.client.get('/products/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_product(self):
        data = {
            'name': 'New Product',
            'brand': self.brand.id,
            'category': self.category.id,
            'is_active': True
        }
        response = self.client.post('/products/products/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 2)

    def test_filter_by_brand(self):
        response = self.client.get(f'/products/products/?brand={self.brand.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_filter_by_active(self):
        Product.objects.create(
            name='Inactive Product',
            brand=self.brand,
            category=self.category,
            is_active=False
        )
        response = self.client.get('/products/products/?is_active=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_search_product(self):
        response = self.client.get('/products/products/?search=Test')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class ProductSpecAPITestCase(APITestCase):
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
        response = self.client.get('/products/productspecs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_spec(self):
        data = {
            'product': self.product.id,
            'code': 'TEST-002',
            'volume': '200ml'
        }
        response = self.client.post('/products/productspecs/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ProductSpec.objects.count(), 2)

    def test_filter_by_product(self):
        response = self.client.get(f'/products/productspecs/?product={self.product.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
