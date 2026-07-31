from rest_framework.permissions import BasePermission, SAFE_METHODS

class CanCreateOrAdmin(BasePermission):
    """
    POST: Público (permite crear cotizaciones anónimas desde la web)
    GET: Solo admin/backoffice (ver todas las cotizaciones)
    PUT/PATCH/DELETE: admin o backoffice (ambos editan cotizaciones)
    """
    def has_permission(self, request, view):
        # POST público para crear cotizaciones
        if request.method == 'POST':
            return True

        # OPTIONS/HEAD para CORS
        if request.method in ['OPTIONS', 'HEAD']:
            return True

        # Resto de operaciones: requiere autenticación
        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Solo admin/backoffice para ver y gestionar
        if user.is_superuser:
            return True

        # GET: admin o backoffice
        if request.method in SAFE_METHODS:
            return user.user_type_id in ['admin', 'back']

        # PUT/PATCH/DELETE: admin o backoffice (ambos editan cotizaciones)
        return user.user_type_id in ['admin', 'back']


class AllowPublicQuoteItems(BasePermission):
    """
    POST: Público (permite agregar items a cotizaciones desde la web)
    GET: Solo admin/backoffice
    PUT/PATCH/DELETE: admin o backoffice (ambos editan items)
    """
    def has_permission(self, request, view):
        # POST público para agregar items
        if request.method == 'POST':
            return True

        # OPTIONS/HEAD para CORS
        if request.method in ['OPTIONS', 'HEAD']:
            return True

        # Resto: requiere autenticación
        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Solo admin/backoffice
        if user.is_superuser:
            return True

        if request.method in SAFE_METHODS:
            return user.user_type_id in ['admin', 'back']

        return user.user_type_id in ['admin', 'back']  # admin o backoffice editan items