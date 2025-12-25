from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()


class EmailBackend(ModelBackend):
    """
    Backend de autenticación personalizado que permite login con email en lugar de username.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Autentica al usuario usando su email y contraseña.

        Args:
            request: HttpRequest object
            username: En este caso, el email del usuario
            password: La contraseña del usuario
            **kwargs: Argumentos adicionales

        Returns:
            User object si la autenticación es exitosa, None en caso contrario
        """
        # El parámetro username en realidad contiene el email
        email = username or kwargs.get('email')

        if email is None or password is None:
            return None

        try:
            # Buscar usuario por email (case-insensitive)
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Ejecutar el hasher de contraseñas para evitar timing attacks
            User().set_password(password)
            return None
        except User.MultipleObjectsReturned:
            # Si hay múltiples usuarios con el mismo email, retornar None
            return None

        # Verificar que la contraseña sea correcta
        if user.check_password(password) and self.user_can_authenticate(user):
            return user

        return None

    def get_user(self, user_id):
        """
        Obtiene un usuario por su ID.

        Args:
            user_id: El ID del usuario

        Returns:
            User object si existe, None en caso contrario
        """
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

        return user if self.user_can_authenticate(user) else None
