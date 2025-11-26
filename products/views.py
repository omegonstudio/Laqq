from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Brand, Category, Product, ProductSpec
from .serializers import BrandSerializer, CategorySerializer, ProductSerializer, ProductSpecSerializer
from .permissions import IsReadOnlyOrAdmin

class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['name']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['parent', 'display_order']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'display_order', 'created_at']
    ordering = ['display_order']

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().prefetch_related('from_relations__to_product')    
    serializer_class = ProductSerializer    
    permission_classes = [IsReadOnlyOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['brand', 'category', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-created_at']

class ProductSpecViewSet(viewsets.ModelViewSet):
    queryset = ProductSpec.objects.all()
    serializer_class = ProductSpecSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['product', 'code']
    search_fields = ['code', 'volume', 'dimensions']
    ordering_fields = ['code', 'created_at']
    ordering = ['-created_at']