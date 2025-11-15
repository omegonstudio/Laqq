from rest_framework import viewsets
from .models import ContactState, Contact, Message
from .serializers import ContactStateSerializer, ContactSerializer, MessageSerializer

class ContactStateViewSet(viewsets.ModelViewSet):
    queryset = ContactState.objects.all()
    serializer_class = ContactStateSerializer

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer