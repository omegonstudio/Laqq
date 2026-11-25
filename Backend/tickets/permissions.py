from rest_framework.permissions import BasePermission, SAFE_METHODS

# Ven todos los tickets del backoffice.
TICKET_VIEW_ALL = {'admin', 'back', 'back_full', 'servicio_tecnico'}
# Crean, editan, workflow (assign/start/resolve/close), notas internas, export.
TICKET_MANAGE = {'admin', 'servicio_tecnico'}
# reopen + classify
TICKET_ADMIN_ACTIONS = {'admin'}


def _is_ticket_staff(user, allowed):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    return user.user_type_id in allowed


def user_can_view_ticket_priority(user):
    """
    Prioridad/urgencia retirada de la UI operativa de ST.
    Se conserva en DB por histórico; la API ya no la expone ni acepta cambios
    en el flujo normal. Helper retenido por compatibilidad de imports/tests.
    """
    return False


def user_can_access_internal_notes(user):
    """Lectura/escritura de internal_notes: admin, servicio_tecnico, superuser."""
    return _is_ticket_staff(user, TICKET_MANAGE)


def user_can_export_tickets(user):
    """Export Excel: admin, servicio_tecnico, superuser."""
    return _is_ticket_staff(user, TICKET_MANAGE)


def user_can_reopen_or_classify(user):
    return _is_ticket_staff(user, TICKET_ADMIN_ACTIONS)


class CanCreateTicketOrStaff(BasePermission):
    """
    POST: Público (crear tickets desde la web)
    GET: autenticados según tipo
    PUT/PATCH/DELETE: admin o servicio_tecnico
    """
    def has_permission(self, request, view):
        if request.method == 'POST':
            return True

        if request.method in ['OPTIONS', 'HEAD']:
            return True

        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        if request.method in SAFE_METHODS:
            return user.user_type_id in [
                'admin', 'back', 'back_full', 'client', 'servicio_tecnico'
            ]

        return user.user_type_id in TICKET_MANAGE


class IsAdminOnly(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return user.user_type_id == 'admin'


class CanRunTicketWorkflow(BasePermission):
    """assign / start / resolve / close: admin y servicio técnico."""
    def has_permission(self, request, view):
        return _is_ticket_staff(request.user, TICKET_MANAGE)


class CanReopenOrClassifyTicket(BasePermission):
    """reopen / classify: solo admin y superuser."""
    def has_permission(self, request, view):
        return user_can_reopen_or_classify(request.user)


class CanExportTickets(BasePermission):
    def has_permission(self, request, view):
        return user_can_export_tickets(request.user)


class IsAdminOrBackOffice(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return user.user_type_id in ['admin', 'back', 'back_full']


class IsClientOwnerOrStaff(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False

        if user.is_superuser or user.user_type_id in TICKET_VIEW_ALL:
            return True

        if user.user_type_id == 'client':
            return request.method in SAFE_METHODS

        return False

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.is_superuser or user.user_type_id in TICKET_VIEW_ALL:
            return True

        if user.user_type_id == 'client':
            return obj.contact.email == user.email

        return False


class CanAttachFiles(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False

        if user.is_superuser or user.user_type_id in [
            'admin', 'back', 'back_full', 'client', 'servicio_tecnico'
        ]:
            return True

        return False

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.is_superuser or user.user_type_id in TICKET_VIEW_ALL:
            return True

        if user.user_type_id == 'client':
            return obj.contact.email == user.email

        return False
