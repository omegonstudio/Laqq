from rest_framework.permissions import BasePermission, SAFE_METHODS

class CanCreateOrAdmin(BasePermission):
    """
    Permite crear si es admin o backoffice; editar/eliminar solo admin.
    """
    def has_permission(self, request, view):
        user = request.user
        if request.method in ['POST']:
            return getattr(user, 'user_type_id', None) in ['admin', 'back']
        if request.method in SAFE_METHODS:
            return True
        return getattr(user, 'user_type_id', None) == 'admin'