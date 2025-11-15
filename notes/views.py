from rest_framework import viewsets
from .models import NoteType, NoteState, Note
from .serializers import NoteTypeSerializer, NoteStateSerializer, NoteSerializer

class NoteTypeViewSet(viewsets.ModelViewSet):
    queryset = NoteType.objects.all()
    serializer_class = NoteTypeSerializer

class NoteStateViewSet(viewsets.ModelViewSet):
    queryset = NoteState.objects.all()
    serializer_class = NoteStateSerializer

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer