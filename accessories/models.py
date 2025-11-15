from django.db import models
from products.models import Product
import uuid

class Accessory(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    code = models.CharField(max_length=120, unique=True)
    brand = models.CharField(max_length=100, blank=True, null=True)
    model = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class ProductAccessory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    accessory = models.ForeignKey(Accessory, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('product', 'accessory')