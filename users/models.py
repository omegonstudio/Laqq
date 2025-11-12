from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
import uuid


class UserManager(BaseUserManager):
    """Manager personalizado para el modelo User"""
    
    def create_user(self, email, password=None, **extra_fields):
        """Crea y guarda un usuario regular"""
        if not email:
            raise ValueError('El email es obligatorio')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Crea y guarda un superusuario"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('El superusuario debe tener is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El superusuario debe tener is_superuser=True')
        
        return self.create_user(email, password, **extra_fields)


class Role(models.Model):
    """Modelo de Roles del sistema"""
    
    ADMINISTRADOR = 'administrador'
    BACKOFFICE = 'backoffice'

    ROLE_CHOICES = [
        (ADMINISTRADOR, 'Administrador'),
        (BACKOFFICE, 'BackOffice'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(
        max_length=50, 
        choices=ROLE_CHOICES, 
        unique=True,
        verbose_name='Nombre del Rol'
    )
    description = models.TextField(blank=True, verbose_name='Descripción')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha de Actualización')
    
    class Meta:
        db_table = 'roles'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
        ordering = ['name']
    
    def __str__(self):
        return self.get_name_display()


class Permission(models.Model):
    """Modelo de Permisos del sistema"""
    
    # Módulos del sistema
    MODULE_USERS = 'users'
    MODULE_PRODUCTS = 'products'
    MODULE_ORDERS = 'orders'
    MODULE_CLIENTS = 'clients'
    
    MODULE_CHOICES = [
        (MODULE_USERS, 'Gestión de Usuarios'),
        (MODULE_PRODUCTS, 'Gestión de Productos'),
        (MODULE_ORDERS, 'Administración de Pedidos'),
        (MODULE_CLIENTS, 'CRUD de Clientes'),
    ]
    
    # Acciones CRUD
    ACTION_CREATE = 'create'
    ACTION_READ = 'read'
    ACTION_UPDATE = 'update'
    ACTION_DELETE = 'delete'
    
    ACTION_CHOICES = [
        (ACTION_CREATE, 'Crear'),
        (ACTION_READ, 'Leer'),
        (ACTION_UPDATE, 'Actualizar'),
        (ACTION_DELETE, 'Eliminar'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.CharField(
        max_length=50, 
        choices=MODULE_CHOICES,
        verbose_name='Módulo'
    )
    action = models.CharField(
        max_length=20, 
        choices=ACTION_CHOICES,
        verbose_name='Acción'
    )
    codename = models.CharField(
        max_length=100, 
        unique=True,
        verbose_name='Código',
        help_text='Formato: module_action (ej: users_create)'
    )
    description = models.TextField(blank=True, verbose_name='Descripción')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    
    class Meta:
        db_table = 'permissions'
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'
        unique_together = ['module', 'action']
        ordering = ['module', 'action']
    
    def save(self, *args, **kwargs):
        # Generar codename automáticamente si no existe
        if not self.codename:
            self.codename = f"{self.module}_{self.action}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.get_module_display()} - {self.get_action_display()}"


class RolePermission(models.Model):
    """Relación entre Roles y Permisos"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.ForeignKey(
        Role, 
        on_delete=models.CASCADE, 
        related_name='role_permissions',
        verbose_name='Rol'
    )
    permission = models.ForeignKey(
        Permission, 
        on_delete=models.CASCADE, 
        related_name='role_permissions',
        verbose_name='Permiso'
    )
    granted_at = models.DateTimeField(auto_now_add=True, verbose_name='Otorgado el')
    granted_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='permissions_granted',
        verbose_name='Otorgado por'
    )
    
    class Meta:
        db_table = 'role_permissions'
        verbose_name = 'Permiso de Rol'
        verbose_name_plural = 'Permisos de Roles'
        unique_together = ['role', 'permission']
    
    def __str__(self):
        return f"{self.role.name} - {self.permission.codename}"


class User(AbstractBaseUser, PermissionsMixin):
    """Modelo de Usuario personalizado"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, verbose_name='Email')
    first_name = models.CharField(max_length=150, verbose_name='Nombre')
    last_name = models.CharField(max_length=150, verbose_name='Apellido')
    phone = models.CharField(max_length=20, blank=True, verbose_name='Teléfono')
    
    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        related_name='users',
        null=True,
        blank=True,
        verbose_name='Rol'
    )
    
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    is_staff = models.BooleanField(default=False, verbose_name='Es Staff')
    is_verified = models.BooleanField(default=False, verbose_name='Email Verificado')
    two_factor_enabled = models.BooleanField(default=False, verbose_name='2FA Habilitado')

    date_joined = models.DateTimeField(default=timezone.now, verbose_name='Fecha de Registro')
    last_login = models.DateTimeField(null=True, blank=True, verbose_name='Último Login')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha de Actualización')

    # Override groups and user_permissions to avoid clashes with auth.User
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='Grupos',
        blank=True,
        help_text='Los grupos a los que pertenece este usuario.',
        related_name='custom_user_set',
        related_query_name='custom_user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='Permisos de usuario',
        blank=True,
        help_text='Permisos específicos para este usuario.',
        related_name='custom_user_set',
        related_query_name='custom_user',
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.email
    
    @property
    def full_name(self):
        """Retorna el nombre completo del usuario"""
        return f"{self.first_name} {self.last_name}".strip()
    
    def has_permission(self, module, action):
        """Verifica si el usuario tiene un permiso específico"""
        if self.is_superuser:
            return True
        
        if not self.role:
            return False
        
        return RolePermission.objects.filter(
            role=self.role,
            permission__module=module,
            permission__action=action,
            permission__is_active=True,
            role__is_active=True
        ).exists()
    
    def get_permissions(self):
        """Retorna todos los permisos del usuario"""
        if self.is_superuser:
            return Permission.objects.filter(is_active=True)
        
        if not self.role:
            return Permission.objects.none()
        
        return Permission.objects.filter(
            role_permissions__role=self.role,
            is_active=True,
            role_permissions__role__is_active=True
        ).distinct()