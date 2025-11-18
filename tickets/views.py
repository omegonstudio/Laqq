from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import ServiceTicket
from .serializers import ServiceTicketSerializer

class ServiceTicketViewSet(viewsets.ModelViewSet):
    queryset = ServiceTicket.objects.all()
    serializer_class = ServiceTicketSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['contact', 'state', 'assigned_user']
    search_fields = ['ticket_number', 'product_name', 'description']
    ordering_fields = ['ticket_number', 'created_at', 'updated_at']
    ordering = ['-created_at']