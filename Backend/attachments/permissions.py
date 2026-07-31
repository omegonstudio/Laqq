from rest_framework.permissions import BasePermission


class IsAdminOrAttachmentReadOnly(BasePermission):
    """
    Para AttachmentViewSet (galería general):
    - GET/HEAD/OPTIONS: público.
    - POST/PUT/PATCH/DELETE: solo admin.
    """
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return user.user_type_id == 'admin'
