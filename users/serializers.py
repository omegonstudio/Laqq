from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from django_otp.plugins.otp_totp.models import TOTPDevice
import pyotp
import qrcode
import io
import base64
from .models import User, Role, Permission, RolePermission


class PermissionSerializer(serializers.ModelSerializer):
    """Serializer para Permisos"""
    
    module_display = serializers.CharField(source='get_module_display', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = Permission
        fields = [
            'id', 'module', 'module_display', 'action', 'action_display',
            'codename', 'description', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'codename', 'created_at']


class RolePermissionSerializer(serializers.ModelSerializer):
    """Serializer para la relación Role-Permission"""
    
    permission_detail = PermissionSerializer(source='permission', read_only=True)
    granted_by_email = serializers.EmailField(source='granted_by.email', read_only=True)
    
    class Meta:
        model = RolePermission
        fields = [
            'id', 'role', 'permission', 'permission_detail',
            'granted_at', 'granted_by', 'granted_by_email'
        ]
        read_only_fields = ['id', 'granted_at']


class RoleSerializer(serializers.ModelSerializer):
    """Serializer para Roles"""
    
    permissions = serializers.SerializerMethodField()
    users_count = serializers.IntegerField(source='users.count', read_only=True)
    name_display = serializers.CharField(source='get_name_display', read_only=True)
    
    class Meta:
        model = Role
        fields = [
            'id', 'name', 'name_display', 'description', 'is_active',
            'permissions', 'users_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_permissions(self, obj):
        role_permissions = RolePermission.objects.filter(role=obj).select_related('permission')
        return PermissionSerializer([rp.permission for rp in role_permissions], many=True).data


class RoleSimpleSerializer(serializers.ModelSerializer):
    """Serializer simple para Role (sin permisos)"""
    
    name_display = serializers.CharField(source='get_name_display', read_only=True)
    
    class Meta:
        model = Role
        fields = ['id', 'name', 'name_display', 'description']


class UserSerializer(serializers.ModelSerializer):
    """Serializer completo para Usuario"""
    
    role_detail = RoleSimpleSerializer(source='role', read_only=True)
    permissions = serializers.SerializerMethodField()
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'role_detail', 'permissions',
            'is_active', 'is_verified', 'two_factor_enabled',
            'date_joined', 'last_login', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'is_verified', 'date_joined', 'last_login',
            'created_at', 'updated_at'
        ]
    
    def get_permissions(self, obj):
        permissions = obj.get_permissions()
        return PermissionSerializer(permissions, many=True).data


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear usuarios"""
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm', 'first_name',
            'last_name', 'phone', 'role', 'is_active'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Las contraseñas no coinciden."
            })
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar usuarios"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone', 'role', 'is_active'
        ]


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para cambiar contraseña"""
    
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                "new_password": "Las contraseñas no coinciden."
            })
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("La contraseña actual es incorrecta.")
        return value


class LoginSerializer(serializers.Serializer):
    """Serializer para login"""
    
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    otp_token = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True
    )
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        otp_token = attrs.get('otp_token')
        
        # Autenticar usuario
        user = authenticate(email=email, password=password)
        
        if not user:
            raise serializers.ValidationError(
                "Credenciales inválidas. Por favor, verifica tu email y contraseña."
            )
        
        if not user.is_active:
            raise serializers.ValidationError(
                "Esta cuenta está desactivada. Contacta al administrador."
            )
        
        # Verificar 2FA si está habilitado
        if user.two_factor_enabled:
            if not otp_token:
                raise serializers.ValidationError({
                    "otp_token": "Se requiere código de verificación 2FA.",
                    "requires_2fa": True
                })
            
            # Verificar el token OTP
            devices = TOTPDevice.objects.filter(user=user, confirmed=True)
            if not devices.exists():
                raise serializers.ValidationError("Dispositivo 2FA no configurado correctamente.")
            
            device = devices.first()
            if not device.verify_token(otp_token):
                raise serializers.ValidationError({
                    "otp_token": "Código de verificación inválido."
                })
        
        attrs['user'] = user
        return attrs


class Enable2FASerializer(serializers.Serializer):
    """Serializer para habilitar 2FA"""
    
    def create(self, validated_data):
        user = self.context['request'].user
        
        # Crear o obtener dispositivo TOTP
        device, created = TOTPDevice.objects.get_or_create(
            user=user,
            name='default',
            confirmed=False
        )
        
        # Generar secret key si es nuevo
        if created or not device.key:
            device.key = pyotp.random_base32()
            device.save()
        
        # Generar URL para QR
        totp_uri = f"otpauth://totp/LAQQ:{user.email}?secret={device.key}&issuer=LAQQ"
        
        # Generar QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return {
            'secret_key': device.key,
            'qr_code': f"data:image/png;base64,{qr_code_base64}",
            'provisioning_uri': totp_uri
        }
    
    def to_representation(self, instance):
        return instance


class Verify2FASerializer(serializers.Serializer):
    """Serializer para verificar y confirmar 2FA"""
    
    otp_token = serializers.CharField(required=True, max_length=6)
    
    def validate_otp_token(self, value):
        user = self.context['request'].user
        
        device = TOTPDevice.objects.filter(
            user=user,
            name='default'
        ).first()
        
        if not device:
            raise serializers.ValidationError("No se encontró configuración 2FA.")
        
        if not device.verify_token(value):
            raise serializers.ValidationError("Código de verificación inválido.")
        
        return value
    
    def save(self):
        user = self.context['request'].user
        device = TOTPDevice.objects.get(user=user, name='default')
        
        # Confirmar dispositivo y habilitar 2FA
        device.confirmed = True
        device.save()
        
        user.two_factor_enabled = True
        user.save()
        
        return user


class Disable2FASerializer(serializers.Serializer):
    """Serializer para deshabilitar 2FA"""
    
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Contraseña incorrecta.")
        return value
    
    def save(self):
        user = self.context['request'].user
        
        # Deshabilitar 2FA y eliminar dispositivos
        user.two_factor_enabled = False
        user.save()
        
        TOTPDevice.objects.filter(user=user).delete()
        
        return user