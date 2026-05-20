from rest_framework import viewsets, serializers
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType

from .models import Brand, Category, Product, ProductVariant, TechnicalSpec
from .serializers import (
    BrandSerializer,
    CategorySerializer,
    ProductSerializer,
    ProductVariantSerializer,
    TechnicalSpecSerializer,
)
from .permissions import IsReadOnlyOrAdmin
from .filters import ProductFilter

from attachments.serializers import AttachmentSerializer
from attachments.models import Attachment

class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['name']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['parent', 'display_order', 'level']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'display_order', 'created_at']
    ordering = ['display_order']

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().prefetch_related(
        'from_relations__to_product__brand',
        'technical_specs',
        'variants',
    )
    serializer_class = ProductSerializer
    permission_classes = [IsReadOnlyOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'product_code']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-created_at']

    @swagger_auto_schema(
        operation_description="Sube un archivo y lo asocia al producto",
        manual_parameters=[
            openapi.Parameter('file', openapi.IN_FORM, type=openapi.TYPE_FILE, required=True),
            openapi.Parameter('role', openapi.IN_FORM, type=openapi.TYPE_STRING, required=False),
        ],
        responses={201: AttachmentSerializer}
    )
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser], permission_classes=[IsAuthenticatedOrReadOnly])
    def upload_attachment(self, request, pk=None):
        product = get_object_or_404(Product, pk=pk)
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'detail': 'file field is required'}, status=status.HTTP_400_BAD_REQUEST)

        role = request.data.get('role')
        if not role:
            if file_obj.content_type and file_obj.content_type.startswith('image/'):
                role = 'image'
            else:
                role = 'other'

        payload = {
            'file': file_obj,
            'role': role,
            'attachable_type': 'product',
            'attachable_id': product.id,
            'content_type': file_obj.content_type,
        }
        serializer = AttachmentSerializer(data=payload, context={'request': request})
        serializer.is_valid(raise_exception=True)
        att = serializer.save(created_by=request.user if request.user and request.user.is_authenticated else None)

        if role == 'image' and not product.image_attachment:
            product.image_attachment = att
            product.save()

        return Response(AttachmentSerializer(att, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @swagger_auto_schema(
        operation_description="Sube múltiples archivos y los asocia al producto",
        manual_parameters=[
            openapi.Parameter('files', openapi.IN_FORM, type=openapi.TYPE_FILE, required=True),
            openapi.Parameter('role', openapi.IN_FORM, type=openapi.TYPE_STRING, required=False),
        ],
        responses={201: "Lista de attachments creados"}
    )
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser], permission_classes=[IsAuthenticatedOrReadOnly])
    def upload_attachments(self, request, pk=None):
        product = get_object_or_404(Product, pk=pk)
        files = request.FILES.getlist('files')

        if not files:
            return Response(
                {'detail': 'No files provided. Use "files" field for multiple files.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        role = request.data.get('role', 'other')
        attachments_created = []
        errors = []

        for file_obj in files:
            try:
                current_role = role
                if current_role == 'other' and file_obj.content_type:
                    if file_obj.content_type.startswith('image/'):
                        current_role = 'image'
                    elif 'pdf' in file_obj.content_type:
                        current_role = 'manual'

                product_ct = ContentType.objects.get_for_model(Product)
                attachment = Attachment.objects.create(
                    file=file_obj,
                    role=current_role,
                    content_type_str=file_obj.content_type or 'application/octet-stream',
                    content_type=product_ct,
                    object_id=product.id,
                    attachable_type='product',
                    attachable_id=product.id,
                    created_by=request.user if request.user and request.user.is_authenticated else None
                )

                if current_role == 'image' and not product.image_attachment and len(attachments_created) == 0:
                    product.image_attachment = attachment
                    product.save()

                attachments_created.append(AttachmentSerializer(attachment, context={'request': request}).data)

            except Exception as e:
                errors.append({
                    'file_name': file_obj.name,
                    'error': str(e)
                })

        return Response({
            'message': f'{len(attachments_created)} file(s) uploaded successfully',
            'product_code': product.product_code,
            'attachments': attachments_created,
            'errors': errors
        }, status=status.HTTP_201_CREATED if attachments_created else status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete'], url_path='attachments/(?P<attachment_id>[^/.]+)', permission_classes=[IsAuthenticatedOrReadOnly])
    def delete_attachment(self, request, pk=None, attachment_id=None):
        product = get_object_or_404(Product, pk=pk)

        try:
            attachment = Attachment.objects.get(
                id=attachment_id,
                attachable_type='product',
                attachable_id=product.id
            )

            file_name = attachment.file_name

            if product.image_attachment and product.image_attachment.id == attachment.id:
                product.image_attachment = None
                product.save()

            if attachment.file:
                try:
                    attachment.file.delete()
                except Exception:
                    pass

            attachment.delete()

            return Response({
                'message': 'Attachment deleted successfully',
                'file_name': file_name
            }, status=status.HTTP_200_OK)

        except Attachment.DoesNotExist:
            return Response(
                {'error': 'Attachment not found or does not belong to this product'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error deleting attachment: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticatedOrReadOnly])
    def list_attachments(self, request, pk=None):
        product = get_object_or_404(Product, pk=pk)

        attachments = Attachment.objects.filter(
            attachable_type='product',
            attachable_id=product.id
        ).order_by('-created_at')

        serializer = AttachmentSerializer(attachments, many=True, context={'request': request})

        return Response({
            'product_code': product.product_code,
            'product_name': product.name,
            'total_attachments': attachments.count(),
            'attachments': serializer.data
        }, status=status.HTTP_200_OK)


class ProductVariantViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las variantes de productos.

    Cada variante hereda los atributos del producto padre (brand, category, etc.)
    y puede tener sus propias TechnicalSpecs dinámicas.
    """
    queryset = ProductVariant.objects.all().prefetch_related('technical_specs')
    serializer_class = ProductVariantSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['product', 'code']
    search_fields = ['code', 'name', 'dimensions']
    ordering_fields = ['code', 'created_at']
    ordering = ['-created_at']

    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        """
        Crear múltiples variantes para un producto de una sola vez.

        ENDPOINT: POST /api/products/variants/bulk-create/

        Payload esperado:
        {
            "product": "uuid-del-producto",
            "variants": [
                {"code": "PROD-001-A", "name": "Versión A", "dimensions": "10x5x5cm"},
                {"code": "PROD-001-B", "name": "Versión B", "dimensions": "15x7x7cm"}
            ]
        }
        """
        product_id = request.data.get('product')
        variants_data = request.data.get('variants', [])

        if not product_id:
            return Response(
                {'error': 'Product ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not variants_data:
            return Response(
                {'error': 'At least one variant is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        created_variants = []
        errors = []

        for variant_data in variants_data:
            variant_data['product'] = product_id
            serializer = ProductVariantSerializer(data=variant_data)

            if serializer.is_valid():
                created_variants.append(serializer.save())
            else:
                errors.append({
                    'data': variant_data,
                    'errors': serializer.errors
                })

        if errors:
            return Response(
                {
                    'message': f'{len(created_variants)} variants created, {len(errors)} failed',
                    'created': ProductVariantSerializer(created_variants, many=True).data,
                    'errors': errors
                },
                status=status.HTTP_207_MULTI_STATUS
            )

        return Response(
            {
                'message': f'{len(created_variants)} variants created successfully',
                'variants': ProductVariantSerializer(created_variants, many=True).data
            },
            status=status.HTTP_201_CREATED
        )


class TechnicalSpecViewSet(viewsets.ModelViewSet):
    queryset = TechnicalSpec.objects.all()
    serializer_class = TechnicalSpecSerializer
    permission_classes = [IsReadOnlyOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['key', 'value']
    ordering_fields = ['key', 'created_at', 'updated_at']
    ordering = ['key']


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

    @swagger_auto_schema(
        operation_description="Importar productos desde CSV",
        manual_parameters=[
            openapi.Parameter('csv_file', openapi.IN_FORM, type=openapi.TYPE_FILE, required=True),
            openapi.Parameter('encoding', openapi.IN_FORM, type=openapi.TYPE_STRING, required=False),
            openapi.Parameter('create_missing', openapi.IN_FORM, type=openapi.TYPE_BOOLEAN, required=False),
            openapi.Parameter('skip_downloads', openapi.IN_FORM, type=openapi.TYPE_BOOLEAN, required=False),
        ],
        responses={200: "Resumen de importación"}
    )
    def post(self, request, format=None):
        serializer = BulkUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        csv_file = serializer.validated_data['csv_file']
        encoding = serializer.validated_data.get('encoding', 'utf-8')
        create_missing = serializer.validated_data.get('create_missing', True)
        skip_downloads = serializer.validated_data.get('skip_downloads', False)

        summary = import_products_csv(csv_file, encoding=encoding, create_missing=create_missing, skip_downloads=skip_downloads)
        return Response(summary, status=status.HTTP_200_OK)
