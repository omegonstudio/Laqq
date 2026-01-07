from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import ContactState, Contact, Message
from .serializers import ContactStateSerializer, ContactSerializer, MessageSerializer

class ContactStateViewSet(viewsets.ModelViewSet):
    queryset = ContactState.objects.all()
    serializer_class = ContactStateSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['name', 'color']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['state', 'assigned_user', 'country']
    search_fields = ['company_name', 'first_name', 'last_name', 'email', 'phone']
    ordering_fields = ['company_name', 'created_at', 'updated_at']
    ordering = ['-created_at']

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['state', 'assigned_user', 'country']
    search_fields = ['company_name', 'first_name', 'last_name', 'message']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']