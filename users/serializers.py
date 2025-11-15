from rest_framework import serializers
from .models import UserType, UserState
from django.contrib.auth.models import User

class UserTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserType
        fields = '__all__'

class UserStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserState
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'