import uuid
from django.db import models
from attachments.models import Attachment

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
    # Many-to-many self relation via ProductRelation
    related_products = models.ManyToManyField(
        'self',
        through='ProductRelation',
        symmetrical=False,
        related_name='related_to_products',
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class ProductRelation(models.Model):
    """
    Tabla intermedia que conecta un producto con otro como 'relacionado'.
    Es dirigida: from_product -> to_product. Puedes agregar campos (relation_type, order).
    """
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    from_product = models.ForeignKey(Product, related_name='from_relations', on_delete=models.CASCADE)
    to_product = models.ForeignKey(Product, related_name='to_relations', on_delete=models.CASCADE)
    relation_type = models.CharField(max_length=50, blank=True, null=True)  # opcional
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('from_product', 'to_product')
        indexes = [
            models.Index(fields=['from_product']),
            models.Index(fields=['to_product']),
        ]

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