from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import HttpResponse, Http404, FileResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from .models import Attachment
from .serializers import AttachmentSerializer


class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]  # permite multipart uploads
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['attachable_type', 'attachable_id', 'created_by', 'content_type', 'role']
    search_fields = ['file_name']
    ordering_fields = ['file_name', 'created_at', 'size_bytes']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated:
            serializer.save(created_by=user)
        else:
            serializer.save()


def serve_attachment(request, pk):
    """
    Sirve un attachment:
    - Si Attachment.file tiene una URL pública (storage.url), redirige a esa URL.
    - Si no hay URL pública, abre el fichero y lo devuelve con FileResponse.
    - Si no existe file pero existe data (BinaryField), lo devuelve (compatibilidad).
    - Si no hay contenido devuelve 404.
    """
    att = get_object_or_404(Attachment, pk=pk)

    # Preferir FileField si existe
    if getattr(att, 'file', None):
        try:
            # si el storage provee una URL pública, redirigimos (S3, etc.)
            url = att.file.url
        except Exception:
            url = None

        if url:
            return HttpResponseRedirect(url)

        # si no hay URL pública, servimos el archivo directamente
        try:
            file_handle = att.file.open('rb')
            response = FileResponse(file_handle, content_type=att.content_type or 'application/octet-stream')
            disposition = 'inline' if att.content_type and att.content_type.startswith('image/') else 'attachment'
            filename = att.file_name or att.file.name.split('/')[-1]
            response['Content-Disposition'] = f'{disposition}; filename="{filename}"'
            return response
        except Exception:
            # si no se puede abrir el fichero, intentar fallback a data más abajo
            pass

    # Fallback a BinaryField (compatibilidad), si existe
    if getattr(att, 'data', None):
        response = HttpResponse(att.data, content_type=att.content_type or 'application/octet-stream')
        disposition = 'inline' if att.content_type and att.content_type.startswith('image/') else 'attachment'
        response['Content-Disposition'] = f'{disposition}; filename="{att.file_name}"'
        return response

    raise Http404("No content")