import uuid
import logging
from django.db import models
from contacts.models import Contact
from products.models import Product
from django.conf import settings

logger = logging.getLogger(__name__)

class QuoteType(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100, unique=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class QuoteState(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=20, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Quote(models.Model):
    CURRENCY_ARS = 'ARS'
    CURRENCY_USD = 'USD'
    CURRENCY_EUR = 'EUR'
    CURRENCY_CHOICES = [
        (CURRENCY_ARS, 'Pesos'),
        (CURRENCY_USD, 'Dólares'),
        (CURRENCY_EUR, 'Euros'),
    ]
    CURRENCY_SYMBOLS = {
        CURRENCY_ARS: '$',
        CURRENCY_USD: 'US$',
        CURRENCY_EUR: '€',
    }

    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    quote_number = models.CharField(max_length=100, unique=True, blank=True)
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, blank=True, null=True, on_delete=models.SET_NULL)
    quote_type = models.ForeignKey(QuoteType, on_delete=models.PROTECT, default='standard')
    state = models.ForeignKey(QuoteState, on_delete=models.PROTECT, default='abierto')
    message = models.TextField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default=CURRENCY_ARS,
    )
    specs = models.JSONField(default=dict, blank=True)
    # Primera actividad de gestión (edición / assign / envío / estado).
    # Null = sigue en "Recibidas".
    managed_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def currency_symbol(self):
        return self.CURRENCY_SYMBOLS.get(self.currency, '$')

    def save(self, *args, **kwargs):
        """
        Override save to auto-generate quote_number if not provided.
        Email notifications are handled by signals (see quotes/signals.py).
        Works for both API and Django Admin.
        """
        # Auto-generate quote_number if not provided
        if self._state.adding and not self.quote_number:
            from datetime import datetime
            year = datetime.now().year
            last_quote = Quote.objects.filter(quote_number__startswith=f'Q-{year}').order_by('-created_at').first()
            if last_quote and last_quote.quote_number:
                try:
                    last_number = int(last_quote.quote_number.split('-')[-1])
                    new_number = last_number + 1
                except (ValueError, IndexError):
                    new_number = 1
            else:
                new_number = 1
            self.quote_number = f'Q-{year}-{new_number:05d}'

        # Save the quote
        super().save(*args, **kwargs)

class QuoteItem(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey('products.ProductVariant', on_delete=models.SET_NULL, blank=True, null=True, related_name='quote_items')
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    estimated_delivery = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)


class QuoteTrace(models.Model):
    """
    Historial de gestión de una cotización.

    - created: alta (pedido web); no marca "en gestión"
    - updated / assignee_changed / state_changed / sent: gestión
    """

    REASON_CREATED = 'created'
    REASON_UPDATED = 'updated'
    REASON_ASSIGNEE_CHANGED = 'assignee_changed'
    REASON_STATE_CHANGED = 'state_changed'
    REASON_SENT = 'sent'
    REASON_BACKFILL = 'backfill'

    REASON_CHOICES = [
        (REASON_CREATED, 'Creada'),
        (REASON_UPDATED, 'Editada'),
        (REASON_ASSIGNEE_CHANGED, 'Cambio de responsable'),
        (REASON_STATE_CHANGED, 'Cambio de estado'),
        (REASON_SENT, 'Enviada al cliente'),
        (REASON_BACKFILL, 'Histórico (sin detalle)'),
    ]

    # Motivos que sacan la cotización de "Recibidas"
    MANAGEMENT_REASONS = {
        REASON_UPDATED,
        REASON_ASSIGNEE_CHANGED,
        REASON_STATE_CHANGED,
        REASON_SENT,
        REASON_BACKFILL,
    }

    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='traces')
    reason = models.CharField(max_length=32, choices=REASON_CHOICES)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quote_traces',
    )
    # Snapshot liviano o completo según el motivo (ver quotes.tracing)
    snapshot = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['quote', '-created_at']),
            models.Index(fields=['reason']),
        ]

    def __str__(self):
        return f'{self.quote_id} · {self.reason} · {self.created_at}'


def quote_version_pdf_upload_to(instance, filename):
    import os
    from django.utils.text import get_valid_filename
    safe = get_valid_filename(os.path.basename(filename))
    return f'quotes/versions/{instance.quote_id}/{uuid.uuid4().hex}_{safe}'


class QuoteVersion(models.Model):
    """
    Versión inmutable de una cotización (snapshot + PDF).

    Numeración: {quote.quote_number}-{version_number}  →  Q-2026-00002-1
    La primera versión se crea en el primer save del BO (no en el alta web).
    """

    REASON_SAVED = 'saved'
    REASON_SENT = 'sent'
    REASON_STATE_CHANGED = 'state_changed'
    REASON_ASSIGNEE_CHANGED = 'assignee_changed'

    REASON_CHOICES = [
        (REASON_SAVED, 'Guardada'),
        (REASON_SENT, 'Enviada'),
        (REASON_STATE_CHANGED, 'Cambio de estado'),
        (REASON_ASSIGNEE_CHANGED, 'Cambio de responsable'),
    ]

    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='versions')
    version_number = models.PositiveIntegerField()
    # Número mostrado: Q-2026-00002-1
    version_label = models.CharField(max_length=120)
    reason = models.CharField(max_length=32, choices=REASON_CHOICES, default=REASON_SAVED)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='quote_versions',
    )
    snapshot = models.JSONField(default=dict, blank=True)
    pdf = models.FileField(upload_to=quote_version_pdf_upload_to, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-version_number']
        unique_together = [('quote', 'version_number')]
        indexes = [
            models.Index(fields=['quote', '-version_number'], name='quotes_quot_quote_i_vnum_idx'),
        ]

    def __str__(self):
        return self.version_label
