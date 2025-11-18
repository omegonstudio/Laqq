from rest_framework.permissions import BasePermission

class IsAdminUserType(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if user.is_superuser:
            return True
        return user.user_type_id == 'admin'

class IsReadOnlyOrAdmin(BasePermission):
    def has_permission(self, request, view):
        # Lectura: todos pueden ver
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        # Modificación: solo admin
        user = request.user
        if user.is_superuser:
            return True
        return user.user_type_id == 'admin'