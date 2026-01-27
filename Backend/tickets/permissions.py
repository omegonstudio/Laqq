from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrBackOffice(BasePermission):
    """
    Permite acceso completo a admin y backoffice.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return user.user_type_id in ['ADMIN', 'BACKOFFICE', 'admin', 'back']


class IsClientOwnerOrStaff(BasePermission):
    """
    Permite a los clientes ver solo sus propios tickets.
    Permite a admin y backoffice ver todos los tickets.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False

        # Admin y backoffice tienen acceso completo
        if user.is_superuser or user.user_type_id in ['ADMIN', 'BACKOFFICE', 'admin', 'back']:
            return True

        # Clientes solo pueden leer (GET, HEAD, OPTIONS)
        if user.user_type_id in ['client', 'CLIENT']:
            return request.method in SAFE_METHODS

        return False

    def has_object_permission(self, request, view, obj):
        """
        Verifica que el cliente solo pueda ver sus propios tickets
        (tickets asociados a su email)
        """
        user = request.user

        # Admin y backoffice tienen acceso completo
        if user.is_superuser or user.user_type_id in ['ADMIN', 'BACKOFFICE', 'admin', 'back']:
            return True

        # Cliente solo puede ver tickets de su contacto (email matching)
        if user.user_type_id in ['client', 'CLIENT']:
            # Verificar que el email del ticket coincida con el email del usuario
            return obj.contact.email == user.email

        return False


class CanAttachFiles(BasePermission):
    """
    Permite a clientes adjuntar archivos a sus propios tickets.
    Permite a admin y backoffice adjuntar archivos a cualquier ticket.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False

        # Admin, backoffice y clientes pueden adjuntar archivos
        if user.is_superuser or user.user_type_id in ['ADMIN', 'BACKOFFICE', 'admin', 'back', 'client', 'CLIENT']:
            return True

        return False

    def has_object_permission(self, request, view, obj):
        """
        Verifica que el cliente solo pueda adjuntar archivos a sus propios tickets
        """
        user = request.user

        # Admin y backoffice tienen acceso completo
        if user.is_superuser or user.user_type_id in ['ADMIN', 'BACKOFFICE', 'admin', 'back']:
            return True

        # Cliente solo puede adjuntar a tickets de su contacto
        if user.user_type_id in ['client', 'CLIENT']:
            return obj.contact.email == user.email

        return False
