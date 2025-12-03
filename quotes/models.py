import uuid
import logging
from django.db import models
from contacts.models import Contact
from products.models import Product
from django.conf import settings

logger = logging.getLogger(__name__)

class QuoteType(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100, unique=True)
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
    quote_type = models.ForeignKey(QuoteType, on_delete=models.PROTECT)
    state = models.ForeignKey(QuoteState, on_delete=models.PROTECT)
    message = models.TextField(blank=True, null=True)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        """
        Override save to:
        1. Auto-generate quote_number if not provided
        2. Send email notifications when a new quote is created
        3. Send update email notifications when a quote is modified
        Works for both API and Django Admin.
        """
        # Check if this is a new quote (not an update)
        # Use _state.adding which is more reliable than checking pk
        is_new = self._state.adding

        # Auto-generate quote_number if not provided
        if is_new and not self.quote_number:
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

        # Save the quote first
        super().save(*args, **kwargs)

        # Send email notifications
        if is_new:
            # Import here to avoid circular imports
            from .emails import send_quote_created_email

            try:
                email_results = send_quote_created_email(self)
                if email_results['business']:
                    logger.info(f"Quote #{self.quote_number}: Business email sent successfully")
                if email_results['customer']:
                    logger.info(f"Quote #{self.quote_number}: Customer email sent successfully")
                if email_results['errors']:
                    for error in email_results['errors']:
                        logger.warning(f"Quote #{self.quote_number}: {error}")
            except Exception as e:
                # Log error but don't fail the quote creation
                logger.error(f"Quote #{self.quote_number}: Failed to send emails - {str(e)}")
        else:
            # This is an update - send update emails
            from .emails import send_quote_updated_email

            try:
                email_results = send_quote_updated_email(self)
                if email_results['business']:
                    logger.info(f"Quote #{self.quote_number}: Business update email sent successfully")
                if email_results['customer']:
                    logger.info(f"Quote #{self.quote_number}: Customer update email sent successfully")
                if email_results['errors']:
                    for error in email_results['errors']:
                        logger.warning(f"Quote #{self.quote_number}: {error}")
            except Exception as e:
                # Log error but don't fail the quote update
                logger.error(f"Quote #{self.quote_number}: Failed to send update emails - {str(e)}")

class QuoteItem(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)