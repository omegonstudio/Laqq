from rest_framework import viewsets
from .models import Brand, Category, Product, ProductSpec
from .serializers import BrandSerializer, CategorySerializer, ProductSerializer, ProductSpecSerializer
from .permissions import IsReadOnlyOrAdmin

class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class ProductSpecViewSet(viewsets.ModelViewSet):
    queryset = ProductSpec.objects.all()
    serializer_class = ProductSpecSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsReadOnlyOrAdmin]