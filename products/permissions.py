from rest_framework.permissions import BasePermission

class IsAdminUserType(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return hasattr(user, 'user_type') and user.user_type_id == 'admin'

class IsReadOnlyOrAdmin(BasePermission):
    def has_permission(self, request, view):
        # SOLO admin puede modificar, otros solo pueden leer
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        user = request.user
        return hasattr(user, 'user_type') and user.user_type_id == 'admin'