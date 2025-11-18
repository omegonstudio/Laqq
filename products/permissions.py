from rest_framework.permissions import BasePermission

class IsAdminUserType(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        # Allow superuser or staff as fallback for testing
        if user.is_superuser or user.is_staff:
            return True
        return hasattr(user, 'user_type') and user.user_type_id == 'admin'

class IsReadOnlyOrAdmin(BasePermission):
    def has_permission(self, request, view):
        # SOLO admin puede modificar, otros solo pueden leer
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        user = request.user
        # Allow superuser or staff as fallback for testing
        if user.is_superuser or user.is_staff:
            return True
        return hasattr(user, 'user_type') and user.user_type_id == 'admin'