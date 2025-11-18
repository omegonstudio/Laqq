from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Attachment
from .serializers import AttachmentSerializer

class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['attachable_type', 'attachable_id', 'created_by', 'content_type']
    search_fields = ['file_name']
    ordering_fields = ['file_name', 'created_at', 'size_bytes']
    ordering = ['-created_at']