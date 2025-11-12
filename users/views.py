from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import User, Role, Permission, RolePermission
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    RoleSerializer, PermissionSerializer, RolePermissionSerializer,
    ChangePasswordSerializer, LoginSerializer, Enable2FASerializer,
    Verify2FASerializer, Disable2FASerializer
)
from .permissions import (
    CanManageUsers, CanManageRoles, IsSelfOrAdmin, HasModulePermission
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Vista personalizada para login con JWT"""
    
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            # Si requiere 2FA, devolver error específico
            if hasattr(e, 'detail') and isinstance(e.detail, dict):
                if e.detail.get('requires_2fa'):
                    return Response({
                        'error': 'Se requiere autenticación de dos factores',
                        'requires_2fa': True,
                        'detail': str(e.detail.get('otp_token', [''])[0])
                    }, status=status.HTTP_403_FORBIDDEN)
            
            return Response({
                'error': 'Credenciales inválidas',
                'detail': str(e)
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        user = serializer.validated_data['user']
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        # Serializar datos del usuario
        user_data = UserSerializer(user).data
        
        return Response({
            'user': user_data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de usuarios"""
    
    queryset = User.objects.all().select_related('role')
    permission_classes = [IsAuthenticated, CanManageUsers]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_active', 'two_factor_enabled']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'email', 'first_name']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_permissions(self):
        """
        Usuarios pueden ver su propio perfil sin permisos especiales
        """
        if self.action == 'me':
            return [IsAuthenticated()]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Obtener información del usuario autenticado"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put'])
    def update_profile(self, request):
        """Actualizar perfil del usuario autenticado"""
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(
            UserSerializer(request.user).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Cambiar contraseña del usuario autenticado"""
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        # Cambiar contraseña
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'message': 'Contraseña cambiada exitosamente'
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], permission_classes=[CanManageUsers])
    def reset_password(self, request, pk=None):
        """Resetear contraseña de un usuario (Solo Admin/Manager)"""
        user = self.get_object()
        new_password = request.data.get('new_password')
        
        if not new_password:
            return Response({
                'error': 'Se requiere nueva contraseña'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': f'Contraseña reseteada para {user.email}'
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], permission_classes=[CanManageUsers])
    def toggle_active(self, request, pk=None):
        """Activar/Desactivar usuario"""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        
        status_text = 'activado' if user.is_active else 'desactivado'
        return Response({
            'message': f'Usuario {status_text} exitosamente',
            'is_active': user.is_active
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def enable_2fa(self, request):
        """Iniciar proceso de habilitación de 2FA"""
        serializer = Enable2FASerializer(
            data={},
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        
        return Response(result, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def verify_2fa(self, request):
        """Verificar y confirmar 2FA"""
        serializer = Verify2FASerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Autenticación de dos factores habilitada exitosamente'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def disable_2fa(self, request):
        """Deshabilitar 2FA"""
        serializer = Disable2FASerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Autenticación de dos factores deshabilitada'
        }, status=status.HTTP_200_OK)


class RoleViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de roles"""
    
    queryset = Role.objects.all().prefetch_related('role_permissions__permission')
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, CanManageRoles]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['name', 'is_active']
    search_fields = ['name', 'description']
    
    @action(detail=True, methods=['post'])
    def assign_permission(self, request, pk=None):
        """Asignar un permiso a un rol"""
        role = self.get_object()
        permission_id = request.data.get('permission_id')
        
        if not permission_id:
            return Response({
                'error': 'Se requiere permission_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            permission = Permission.objects.get(id=permission_id)
        except Permission.DoesNotExist:
            return Response({
                'error': 'Permiso no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Crear o actualizar relación
        role_permission, created = RolePermission.objects.get_or_create(
            role=role,
            permission=permission,
            defaults={'granted_by': request.user}
        )
        
        action_text = 'asignado' if created else 'ya estaba asignado'
        return Response({
            'message': f'Permiso {action_text} exitosamente',
            'created': created
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def remove_permission(self, request, pk=None):
        """Remover un permiso de un rol"""
        role = self.get_object()
        permission_id = request.data.get('permission_id')
        
        if not permission_id:
            return Response({
                'error': 'Se requiere permission_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        deleted_count = RolePermission.objects.filter(
            role=role,
            permission_id=permission_id
        ).delete()[0]
        
        if deleted_count == 0:
            return Response({
                'error': 'El permiso no estaba asignado a este rol'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'message': 'Permiso removido exitosamente'
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def assign_multiple_permissions(self, request, pk=None):
        """Asignar múltiples permisos a un rol"""
        role = self.get_object()
        permission_ids = request.data.get('permission_ids', [])
        
        if not permission_ids or not isinstance(permission_ids, list):
            return Response({
                'error': 'Se requiere una lista de permission_ids'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        created_count = 0
        for permission_id in permission_ids:
            try:
                permission = Permission.objects.get(id=permission_id)
                _, created = RolePermission.objects.get_or_create(
                    role=role,
                    permission=permission,
                    defaults={'granted_by': request.user}
                )
                if created:
                    created_count += 1
            except Permission.DoesNotExist:
                continue
        
        return Response({
            'message': f'{created_count} permisos asignados exitosamente',
            'assigned_count': created_count
        }, status=status.HTTP_200_OK)


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet de solo lectura para permisos"""
    
    queryset = Permission.objects.filter(is_active=True)
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, CanManageRoles]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['module', 'action']
    search_fields = ['codename', 'description']
    
    @action(detail=False, methods=['get'])
    def by_module(self, request):
        """Obtener permisos agrupados por módulo"""
        permissions = self.get_queryset()
        
        grouped = {}
        for permission in permissions:
            module = permission.get_module_display()
            if module not in grouped:
                grouped[module] = []
            grouped[module].append(PermissionSerializer(permission).data)
        
        return Response(grouped)


class RolePermissionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de relaciones Role-Permission"""
    
    queryset = RolePermission.objects.all().select_related('role', 'permission', 'granted_by')
    serializer_class = RolePermissionSerializer
    permission_classes = [IsAuthenticated, CanManageRoles]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['role', 'permission']