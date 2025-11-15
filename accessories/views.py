from rest_framework import viewsets
from .models import Accessory, ProductAccessory
from .serializers import AccessorySerializer, ProductAccessorySerializer

class AccessoryViewSet(viewsets.ModelViewSet):
    queryset = Accessory.objects.all()
    serializer_class = AccessorySerializer

class ProductAccessoryViewSet(viewsets.ModelViewSet):
    queryset = ProductAccessory.objects.all()
    serializer_class = ProductAccessorySerializer