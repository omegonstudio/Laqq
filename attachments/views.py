from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Attachment
from .serializers import AttachmentSerializer
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
from .models import Attachment

class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['attachable_type', 'attachable_id', 'created_by', 'content_type']
    search_fields = ['file_name']
    ordering_fields = ['file_name', 'created_at', 'size_bytes']
    ordering = ['-created_at']
    
def serve_attachment(request, pk):
    att = get_object_or_404(Attachment, pk=pk)
    if not att.data:
        raise Http404("No content")
    response = HttpResponse(att.data, content_type=att.content_type or 'application/octet-stream')
    disposition = 'inline' if att.content_type and att.content_type.startswith('image/') else 'attachment'
    response['Content-Disposition'] = f'{disposition}; filename="{att.file_name}"'
    return response