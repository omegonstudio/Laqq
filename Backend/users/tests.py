from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from users.models import UserType, UserState

User = get_user_model()


class AuthenticationAPITestCase(APITestCase):
    """
    Tests para el sistema de autenticación JWT con tipos de usuario Admin y Backoffice
    """

    def setUp(self):
        """
        Configuración inicial para los tests de autenticación
        """
        # Crear tipos de usuario
        self.user_type_admin = UserType.objects.create(
            id='admin',
            name='Administrador',
            description='Usuario con permisos de administración completos',
            permissions={'all': True}
        )

        self.user_type_backoffice = UserType.objects.create(
            id='backoffice',
            name='Backoffice',
            description='Usuario de backoffice con permisos limitados',
            permissions={'tickets': True, 'products': True, 'quotes': True}
        )

        # Crear estados de usuario
        self.user_state_active = UserState.objects.create(
            id='active',
            name='Activo',
            description='Usuario activo en el sistema'
        )

        self.user_state_inactive = UserState.objects.create(
            id='inactive',
            name='Inactivo',
            description='Usuario inactivo temporalmente'
        )

        # Crear usuario Admin
        self.admin_user = User.objects.create_user(
            username='admin_user',
            email='admin@laqq.com',
            password='AdminPass123!',
            first_name='Admin',
            last_name='User',
            user_type=self.user_type_admin,
            state=self.user_state_active,
            is_active=True
        )

        # Crear usuario Backoffice
        self.backoffice_user = User.objects.create_user(
            username='backoffice_user',
            email='backoffice@laqq.com',
            password='BackofficePass123!',
            first_name='Backoffice',
            last_name='User',
            user_type=self.user_type_backoffice,
            state=self.user_state_active,
            is_active=True
        )

        # Crear usuario inactivo
        self.inactive_user = User.objects.create_user(
            username='inactive_user',
            email='inactive@laqq.com',
            password='InactivePass123!',
            first_name='Inactive',
            last_name='User',
            user_type=self.user_type_backoffice,
            state=self.user_state_inactive,
            is_active=False
        )


    def test_login_admin_user_success(self):
        """
        Test 1: Login exitoso con usuario Admin
        Verifica que un usuario Admin puede autenticarse y recibir tokens JWT
        """
        response = self.client.post('/users/token/', {
            'username': 'admin_user',
            'password': 'AdminPass123!'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

        # Verificar que los tokens son strings no vacíos
        self.assertTrue(isinstance(response.data['access'], str))
        self.assertTrue(len(response.data['access']) > 0)
        self.assertTrue(isinstance(response.data['refresh'], str))
        self.assertTrue(len(response.data['refresh']) > 0)


    def test_login_backoffice_user_success(self):
        """
        Test 2: Login exitoso con usuario Backoffice
        Verifica que un usuario Backoffice puede autenticarse y recibir tokens JWT
        """
        response = self.client.post('/users/token/', {
            'username': 'backoffice_user',
            'password': 'BackofficePass123!'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

        # Verificar que los tokens son strings no vacíos
        self.assertTrue(isinstance(response.data['access'], str))
        self.assertTrue(len(response.data['access']) > 0)
        self.assertTrue(isinstance(response.data['refresh'], str))
        self.assertTrue(len(response.data['refresh']) > 0)


    def test_login_with_wrong_password(self):
        """
        Test 3: Login fallido con contraseña incorrecta
        Verifica que se rechaza el login con contraseña incorrecta
        """
        response = self.client.post('/users/token/', {
            'username': 'admin_user',
            'password': 'WrongPassword123!'
        })

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn('access', response.data)
        self.assertNotIn('refresh', response.data)


    def test_login_with_inactive_user(self):
        """
        Test 5: Login fallido con usuario inactivo
        Verifica que no se puede hacer login con un usuario marcado como inactivo
        """
        response = self.client.post('/users/token/', {
            'username': 'inactive_user',
            'password': 'InactivePass123!'
        })

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn('access', response.data)
        self.assertNotIn('refresh', response.data)


    def test_refresh_token_success(self):
        """
        Test 6: Refresh token exitoso
        Verifica que se puede obtener un nuevo access token usando el refresh token
        """
        # Primero hacer login para obtener tokens
        login_response = self.client.post('/users/token/', {
            'username': 'admin_user',
            'password': 'AdminPass123!'
        })

        refresh_token = login_response.data['refresh']

        # Usar el refresh token para obtener un nuevo access token
        refresh_response = self.client.post('/users/token/refresh/', {
            'refresh': refresh_token
        })

        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_response.data)

        # Verificar que el nuevo access token es diferente al original
        self.assertNotEqual(login_response.data['access'], refresh_response.data['access'])


    def test_access_protected_endpoint_with_valid_token(self):
        """
        Test 8: Acceso a endpoint protegido con token válido
        Verifica que se puede acceder a endpoints protegidos con un token JWT válido
        """
        # Hacer login para obtener token
        login_response = self.client.post('/users/token/', {
            'username': 'admin_user',
            'password': 'AdminPass123!'
        })

        access_token = login_response.data['access']

        # Acceder a un endpoint protegido con el token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get('/users/list/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_access_protected_endpoint_without_token(self):
        """
        Test 9: Acceso denegado a endpoint protegido sin token
        Verifica que se rechaza el acceso a endpoints protegidos sin autenticación
        """
        response = self.client.get('/users/list/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


    def test_login_with_email_instead_of_username(self):
        """
        Test 11: Login exitoso usando email en lugar de username
        Verifica que el EmailBackend permite autenticación con email
        """
        response = self.client.post('/users/token/', {
            'username': 'admin@laqq.com',  # Usando email gracias al EmailBackend
            'password': 'AdminPass123!'
        })

        # Debería tener éxito porque EmailBackend permite login con email
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)


class UserTypeAPITestCase(APITestCase):
    """
    Tests para el endpoint de tipos de usuario
    """

    def setUp(self):
        """
        Configuración inicial
        """
        # Crear estado activo
        self.user_state_active = UserState.objects.create(
            id='active',
            name='Activo'
        )

        # Crear tipo de usuario admin
        self.user_type_admin = UserType.objects.create(
            id='admin',
            name='Administrador'
        )

        # Crear usuario autenticado
        self.user = User.objects.create_user(
            username='test_user',
            email='test@laqq.com',
            password='TestPass123!',
            user_type=self.user_type_admin,
            state=self.user_state_active
        )

        # Crear tipo backoffice para testing
        self.user_type_backoffice = UserType.objects.create(
            id='backoffice',
            name='Backoffice',
            description='Usuario de backoffice'
        )


class UserStateAPITestCase(APITestCase):
    """
    Tests para el endpoint de estados de usuario
    """

    def setUp(self):
        """
        Configuración inicial
        """
        # Crear estados
        self.user_state_active = UserState.objects.create(
            id='active',
            name='Activo'
        )

        self.user_state_inactive = UserState.objects.create(
            id='inactive',
            name='Inactivo'
        )

        # Crear tipo de usuario
        self.user_type_admin = UserType.objects.create(
            id='admin',
            name='Administrador'
        )

        # Crear usuario autenticado
        self.user = User.objects.create_user(
            username='test_user',
            email='test@laqq.com',
            password='TestPass123!',
            user_type=self.user_type_admin,
            state=self.user_state_active
        )


