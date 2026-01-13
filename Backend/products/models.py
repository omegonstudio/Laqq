import uuid
from django.db import models
from django.utils.text import slugify
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
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, related_name='children')
    description = models.TextField(blank=True, null=True)
    level = models.IntegerField(
        default=0,
        help_text='Nivel de jerarquía (0 = categoría raíz, 1 = subcategoría, etc.)'
    )
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Product(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    product_code = models.CharField(max_length=64, unique=True, blank=True, default='')
    name = models.CharField(max_length=255)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    description = models.TextField(blank=True, null=True)
    image_attachment = models.ForeignKey(Attachment, on_delete=models.SET_NULL, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(
        default=False,
        help_text='Marcar como producto destacado para mostrar en sección especial'
    )
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

    def _generate_product_code(self):
        base = slugify(self.name)[:48] or str(uuid.uuid4())[:12]
        candidate = base
        # add suffix until unique
        while Product.objects.filter(product_code=candidate).exists():
            candidate = f"{base}-{uuid.uuid4().hex[:6]}"
        return candidate

    def save(self, *args, **kwargs):
        # ensure product_code exists
        if not getattr(self, 'product_code', None):
            self.product_code = self._generate_product_code()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.product_code})"

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
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='fixed_specs')
    code = models.CharField(max_length=120)
    volume = models.CharField(max_length=100, blank=True, null=True)
    dimensions = models.CharField(max_length=100, blank=True, null=True)
    cap = models.CharField(max_length=100, blank=True, null=True)
    outlet = models.CharField(max_length=100, blank=True, null=True)
    accuracy = models.CharField(max_length=100, blank=True, null=True)
    precision = models.CharField(max_length=100, blank=True, null=True)
    additional_specs = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Evita duplicados por producto+code a nivel DB
        constraints = [
            models.UniqueConstraint(fields=['product', 'code'], name='unique_product_spec_per_product_code')
        ]

    def __str__(self):
        return f"{self.product} - {self.code}"


class ProductSpecification(models.Model):
    """
    Especificaciones dinámicas para productos.
    Permite agregar especificaciones clave-valor flexibles sin modificar el esquema.
    """
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='dynamic_specifications',
        help_text='Producto al que pertenece esta especificación'
    )
    key = models.CharField(
        max_length=100,
        help_text='Nombre de la especificación (ej: Voltaje, Material, Temperatura)'
    )
    value = models.TextField(
        help_text='Valor de la especificación (ej: 220V, Acero inoxidable)'
    )
    unit = models.CharField(
        max_length=20,
        blank=True,
        default='',
        help_text='Unidad de medida opcional (ej: V, °C, ml, kg)'
    )
    display_order = models.IntegerField(
        default=0,
        help_text='Orden de visualización (menor número = primero)'
    )
    is_visible = models.BooleanField(
        default=True,
        help_text='Mostrar esta especificación en el frontend'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Especificación Dinámica'
        verbose_name_plural = 'Especificaciones Dinámicas'
        ordering = ['display_order', 'key']
        indexes = [
            models.Index(fields=['product', 'display_order']),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.key}: {self.value}"