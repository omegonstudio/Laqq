from rest_framework import viewsets
from .models import ServiceTicket
from .serializers import ServiceTicketSerializer

class ServiceTicketViewSet(viewsets.ModelViewSet):
    queryset = ServiceTicket.objects.all()
    serializer_class = ServiceTicketSerializer