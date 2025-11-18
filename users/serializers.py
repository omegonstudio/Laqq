from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserType, UserState

User = get_user_model()

class UserTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserType
        fields = '__all__'

class UserStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserState
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    user_type = serializers.PrimaryKeyRelatedField(queryset=UserType.objects.all(), allow_null=True, required=False)
    state = serializers.PrimaryKeyRelatedField(queryset=UserState.objects.all(), allow_null=True, required=False)

    class Meta:
        model = User
        # expose relevant fields; avoid exposing password hash directly
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'user_type', 'state', 'is_active', 'is_staff', 'is_superuser',
            'last_login', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'last_login', 'created_at', 'updated_at']

class UserCreateSerializer(UserSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user