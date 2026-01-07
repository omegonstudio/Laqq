from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Accessory, ProductAccessory
from .serializers import AccessorySerializer, ProductAccessorySerializer

class AccessoryViewSet(viewsets.ModelViewSet):
    queryset = Accessory.objects.all()
    serializer_class = AccessorySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['brand', 'category', 'is_active']
    search_fields = ['code', 'brand', 'model', 'description']
    ordering_fields = ['code', 'brand', 'price', 'created_at']
    ordering = ['-created_at']

class ProductAccessoryViewSet(viewsets.ModelViewSet):
    queryset = ProductAccessory.objects.all()
    serializer_class = ProductAccessorySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['product', 'accessory']
    ordering = ['product']