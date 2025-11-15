from django.core.management.base import BaseCommand
from users.models import Role, RolePermission


class Command(BaseCommand):
    help = 'Verifica los permisos asignados a cada rol'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('=== PERMISOS POR ROL ===\n'))

        for role in Role.objects.all():
            self.stdout.write(self.style.WARNING(f'\n{role.get_name_display()}:'))
            self.stdout.write(f'Descripción: {role.description}')

            perms = RolePermission.objects.filter(role=role).select_related('permission')

            for rp in perms:
                self.stdout.write(f'  - {rp.permission.codename}: {rp.permission.description}')

            self.stdout.write(self.style.SUCCESS(f'Total permisos: {perms.count()}'))
