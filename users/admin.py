from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django import forms
from .models import User, UserType, UserState

# Minimal forms using the default behavior (sufficient in many cases).
# If you need custom user creation behavior, extend these forms.
class UserCreationForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ('username', 'email')

class UserChangeForm(forms.ModelForm):
    class Meta:
        model = User
        fields = '__all__'

@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    form = UserChangeForm
    add_form = UserCreationForm

    # show UUID primary key in list display
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'user_type', 'state')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'user_type', 'state')

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Custom', {'fields': ('user_type', 'state')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )

    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('username',)
    filter_horizontal = ('groups', 'user_permissions',)

admin.site.register(UserType)
admin.site.register(UserState)