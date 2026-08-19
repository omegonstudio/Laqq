from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Prefetch
from .models import QuoteType, QuoteState, Quote, QuoteItem
from products.models import VariantTechnicalSpec
from .serializers import QuoteTypeSerializer, QuoteStateSerializer, QuoteSerializer, QuoteItemSerializer, BulkQuoteItemSerializer, QuotePackageSerializer
from .permissions import CanCreateOrAdmin, AllowPublicQuoteItems
from .emails import send_updated_quote_to_customer
import logging

logger = logging.getLogger(__name__)

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
    queryset = Quote.objects.all().select_related(
        'contact', 'quote_type', 'state', 'user'
    ).prefetch_related(
        'quoteitem_set__product',
        'quoteitem_set__product__brand',
        'quoteitem_set__product__category',
        'quoteitem_set__variant',
        Prefetch(
            'quoteitem_set__variant__variant_technical_specs',
            queryset=VariantTechnicalSpec.objects.select_related('technical_spec'),
        ),
    )
    serializer_class = QuoteSerializer
    permission_classes = [CanCreateOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['contact', 'user', 'quote_type', 'state']
    search_fields = [
        'quote_number',
        'message',
        'contact__email',
        'contact__first_name',
        'contact__last_name',
        'contact__company_name'
    ]
    ordering_fields = ['quote_number', 'created_at', 'updated_at', 'total_amount']
    ordering = ['-created_at']

    @action(detail=False, methods=['post'], url_path='from-package')
    def create_from_package(self, request):
        """
        Crea una cotización completa desde un paquete con gestión inteligente de contactos.

        FUNCIONALIDAD:
        1. Busca un contacto existente por email
        2. Si existe, asocia la cotización a ese contacto (reutiliza el contacto)
        3. Si NO existe, crea un nuevo contacto con los datos proporcionados
        4. Crea la cotización asociada al contacto
        5. Crea los items de la cotización (opcional)
        6. Calcula automáticamente subtotales y el total de la cotización

        ENDPOINT: POST /api/quotes/list/from-package/

        CAMPOS OBLIGATORIOS:
        - contact.email: Email del contacto (debe ser válido)
        - contact.first_name: Nombre del contacto
        - contact.last_name: Apellido del contacto

        CAMPOS OPCIONALES:
        - contact.company_name: Nombre de la empresa
        - contact.phone: Teléfono
        - contact.country: País
        - contact.message: Mensaje del contacto
        - quote.quote_type: ID del tipo de cotización (default: "standard")
        - quote.state: ID del estado de cotización (default: "pending")
        - quote.user: UUID del usuario asignado a la cotización
        - quote.message: Mensaje/notas de la cotización
        - items: Array de items (puede omitirse para cotización sin items)
        - items[].product: UUID del producto
        - items[].quantity: Cantidad (obligatorio si hay items)
        - items[].unit_price: Precio unitario (opcional, usa precio del producto si no se especifica)

        EJEMPLO MÍNIMO (cotización sin items, usando defaults):
        {
            "contact": {
                "email": "cliente@example.com",
                "first_name": "Juan",
                "last_name": "Pérez"
            },
            "quote": {}
        }

        EJEMPLO CON TIPO Y ESTADO EXPLÍCITO:
        {
            "contact": {
                "email": "cliente@example.com",
                "first_name": "Juan",
                "last_name": "Pérez"
            },
            "quote": {
                "quote_type": "express",
                "state": "approved"
            }
        }

        EJEMPLO COMPLETO (cotización con items):
        {
            "contact": {
                "email": "maria@empresa.com",
                "first_name": "María",
                "last_name": "González",
                "company_name": "Tech Solutions SA",
                "phone": "+54 11 4444-5555",
                "country": "Argentina",
                "message": "Cliente referido por campaña 2026"
            },
            "quote": {
                "quote_type": "standard",
                "state": "pending",
                "user": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "message": "Cotización para proyecto de renovación"
            },
            "items": [
                {
                    "product": "prod-uuid-1",
                    "quantity": 2,
                    "unit_price": "150.00"
                },
                {
                    "product": "prod-uuid-2",
                    "quantity": 5,
                    "unit_price": "75.50"
                },
                {
                    "product": "prod-uuid-3",
                    "quantity": 1
                }
            ]
        }

        RESPUESTA EXITOSA (201 Created):
        {
            "message": "Quote created successfully",
            "contact": {
                "id": "uuid-contacto",
                "email": "maria@empresa.com",
                "first_name": "María",
                "last_name": "González",
                "company_name": "Tech Solutions SA",
                "phone": "+54 11 4444-5555",
                "country": "Argentina",
                "state": "new",
                ...
            },
            "quote": {
                "id": "uuid-cotizacion",
                "quote_number": "Q-2026-00015",
                "contact": "uuid-contacto",
                "quote_type": "standard",
                "state": "pending",
                "total_amount": "677.50",
                "message": "Cotización para proyecto de renovación",
                "created_at": "2026-01-19T10:30:00Z",
                ...
            },
            "items": [
                {
                    "id": "uuid-item-1",
                    "quote": "uuid-cotizacion",
                    "product": "prod-uuid-1",
                    "quantity": 2,
                    "unit_price": "150.00",
                    "subtotal": "300.00",
                    ...
                },
                {
                    "id": "uuid-item-2",
                    "quote": "uuid-cotizacion",
                    "product": "prod-uuid-2",
                    "quantity": 5,
                    "unit_price": "75.50",
                    "subtotal": "377.50",
                    ...
                },
                {
                    "id": "uuid-item-3",
                    "quote": "uuid-cotizacion",
                    "product": "prod-uuid-3",
                    "quantity": 1,
                    "unit_price": "0.00",
                    "subtotal": "0.00",
                    ...
                }
            ]
        }

        NOTAS IMPORTANTES:
        - Si el email ya existe en el sistema, NO se crea un nuevo contacto, se usa el existente
        - El quote_number se genera automáticamente (formato: Q-YYYY-NNNNN)
        - Los subtotales se calculan automáticamente (quantity * unit_price)
        - El total_amount de la cotización se calcula sumando todos los subtotals
        - Si no se especifica unit_price en un item, se intenta usar el precio del producto
        - El contacto nuevo se crea con estado "new" si existe, o el primer estado disponible
        - Los items son opcionales, se puede crear una cotización sin items
        """
        serializer = QuotePackageSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        try:
            result = serializer.save()
        except Exception as exc:
            logger.exception(
                "Error creating quote from package. Data: %s",
                request.data
            )
            raise

        logger.info(
            f"Quote package created: Quote {result['quote'].quote_number}, "
            f"Contact {result['contact'].email}, "
            f"{len(result['items'])} items"
        )

        return Response(
            {
                'message': 'Quote created successfully',
                'contact': serializer.to_representation(result)['contact'],
                'quote': serializer.to_representation(result)['quote'],
                'items': serializer.to_representation(result)['items']
            },
            status=status.HTTP_201_CREATED
        )

    @action(
        detail=True,
        methods=['post'],
        url_path='send-updated',
        permission_classes=[IsAuthenticated],
        parser_classes=[MultiPartParser, FormParser, JSONParser],
    )
    def send_updated(self, request, pk=None):
        """
        Envía la cotización actualizada por email al cliente.

        Este endpoint es llamado manualmente desde el backoffice cuando el usuario
        presiona el botón "Enviar" después de actualizar una cotización.

        ENDPOINT: POST /api/quotes/list/{id}/send-updated/

        Acepta tanto JSON como multipart/form-data. Para adjuntar el PDF de la
        cotización generado en el front-end, enviar un FormData con un archivo
        en el campo `pdf_file` (PDF). Si no se envía archivo, el correo se
        manda sin adjunto.

        EJEMPLO:
        POST /api/quotes/list/a1b2c3d4-e5f6-7890-abcd-ef1234567890/send-updated/

        RESPUESTA EXITOSA (200 OK):
        {
            "message": "Updated quote sent successfully to cliente@example.com",
            "quote_number": "Q-2026-00015",
            "sent_to": "cliente@example.com",
            "attachment": "cotizacion.pdf"
        }

        RESPUESTA ERROR (404 Not Found):
        {
            "error": "Quote not found"
        }

        RESPUESTA ERROR (400 Bad Request):
        {
            "error": "Contact has no email address"
        }
        {
            "error": "El archivo adjunto debe ser un PDF"
        }

        RESPUESTA ERROR (500 Internal Server Error):
        {
            "error": "Failed to send email: [error message]"
        }
        """
        # Get the quote (handles 404 automatically)
        quote = self.get_object()

        # Check if contact has email
        if not quote.contact.email:
            return Response(
                {
                    'error': 'Contact has no email address',
                    'quote_number': quote.quote_number
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # PDF adjunto opcional, enviado desde el front como FormData (campo 'pdf_file')
        pdf_file = request.FILES.get('pdf_file')
        if pdf_file is not None:
            is_pdf = (
                pdf_file.content_type == 'application/pdf'
                or pdf_file.name.lower().endswith('.pdf')
            )
            if not is_pdf:
                return Response(
                    {'error': 'El archivo adjunto debe ser un PDF'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:
            # Send the email (con o sin adjunto, según corresponda)
            success = send_updated_quote_to_customer(
                quote, pdf_file=pdf_file, sender=request.user
            )

            if success:
                logger.info(f"Updated quote #{quote.quote_number} sent manually to {quote.contact.email}")
                response_data = {
                    'message': f'Updated quote sent successfully to {quote.contact.email}',
                    'quote_number': quote.quote_number,
                    'sent_to': quote.contact.email
                }
                if pdf_file is not None:
                    response_data['attachment'] = pdf_file.name
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                return Response(
                    {
                        'error': 'Failed to send email',
                        'quote_number': quote.quote_number
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            logger.error(f"Error sending updated quote: {str(e)}")
            return Response(
                {'error': f'Failed to send email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class QuoteItemViewSet(viewsets.ModelViewSet):
    queryset = QuoteItem.objects.all()
    serializer_class = QuoteItemSerializer
    permission_classes = [AllowPublicQuoteItems]
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