from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserType, UserState

# Simple JWT
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

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
    user_type = UserTypeSerializer(read_only=True)
    state = UserStateSerializer(read_only=True)
    user_type_id = serializers.PrimaryKeyRelatedField(
        queryset=UserType.objects.all(), source='user_type', write_only=True, allow_null=True, required=False
    )
    state_id = serializers.PrimaryKeyRelatedField(
        queryset=UserState.objects.all(), source='state', write_only=True, allow_null=True, required=False
    )

    class Meta:
        model = User
        # expose relevant fields; avoid exposing password hash directly
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'user_type', 'user_type_id', 'state', 'state_id',
            'is_active', 'is_staff', 'is_superuser',
            'last_login', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'last_login', 'created_at', 'updated_at']

class UserCreateSerializer(UserSerializer):
    password = serializers.CharField(write_only=True, required=True)
    username = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['password']

    def create(self, validated_data):
        password = validated_data.pop('password')

        # Auto-generar username desde email si no se proporciona
        if not validated_data.get('username'):
            base = validated_data.get('email', '').split('@')[0]
            username = base
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base}{counter}"
                counter += 1
            validated_data['username'] = username

        # Auto-asignar is_staff=True para usuarios admin/back (acceso al panel Django)
        user_type = validated_data.get('user_type')
        if user_type and user_type.id in ('admin', 'back'):
            validated_data.setdefault('is_staff', True)

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


#
# Custom Token serializer to return user_type alongside tokens
#
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extiende TokenObtainPairSerializer para:
    - Añadir claims ligeros en el token (user_type_id, user_type_name)
    - Incluir en la respuesta JSON un campo `user_type` con {id, name} para que el frontend lo consuma fácilmente.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Añadir claims si el usuario tiene user_type
        if getattr(user, 'user_type', None):
            # user_type.id en tu modelo es un CharField primary key
            token['user_type_id'] = str(user.user_type.id)
            token['user_type_name'] = user.user_type.name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        # Añadir objeto user_type a la respuesta
        if getattr(user, 'user_type', None):
            data['user_type'] = {
                'id': user.user_type.id,
                'name': user.user_type.name
            }
        else:
            data['user_type'] = None

        # opcional: exponer flags útiles (si quieres)
        data['is_staff'] = user.is_staff
        data['is_superuser'] = user.is_superuser

        return data