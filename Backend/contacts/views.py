from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
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

    def create(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip()
        phone = request.data.get('phone', '').strip()
        existing = None
        if email:
            existing = Contact.objects.filter(email__iexact=email).first()
        if not existing and phone:
            existing = Contact.objects.filter(phone=phone).first()
        if existing:
            serializer = self.get_serializer(existing)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['state', 'assigned_user', 'country']
    search_fields = ['company_name', 'first_name', 'last_name', 'email', 'phone', 'message']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [AllowAny()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if not data.get('state'):
            default_state = ContactState.objects.filter(id='new').first() or ContactState.objects.first()
            if default_state:
                data['state'] = default_state.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)