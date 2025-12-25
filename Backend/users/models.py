import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class UserType(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    permissions = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class UserState(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    """
    Custom user model using UUID primary key.
    Inherit AbstractUser to keep Django's auth fields (username, email, password, is_staff, is_superuser, etc.)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # first_name, last_name, username, email, password, last_login are already on AbstractUser
    user_type = models.ForeignKey(UserType, on_delete=models.PROTECT, null=True, blank=True)
    state = models.ForeignKey(UserState, on_delete=models.PROTECT, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # keep the defaults for username field; require email on creates (optional)
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return f"{self.username} ({self.id})"

    class Meta:
        db_table = 'users'
        verbose_name = 'user'
        verbose_name_plural = 'users'