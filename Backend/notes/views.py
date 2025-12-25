from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import NoteType, NoteState, Note
from .serializers import NoteTypeSerializer, NoteStateSerializer, NoteSerializer

class NoteTypeViewSet(viewsets.ModelViewSet):
    queryset = NoteType.objects.all()
    serializer_class = NoteTypeSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['name']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

class NoteStateViewSet(viewsets.ModelViewSet):
    queryset = NoteState.objects.all()
    serializer_class = NoteStateSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['name', 'color']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['note_type', 'state', 'author']
    search_fields = ['title', 'summary', 'content']
    ordering_fields = ['title', 'created_at', 'updated_at', 'published_at']
    ordering = ['-created_at']