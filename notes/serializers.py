from rest_framework import serializers
from .models import NoteType, NoteState, Note

class NoteTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoteType
        fields = '__all__'

class NoteStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NoteState
        fields = '__all__'

class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = '__all__'