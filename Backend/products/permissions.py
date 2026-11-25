from rest_framework.permissions import BasePermission

class IsAdminUserType(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return user.user_type_id in ['admin', 'back', 'back_full']

class IsReadOnlyOrAdmin(BasePermission):
    def has_permission(self, request, view):
        # Lectura: todos pueden ver (público)
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        # Modificación: admin y back office full
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return user.user_type_id in ['admin', 'back_full']