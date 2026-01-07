"""
Management command para poblar datos iniciales de usuarios
Uso: python manage.py populate_user_data
"""
from django.core.management.base import BaseCommand
from users.models import UserType, UserState


class Command(BaseCommand):
    help = 'Poblar tipos y estados iniciales para usuarios'

    def handle(self, *args, **options):
        self.stdout.write('Creando tipos de usuarios...')

        user_types = [
            {
                'id': 'admin',
                'name': 'Administrador',
                'description': 'Usuario con acceso completo al sistema',
                'permissions': {
                    'products': ['create', 'read', 'update', 'delete'],
                    'quotes': ['create', 'read', 'update', 'delete'],
                    'tickets': ['create', 'read', 'update', 'delete', 'assign'],
                    'contacts': ['create', 'read', 'update', 'delete'],
                    'users': ['create', 'read', 'update', 'delete'],
                    'reports': ['read'],
                }
            },
            {
                'id': 'back',
                'name': 'Back Office',
                'description': 'Usuario de backoffice con permisos de gestión',
                'permissions': {
                    'products': ['read'],
                    'quotes': ['create', 'read', 'update'],
                    'tickets': ['create', 'read', 'update', 'assign'],
                    'contacts': ['create', 'read', 'update'],
                    'users': ['read'],
                    'reports': ['read'],
                }
            },
            {
                'id': 'client',
                'name': 'Cliente',
                'description': 'Cliente con acceso limitado para ver sus tickets',
                'permissions': {
                    'tickets': ['read_own', 'attach_files'],
                }
            },
        ]

        for user_type_data in user_types:
            user_type, created = UserType.objects.get_or_create(
                id=user_type_data['id'],
                defaults=user_type_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'+ Tipo de usuario creado: {user_type.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'- Tipo de usuario ya existe: {user_type.name}')
                )

        self.stdout.write('\nCreando estados de usuarios...')

        user_states = [
            {
                'id': 'active',
                'name': 'Activo',
                'description': 'Usuario activo con acceso al sistema'
            },
            {
                'id': 'inactive',
                'name': 'Inactivo',
                'description': 'Usuario inactivo sin acceso al sistema'
            },
            {
                'id': 'suspended',
                'name': 'Suspendido',
                'description': 'Usuario temporalmente suspendido'
            },
        ]

        for user_state_data in user_states:
            user_state, created = UserState.objects.get_or_create(
                id=user_state_data['id'],
                defaults=user_state_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'+ Estado de usuario creado: {user_state.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'- Estado de usuario ya existe: {user_state.name}')
                )

        self.stdout.write(
            self.style.SUCCESS('\n+ Datos iniciales de usuarios cargados exitosamente')
        )
