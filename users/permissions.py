from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Permiso para verificar si el usuario es Admin
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role and
            request.user.role.name == 'admin'
        )


class IsManagerOrAdmin(permissions.BasePermission):
    """
    Permiso para verificar si el usuario es Manager o Admin
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role and
            request.user.role.name in ['admin', 'manager']
        )


class HasModulePermission(permissions.BasePermission):
    """
    Permiso genérico para verificar permisos por módulo y acción.
    
    Se debe definir en la vista:
    - module_name: nombre del módulo (ej: 'users', 'products')
    - permission_mapping: diccionario que mapea acciones HTTP a acciones del sistema
    
    Ejemplo de uso en ViewSet:
    ```python
    class UserViewSet(viewsets.ModelViewSet):
        permission_classes = [HasModulePermission]
        module_name = 'users'
        permission_mapping = {
            'list': 'read',
            'retrieve': 'read',
            'create': 'create',
            'update': 'update',
            'partial_update': 'update',
            'destroy': 'delete',
        }
    ```
    """
    
    def has_permission(self, request, view):
        # Superusuarios siempre tienen permiso
        if request.user.is_superuser:
            return True
        
        # Obtener el nombre del módulo desde la vista
        module_name = getattr(view, 'module_name', None)
        if not module_name:
            return False
        
        # Obtener el mapeo de permisos
        permission_mapping = getattr(view, 'permission_mapping', {})
        
        # Obtener la acción actual
        action = view.action if hasattr(view, 'action') else None
        
        # Si no hay acción, intentar mapear por método HTTP
        if not action:
            method_mapping = {
                'GET': 'read',
                'POST': 'create',
                'PUT': 'update',
                'PATCH': 'update',
                'DELETE': 'delete',
            }
            action = method_mapping.get(request.method)
        else:
            # Mapear la acción a una acción del sistema
            action = permission_mapping.get(action)
        
        if not action:
            return False
        
        # Verificar si el usuario tiene el permiso
        return request.user.has_permission(module_name, action)


class CanManageUsers(permissions.BasePermission):
    """
    Permiso específico para gestión de usuarios.
    Los operadores no pueden gestionar usuarios.
    """
    
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        
        # Verificar que tenga el permiso específico de usuarios
        action_map = {
            'GET': 'read',
            'POST': 'create',
            'PUT': 'update',
            'PATCH': 'update',
            'DELETE': 'delete',
        }
        
        action = action_map.get(request.method)
        if not action:
            return False
        
        return request.user.has_permission('users', action)
    
    def has_object_permission(self, request, view, obj):
        # Superusuarios pueden hacer todo
        if request.user.is_superuser:
            return True
        
        # Los usuarios pueden ver y editar su propio perfil
        if request.method in ['GET', 'PUT', 'PATCH'] and obj == request.user:
            return True
        
        # Para otras acciones, verificar permisos de módulo
        action_map = {
            'GET': 'read',
            'PUT': 'update',
            'PATCH': 'update',
            'DELETE': 'delete',
        }
        
        action = action_map.get(request.method)
        return request.user.has_permission('users', action)


class CanManageRoles(permissions.BasePermission):
    """
    Permiso para gestión de roles.
    Solo Admin puede gestionar roles.
    """
    
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        
        # Solo Admin puede gestionar roles
        if not (request.user.role and request.user.role.name == 'admin'):
            return False
        
        # Verificar permiso específico
        action_map = {
            'GET': 'read',
            'POST': 'create',
            'PUT': 'update',
            'PATCH': 'update',
            'DELETE': 'delete',
        }
        
        action = action_map.get(request.method)
        if not action:
            return False
        
        return request.user.has_permission('users', action)


class IsSelfOrAdmin(permissions.BasePermission):
    """
    Permiso para verificar que el usuario está accediendo a sus propios datos
    o es un administrador.
    """
    
    def has_object_permission(self, request, view, obj):
        # Superusuarios y admins pueden acceder
        if request.user.is_superuser:
            return True
        
        if request.user.role and request.user.role.name == 'admin':
            return True
        
        # El usuario puede acceder a sus propios datos
        if hasattr(obj, 'id'):
            return obj.id == request.user.id
        
        return obj == request.user