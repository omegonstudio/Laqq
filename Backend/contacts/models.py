import uuid
from django.conf import settings    
from django.db import models

class ContactState(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=20, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Contact(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    company_name = models.CharField(max_length=120)
    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True, null=True)
    country = models.CharField(max_length=80, blank=True, null=True)
    message = models.TextField(blank=True, null=True)
    state = models.ForeignKey(ContactState, on_delete=models.PROTECT)
    assigned_user = models.ForeignKey(settings.AUTH_USER_MODEL, blank=True, null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Message(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    company_name = models.CharField(max_length=120, blank=True, null=True)
    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80)
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    country = models.CharField(max_length=80, blank=True, null=True)
    message = models.TextField()
    state = models.ForeignKey(ContactState, on_delete=models.PROTECT)
    assigned_user = models.ForeignKey(settings.AUTH_USER_MODEL, blank=True, null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)