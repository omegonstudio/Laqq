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
        Crea y/o actualiza múltiples items de cotización en una sola petición.

        Comportamiento:
        - Items sin 'id': Se crean nuevos
        - Items con 'id': Se actualizan los existentes
        - Puede mezclar creación y actualización en el mismo request

        Ejemplo de payload (crear):
        {
            "data": [
                {
                    "quote": "uuid-de-cotización",
                    "product": "uuid-de-producto",
                    "quantity": 2,
                    "unit_price": "100.50"
                }
            ]
        }

        Ejemplo de payload (actualizar):
        {
            "data": [
                {
                    "id": "uuid-del-item-existente",
                    "quantity": 5,
                    "unit_price": "200.00"
                }
            ]
        }

        Ejemplo de payload (mixto):
        {
            "data": [
                {
                    "id": "uuid-existente",
                    "quantity": 3
                },
                {
                    "quote": "uuid-quote",
                    "product": "uuid-producto",
                    "quantity": 1,
                    "unit_price": "50.00"
                }
            ]
        }
        """
        serializer = BulkQuoteItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()

        created_count = len(result.get('created', []))
        updated_count = len(result.get('updated', []))
        total_count = created_count + updated_count

        message_parts = []
        if created_count > 0:
            message_parts.append(f'{created_count} created')
        if updated_count > 0:
            message_parts.append(f'{updated_count} updated')

        # Serializar todos los items
        all_items = result.get('created', []) + result.get('updated', [])

        return Response(
            {
                'message': f'{total_count} item(s) processed: {", ".join(message_parts)}',
                'created': QuoteItemSerializer(result.get('created', []), many=True).data,
                'updated': QuoteItemSerializer(result.get('updated', []), many=True).data,
                'items': QuoteItemSerializer(all_items, many=True).data
            },
            status=status.HTTP_201_CREATED if created_count > 0 else status.HTTP_200_OK
        )