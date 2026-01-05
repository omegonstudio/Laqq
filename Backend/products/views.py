from rest_framework import viewsets, serializers
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Brand, Category, Product, ProductSpec, ProductSpecification
from .serializers import (
    BrandSerializer,
    CategorySerializer,
    ProductSerializer,
    ProductSpecSerializer,
    ProductSpecificationSerializer,
)
from .permissions import IsReadOnlyOrAdmin

# Existing viewsets retained
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
    queryset = Product.objects.all().prefetch_related(
        'from_relations__to_product__brand',
        'dynamic_specifications'
    )
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


class ProductSpecificationViewSet(viewsets.ModelViewSet):
    queryset = ProductSpecification.objects.all()
    serializer_class = ProductSpecificationSerializer
    permission_classes = [IsReadOnlyOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['product', 'is_visible']
    search_fields = ['key', 'value', 'unit']
    ordering_fields = ['display_order', 'created_at', 'updated_at']
    ordering = ['display_order', 'created_at']

# -------------------
# Bulk upload API
# -------------------
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .importer import import_products_csv

class BulkUploadSerializer(serializers.Serializer):
    csv_file = serializers.FileField()
    encoding = serializers.CharField(required=False, default='utf-8')
    create_missing = serializers.BooleanField(required=False, default=True)
    skip_downloads = serializers.BooleanField(required=False, default=False)

class ProductsBulkUploadAPIView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, format=None):
        serializer = BulkUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        csv_file = serializer.validated_data['csv_file']
        encoding = serializer.validated_data.get('encoding', 'utf-8')
        create_missing = serializer.validated_data.get('create_missing', True)
        skip_downloads = serializer.validated_data.get('skip_downloads', False)

        summary = import_products_csv(csv_file, encoding=encoding, create_missing=create_missing, skip_downloads=skip_downloads)
        return Response(summary, status=status.HTTP_200_OK)