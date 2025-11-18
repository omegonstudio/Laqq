from rest_framework.permissions import BasePermission, SAFE_METHODS

class CanCreateOrAdmin(BasePermission):
    """
    Permite crear si es admin o backoffice; editar/eliminar solo admin.
    """
    def has_permission(self, request, view):
        user = request.user
        if user.is_superuser:
            return True
        if request.method in ['POST']:
            return user.user_type_id in ['admin', 'back']
        if request.method in SAFE_METHODS:
            return True
        return user.user_type_id == 'admin'