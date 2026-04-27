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
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    quote_number = models.CharField(max_length=100, unique=True, blank=True)
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, blank=True, null=True, on_delete=models.SET_NULL)
    quote_type = models.ForeignKey(QuoteType, on_delete=models.PROTECT, default='standard')
    state = models.ForeignKey(QuoteState, on_delete=models.PROTECT, default='pending')
    message = models.TextField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
    created_at = models.DateTimeField(auto_now_add=True)