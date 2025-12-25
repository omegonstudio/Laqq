from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from .models import User, UserType, UserState
from .forms import UserCreationForm  # usamos tu formulario real
from django import forms

class UserChangeForm(forms.ModelForm):
    """
    Formulario para editar usuarios en el admin.
    Incluye el campo password como hash readonly.
    """
    password = ReadOnlyPasswordHashField()

    class Meta:
        model = User
        fields = '__all__'


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    form = UserChangeForm              # formulario para editar
    add_form = UserCreationForm        # formulario para crear (el tuyo)

    list_display = ('email', 'username', 'first_name', 'last_name', 'is_staff', 'user_type', 'state')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'user_type', 'state')

    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Custom', {'fields': ('user_type', 'state')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2'),
        }),
    )

    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('email',)
    filter_horizontal = ('groups', 'user_permissions')


admin.site.register(UserType)
admin.site.register(UserState)
