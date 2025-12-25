from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import QuoteType, QuoteState, Quote, QuoteItem
from .serializers import QuoteTypeSerializer, QuoteStateSerializer, QuoteSerializer, QuoteItemSerializer
from .permissions import CanCreateOrAdmin

class QuoteTypeViewSet(viewsets.ModelViewSet):
    queryset = QuoteType.objects.all()
    serializer_class = QuoteTypeSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['name']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

class QuoteStateViewSet(viewsets.ModelViewSet):
    queryset = QuoteState.objects.all()
    serializer_class = QuoteStateSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['name', 'color']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
    permission_classes = [CanCreateOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['contact', 'user', 'quote_type', 'state']
    search_fields = ['quote_number', 'message']
    ordering_fields = ['quote_number', 'created_at', 'updated_at', 'total_amount']
    ordering = ['-created_at']

class QuoteItemViewSet(viewsets.ModelViewSet):
    queryset = QuoteItem.objects.all()
    serializer_class = QuoteItemSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['quote']
    search_fields = ['product_name', 'product_code']
    ordering_fields = ['product_name', 'quantity', 'created_at']
    ordering = ['created_at']