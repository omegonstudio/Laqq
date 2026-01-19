from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import QuoteType, QuoteState, Quote, QuoteItem
from .serializers import QuoteTypeSerializer, QuoteStateSerializer, QuoteSerializer, QuoteItemSerializer, BulkQuoteItemSerializer
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

    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk_create(self, request):
        """
        Crea múltiples items de cotización en una sola petición.

        Ejemplo de payload:
        {
            "data": [
                {
                    "quote": "uuid-de-cotización",
                    "product": "uuid-de-producto",
                    "quantity": 2,
                    "unit_price": "100.50",
                    "subtotal": "201.00"
                },
                {
                    "quote": "uuid-de-cotización",
                    "product": "uuid-de-producto-2",
                    "quantity": 1,
                    "unit_price": "50.00"
                }
            ]
        }
        """
        serializer = BulkQuoteItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        items = serializer.save()

        return Response(
            {
                'message': f'{len(items)} item(s) created successfully',
                'items': QuoteItemSerializer(items, many=True).data
            },
            status=status.HTTP_201_CREATED
        )