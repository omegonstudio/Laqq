from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role, Permission, RolePermission


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Administración de usuarios en el panel admin"""
    
    list_display = [
        'email', 'full_name', 'role', 'is_active',
        'two_factor_enabled', 'date_joined'
    ]
    list_filter = ['is_active', 'is_staff', 'role', 'two_factor_enabled', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Información Personal', {'fields': ('first_name', 'last_name', 'phone')}),
        ('Permisos y Rol', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser')}),
        ('Seguridad', {'fields': ('two_factor_enabled', 'is_verified')}),
        ('Fechas Importantes', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'password1', 'password2', 'first_name',
                'last_name', 'role', 'is_active'
            ),
        }),
    )
    
    readonly_fields = ['date_joined', 'last_login']


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    """Administración de roles"""
    
    list_display = ['name', 'get_name_display', 'is_active', 'users_count', 'created_at']
    list_filter = ['name', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    def users_count(self, obj):
        return obj.users.count()
    users_count.short_description = 'Usuarios'


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    """Administración de permisos"""
    
    list_display = [
        'codename', 'get_module_display', 'get_action_display',
        'is_active', 'created_at'
    ]
    list_filter = ['module', 'action', 'is_active', 'created_at']
    search_fields = ['codename', 'description']
    readonly_fields = ['codename', 'created_at']
    
    def get_readonly_fields(self, request, obj=None):
        # Codename solo lectura en edición
        if obj:
            return self.readonly_fields + ['module', 'action']
        return self.readonly_fields


class RolePermissionInline(admin.TabularInline):
    """Inline para permisos en Role admin"""
    model = RolePermission
    extra = 1
    autocomplete_fields = ['permission']


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    """Administración de relaciones Role-Permission"""
    
    list_display = ['role', 'permission', 'granted_at', 'granted_by']
    list_filter = ['role', 'granted_at']
    search_fields = ['role__name', 'permission__codename']
    autocomplete_fields = ['role', 'permission', 'granted_by']
    readonly_fields = ['granted_at']