from rest_framework import viewsets
from .models import Attachment
from .serializers import AttachmentSerializer

class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer