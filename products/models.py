from django.db import models
from attachments.models import Attachment
import uuid

class Brand(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    logo_attachment = models.ForeignKey(Attachment, on_delete=models.SET_NULL, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Category(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    name = models.CharField(max_length=100)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Product(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    name = models.CharField(max_length=255)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    description = models.TextField(blank=True, null=True)
    image_attachment = models.ForeignKey(Attachment, on_delete=models.SET_NULL, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class ProductSpec(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    code = models.CharField(max_length=120)
    volume = models.CharField(max_length=100, blank=True, null=True)
    dimensions = models.CharField(max_length=100, blank=True, null=True)
    cap = models.CharField(max_length=100, blank=True, null=True)
    outlet = models.CharField(max_length=100, blank=True, null=True)
    accuracy = models.CharField(max_length=100, blank=True, null=True)
    precision = models.CharField(max_length=100, blank=True, null=True)
    additional_specs = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)