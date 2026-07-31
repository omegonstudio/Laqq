from rest_framework.permissions import BasePermission, SAFE_METHODS


class CanCreateTicketOrStaff(BasePermission):
    """
    POST: Público (permite crear tickets sin autenticación desde la web)
    GET: Solo autenticados (admin/backoffice ven todos, clientes ven solo los suyos)
    PUT/PATCH/DELETE: Solo admin/backoffice
    """
    def has_permission(self, request, view):
        # POST público para crear tickets desde la web
        if request.method == 'POST':
            return True

        # OPTIONS/HEAD para CORS
        if request.method in ['OPTIONS', 'HEAD']:
            return True

        # Resto de operaciones: requiere autenticación
        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Admin, backoffice y clientes autenticados pueden ver
        if user.is_superuser:
            return True

        # GET: admin, backoffice o cliente
        if request.method in SAFE_METHODS:
            return user.user_type_id in ['admin', 'back', 'client']

        # PUT/PATCH/DELETE: solo admin/backoffice
        return user.user_type_id in ['admin', 'back']


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
        return user.user_type_id in ['admin', 'back']


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
        if user.is_superuser or user.user_type_id in ['admin', 'back']:
            return True

        # Clientes solo pueden leer (GET, HEAD, OPTIONS)
        if user.user_type_id == 'client':
            return request.method in SAFE_METHODS

        return False

    def has_object_permission(self, request, view, obj):
        """
        Verifica que el cliente solo pueda ver sus propios tickets
        (tickets asociados a su email)
        """
        user = request.user

        # Admin y backoffice tienen acceso completo
        if user.is_superuser or user.user_type_id in ['admin', 'back']:
            return True

        # Cliente solo puede ver tickets de su contacto (email matching)
        if user.user_type_id == 'client':
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
        if user.is_superuser or user.user_type_id in ['admin', 'back', 'client']:
            return True

        return False

    def has_object_permission(self, request, view, obj):
        """
        Verifica que el cliente solo pueda adjuntar archivos a sus propios tickets
        """
        user = request.user

        # Admin y backoffice tienen acceso completo
        if user.is_superuser or user.user_type_id in ['admin', 'back']:
            return True

        # Cliente solo puede adjuntar a tickets de su contacto
        if user.user_type_id == 'client':
            return obj.contact.email == user.email

        return False
