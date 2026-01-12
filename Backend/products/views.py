from rest_framework import viewsets, serializers
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType

from .models import Brand, Category, Product, ProductSpec, ProductSpecification
from .serializers import (
    BrandSerializer,
    CategorySerializer,
    ProductSerializer,
    ProductSpecSerializer,
    ProductSpecificationSerializer,
)
from .permissions import IsReadOnlyOrAdmin

from attachments.serializers import AttachmentSerializer
from attachments.models import Attachment

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
    filterset_fields = ['parent', 'display_order', 'level']
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
    filterset_fields = ['brand', 'category', 'is_active', 'is_featured']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-created_at']

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser], permission_classes=[IsAuthenticatedOrReadOnly])
    def upload_attachment(self, request, pk=None):
        """
        Sube un archivo y lo asocia al producto.
        Campos esperados en multipart:
          - file: el archivo (requerido)
          - role: opcional ('image'|'manual'|'datasheet'|'other'), si no se pasa se infiere por MIME
        Retorna el attachment creado usando AttachmentSerializer (incluye url).
        """
        product = get_object_or_404(Product, pk=pk)
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'detail': 'file field is required'}, status=status.HTTP_400_BAD_REQUEST)

        role = request.data.get('role')
        # inferir role por mime si no se especifica
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

        # Si es el primer attachment de tipo imagen y el producto no tiene imagen principal
        if role == 'image' and not product.image_attachment:
            product.image_attachment = att
            product.save()

        return Response(AttachmentSerializer(att, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser], permission_classes=[IsAuthenticatedOrReadOnly])
    def upload_attachments(self, request, pk=None):
        """
        Sube MÚLTIPLES archivos y los asocia al producto.
        Campos esperados en multipart:
          - files: los archivos (requerido - múltiples)
          - role: opcional ('image'|'manual'|'datasheet'|'other'), aplica a todos

        Ejemplo:
            POST /products/{id}/upload_attachments/
            Content-Type: multipart/form-data
            files: [file1, file2, file3...]
            role: 'image'

        Retorna lista de attachments creados.
        """
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
                # Inferir role por MIME si no se especificó
                current_role = role
                if current_role == 'other' and file_obj.content_type:
                    if file_obj.content_type.startswith('image/'):
                        current_role = 'image'
                    elif 'pdf' in file_obj.content_type:
                        current_role = 'manual'

                # Crear attachment
                product_ct = ContentType.objects.get_for_model(Product)
                attachment = Attachment.objects.create(
                    file=file_obj,
                    role=current_role,
                    content_type_str=file_obj.content_type or 'application/octet-stream',
                    content_type=product_ct,
                    object_id=product.id,
                    attachable_type='product',  # legacy
                    attachable_id=product.id,  # legacy
                    created_by=request.user if request.user and request.user.is_authenticated else None
                )

                # Si es el primer attachment de tipo imagen y el producto no tiene imagen principal
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
        """
        Elimina un attachment específico de un producto.

        Ejemplo:
            DELETE /products/{product_id}/attachments/{attachment_id}/
        """
        product = get_object_or_404(Product, pk=pk)

        try:
            # Buscar el attachment
            attachment = Attachment.objects.get(
                id=attachment_id,
                attachable_type='product',
                attachable_id=product.id
            )

            # Guardar info antes de eliminar
            file_name = attachment.file_name

            # Si es la imagen principal del producto, quitarla
            if product.image_attachment and product.image_attachment.id == attachment.id:
                product.image_attachment = None
                product.save()

            # Eliminar el archivo físico si existe
            if attachment.file:
                try:
                    attachment.file.delete()
                except Exception:
                    pass

            # Eliminar el registro
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
        """
        Lista todos los attachments de un producto.

        Ejemplo:
            GET /products/{id}/list_attachments/

        Nota: Los attachments también se incluyen automáticamente en el serializer del producto.
        """
        product = get_object_or_404(Product, pk=pk)

        # Buscar todos los attachments del producto
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