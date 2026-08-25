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

    def save(self, *args, **kwargs):
        if self.parent:
            self.level = self.parent.level + 1
        else:
            self.level = 0
        super().save(*args, **kwargs)

class Product(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    product_code = models.CharField(max_length=64, unique=True, blank=True, default='')
    name = models.CharField(max_length=255)
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    image_attachment = models.ForeignKey(Attachment, on_delete=models.SET_NULL, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(
        default=False,
        help_text='Marcar como producto destacado para mostrar en sección especial'
    )
    related_products = models.ManyToManyField(
        'self',
        through='ProductRelation',
        symmetrical=False,
        related_name='related_to_products',
        blank=True
    )
    technical_specs = models.ManyToManyField(
        'TechnicalSpec',
        through='ProductTechnicalSpec',
        related_name='products',
        blank=True
    )

    # --- Cache de categoría raíz para filtrado eficiente ---
    root_category = models.CharField(max_length=100, blank=True, default='')

    # --- Campos específicos de Consumibles (todos opcionales) ---
    articulo = models.CharField(max_length=100, blank=True, default='')
    cas = models.CharField(max_length=50, blank=True, default='')
    sedronar = models.CharField(max_length=20, blank=True, default='-')
    esp_attachment = models.ForeignKey(
        Attachment, on_delete=models.SET_NULL, blank=True, null=True,
        related_name='esp_products'
    )
    hds_attachment = models.ForeignKey(
        Attachment, on_delete=models.SET_NULL, blank=True, null=True,
        related_name='hds_products'
    )
    spec_table = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def _generate_product_code(self):
        base = slugify(self.name)[:48] or str(uuid.uuid4())[:12]
        candidate = base
        while Product.objects.filter(product_code=candidate).exists():
            candidate = f"{base}-{uuid.uuid4().hex[:6]}"
        return candidate

    def save(self, *args, **kwargs):
        if not getattr(self, 'product_code', None):
            self.product_code = self._generate_product_code()

        # Auto-asignar root_category desde la jerarquía de categorías.
        # El valor cacheado es el nombre de la raíz en lower(). Convención
        # actual del proyecto: la raíz de "Consumibles" se llama "Consumibles" en BD
        # en la base de datos, por lo tanto root_category queda como
        # "consumibles" para esos productos.
        if self.category_id:
            cat = self.category
            while cat.parent:
                cat = cat.parent
            self.root_category = cat.name.lower()
        else:
            self.root_category = ''

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.product_code})"

class ProductRelation(models.Model):
    """
    Tabla intermedia que conecta un producto con otro como 'relacionado'.
    Es dirigida: from_product -> to_product.
    """
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    from_product = models.ForeignKey(Product, related_name='from_relations', on_delete=models.CASCADE)
    to_product = models.ForeignKey(Product, related_name='to_relations', on_delete=models.CASCADE)
    relation_type = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('from_product', 'to_product')
        indexes = [
            models.Index(fields=['from_product']),
            models.Index(fields=['to_product']),
        ]

class ProductVariant(models.Model):
    """
    Variante de un producto (ej: distintos tamaños, presentaciones).
    Hereda los atributos del Product padre (brand, category, description, etc.)
    y puede tener sus propias TechnicalSpecs dinámicas.
    """
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    code = models.CharField(max_length=120)
    name = models.CharField(max_length=255, blank=True, default='')
    technical_specs = models.ManyToManyField(
        'TechnicalSpec',
        through='VariantTechnicalSpec',
        related_name='product_variants',
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['product', 'code'], name='unique_variant_per_product_code')
        ]
        ordering = ['created_at']

    def __str__(self):
        return f"{self.product} - {self.code}"


class TechnicalSpec(models.Model):
    """
    Especificación técnica dinámica (clave-valor).
    Puede asociarse a un Product via ProductTechnicalSpec
    o a un ProductVariant via VariantTechnicalSpec.
    """
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    key = models.CharField(max_length=100)
    value = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Especificación Técnica'
        verbose_name_plural = 'Especificaciones Técnicas'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.key}: {self.value}"


class ProductTechnicalSpec(models.Model):
    """Tabla intermedia: Product ↔ TechnicalSpec"""
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='product_technical_specs'
    )
    technical_spec = models.ForeignKey(
        TechnicalSpec,
        on_delete=models.CASCADE,
        related_name='product_links'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'technical_spec')


class VariantTechnicalSpec(models.Model):
    """Tabla intermedia: ProductVariant ↔ TechnicalSpec"""
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name='variant_technical_specs'
    )
    technical_spec = models.ForeignKey(
        TechnicalSpec,
        on_delete=models.CASCADE,
        related_name='variant_links'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('variant', 'technical_spec')
