from django.core.management.base import BaseCommand
from users.models import Role, Permission, RolePermission


class Command(BaseCommand):
    help = 'Inicializa roles y permisos del sistema LAQQ'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Iniciando creación de roles y permisos...'))
        
        # Crear roles
        roles_data = [
            {
                'name': Role.ADMINISTRADOR,
                'description': 'Administrador con acceso total al sistema'
            },
            {
                'name': Role.BACKOFFICE,
                'description': 'BackOffice que solo puede enviar presupuestos, sin permisos para modificar productos'
            }
        ]
        
        roles = {}
        for role_data in roles_data:
            role, created = Role.objects.get_or_create(
                name=role_data['name'],
                defaults={'description': role_data['description']}
            )
            roles[role.name] = role
            action = 'Creado' if created else 'Ya existe'
            self.stdout.write(f"  {action}: Rol {role.get_name_display()}")
        
        # Crear permisos para cada módulo
        modules = [
            (Permission.MODULE_USERS, 'Gestión de Usuarios'),
            (Permission.MODULE_PRODUCTS, 'Gestión de Productos'),
            (Permission.MODULE_ORDERS, 'Administración de Pedidos'),
            (Permission.MODULE_CLIENTS, 'CRUD de Clientes'),
        ]
        
        actions = [
            (Permission.ACTION_CREATE, 'Crear'),
            (Permission.ACTION_READ, 'Leer'),
            (Permission.ACTION_UPDATE, 'Actualizar'),
            (Permission.ACTION_DELETE, 'Eliminar'),
        ]
        
        permissions = {}
        for module, module_desc in modules:
            for action, action_desc in actions:
                codename = f"{module}_{action}"
                description = f"{action_desc} en {module_desc}"
                
                permission, created = Permission.objects.get_or_create(
                    codename=codename,
                    defaults={
                        'module': module,
                        'action': action,
                        'description': description
                    }
                )
                permissions[codename] = permission
                action_text = 'Creado' if created else 'Ya existe'
                self.stdout.write(f"  {action_text}: Permiso {codename}")
        
        # Asignar permisos a roles
        self.stdout.write(self.style.SUCCESS('\nAsignando permisos a roles...'))

        # ADMINISTRADOR: Todos los permisos
        admin_role = roles[Role.ADMINISTRADOR]
        for permission in permissions.values():
            _, created = RolePermission.objects.get_or_create(
                role=admin_role,
                permission=permission
            )
            if created:
                self.stdout.write(f"  Administrador: {permission.codename}")

        # BACKOFFICE: Solo puede enviar presupuestos (crear pedidos), no puede modificar productos
        backoffice_role = roles[Role.BACKOFFICE]
        backoffice_permissions = [
            # Productos: SOLO lectura (no puede crear, actualizar ni eliminar)
            'products_read',
            # Pedidos: crear y leer (enviar presupuestos)
            'orders_create', 'orders_read',
            # Clientes: leer (para poder ver clientes al crear pedidos)
            'clients_read',
        ]

        for perm_code in backoffice_permissions:
            if perm_code in permissions:
                _, created = RolePermission.objects.get_or_create(
                    role=backoffice_role,
                    permission=permissions[perm_code]
                )
                if created:
                    self.stdout.write(f"  BackOffice: {perm_code}")
        
        self.stdout.write(self.style.SUCCESS('\n[OK] Roles y permisos inicializados correctamente'))
        
        # Mostrar resumen
        self.stdout.write(self.style.SUCCESS('\nResumen:'))
        self.stdout.write(f"  Roles creados: {Role.objects.count()}")
        self.stdout.write(f"  Permisos creados: {Permission.objects.count()}")
        self.stdout.write(f"  Asignaciones: {RolePermission.objects.count()}")