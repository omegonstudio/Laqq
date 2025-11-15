from rest_framework import viewsets
from .models import UserType, UserState
from .serializers import UserTypeSerializer, UserStateSerializer
from django.contrib.auth.models import User
from .serializers import UserSerializer  # Si tienes un serializer para el User estándar

class UserTypeViewSet(viewsets.ModelViewSet):
    queryset = UserType.objects.all()
    serializer_class = UserTypeSerializer

class UserStateViewSet(viewsets.ModelViewSet):
    queryset = UserState.objects.all()
    serializer_class = UserStateSerializer

# Si quieres exponer usuarios vía API
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer