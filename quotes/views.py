from rest_framework import viewsets
from .models import QuoteType, QuoteState, Quote, QuoteItem
from .serializers import QuoteTypeSerializer, QuoteStateSerializer, QuoteSerializer, QuoteItemSerializer
from .permissions import CanCreateOrAdmin

class QuoteTypeViewSet(viewsets.ModelViewSet):
    queryset = QuoteType.objects.all()
    serializer_class = QuoteTypeSerializer

class QuoteStateViewSet(viewsets.ModelViewSet):
    queryset = QuoteState.objects.all()
    serializer_class = QuoteStateSerializer

class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer

class QuoteItemViewSet(viewsets.ModelViewSet):
    queryset = QuoteItem.objects.all()
    serializer_class = QuoteItemSerializer


class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
    permission_classes = [CanCreateOrAdmin]