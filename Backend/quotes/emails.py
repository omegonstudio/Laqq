"""
Email notifications for quote management.
Sends professional HTML emails to business and customers when quotes are created.
"""
import logging
import sys
import os
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

# Control email output during tests
SHOW_EMAIL_OUTPUT = os.environ.get('SHOW_EMAIL_OUTPUT', 'false').lower() == 'true'


def safe_print(text):
    """Print text with proper encoding handling for different consoles."""
    if not SHOW_EMAIL_OUTPUT:
        return

    try:
        print(text)
    except UnicodeEncodeError:
        # Fallback for Windows console that can't handle UTF-8
        sys.stdout.buffer.write((text + '\n').encode('utf-8', errors='replace'))


def send_quote_created_email(quote):
    """
    Send email notifications when a new quote is created.
    Sends to both business and customer.

    Args:
        quote: Quote instance that was just created

    Returns:
        dict: Status of email sending {'business': bool, 'customer': bool}
    """
    results = {
        'business': False,
        'customer': False,
        'errors': []
    }

    try:
        # Send to business
        results['business'] = send_quote_to_business(quote)
    except Exception as e:
        error_msg = f"Error sending email to business: {str(e)}"
        logger.error(error_msg)
        results['errors'].append(error_msg)

    try:
        # Send to customer
        results['customer'] = send_quote_to_customer(quote)
    except Exception as e:
        error_msg = f"Error sending email to customer: {str(e)}"
        logger.error(error_msg)
        results['errors'].append(error_msg)

    return results


def send_quote_to_business(quote):
    """
    Send detailed quote information to business email.

    Args:
        quote: Quote instance

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Prepare context for template
        items = quote.quoteitem_set.select_related('product', 'product__brand', 'product__category').all()

        context = {
            'quote': quote,
            'quote_number': quote.quote_number,
            'contact': quote.contact,
            'items': items,
            'total_amount': quote.total_amount or sum(item.subtotal or 0 for item in items),
            'business_name': settings.BUSINESS_NAME,
            'created_at': quote.created_at,
            'user': quote.user,
            'message': quote.message,
        }

        # Render HTML and text versions
        html_content = render_to_string('emails/quote_business.html', context)
        text_content = render_to_string('emails/quote_business.txt', context)

        # Create email
        customer_display_name = quote.contact.company_name or f"{quote.contact.first_name} {quote.contact.last_name}".strip() or "Cliente"
        subject = f'Nueva Cotización #{quote.quote_number} de {customer_display_name}'
        from_email = f'{settings.DEFAULT_FROM_NAME} <{settings.DEFAULT_FROM_EMAIL}>'
        to_email = [settings.BUSINESS_EMAIL]

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email,
        )
        email.attach_alternative(html_content, "text/html")

        # Print email content to console for debugging (BEFORE sending)
        safe_print("\n" + "="*80)
        safe_print(f"EMAIL TO BUSINESS: {settings.BUSINESS_EMAIL}")
        safe_print("="*80)
        safe_print(f"Subject: {subject}")
        safe_print(f"From: {from_email}")
        safe_print(f"To: {to_email}")
        safe_print("-"*80)
        safe_print(text_content)
        safe_print("="*80 + "\n")

        # Send email (may fail if SMTP not configured, but quote will still be created)
        email.send(fail_silently=False)
        logger.info(f"Quote #{quote.quote_number} email sent to business: {settings.BUSINESS_EMAIL}")

        return True

    except Exception as e:
        logger.error(f"Failed to send quote email to business: {str(e)}")
        raise


def send_quote_to_customer(quote):
    """
    Send quote confirmation email to customer.

    Args:
        quote: Quote instance

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Check if contact has email
        if not quote.contact.email:
            logger.warning(f"Quote #{quote.quote_number}: Contact has no email address")
            return False

        # Prepare context for template
        items = quote.quoteitem_set.select_related('product').all()

        # Build customer full name
        customer_name = f"{quote.contact.first_name} {quote.contact.last_name}".strip() or "Cliente"

        context = {
            'quote': quote,
            'quote_number': quote.quote_number,
            'contact': quote.contact,
            'customer_name': customer_name,
            'items': items,
            'total_items': items.count(),
            'business_name': settings.BUSINESS_NAME,
            'business_email': settings.BUSINESS_EMAIL,
            'business_phone': settings.BUSINESS_PHONE,
            'business_address': settings.BUSINESS_ADDRESS,
            'response_time': settings.QUOTE_RESPONSE_TIME,
            'created_at': quote.created_at,
            'message': quote.message,
        }

        # Render HTML and text versions
        html_content = render_to_string('emails/quote_customer.html', context)
        text_content = render_to_string('emails/quote_customer.txt', context)

        # Create email
        subject = f'Confirmación de Solicitud de Cotización #{quote.quote_number}'
        from_email = f'{settings.DEFAULT_FROM_NAME} <{settings.DEFAULT_FROM_EMAIL}>'
        to_email = [quote.contact.email]

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email,
        )
        email.attach_alternative(html_content, "text/html")

        # Print email content to console for debugging (BEFORE sending)
        safe_print("\n" + "="*80)
        safe_print(f"EMAIL TO CUSTOMER: {quote.contact.email}")
        safe_print("="*80)
        safe_print(f"Subject: {subject}")
        safe_print(f"From: {from_email}")
        safe_print(f"To: {to_email}")
        safe_print("-"*80)
        safe_print(text_content)
        safe_print("="*80 + "\n")

        # Send email (may fail if SMTP not configured, but quote will still be created)
        email.send(fail_silently=False)
        logger.info(f"Quote #{quote.quote_number} confirmation sent to customer: {quote.contact.email}")

        return True

    except Exception as e:
        logger.error(f"Failed to send confirmation email to customer: {str(e)}")
        raise


def send_quote_updated_email(quote):
    """
    Send email notifications when a quote is updated.
    Sends to both business and customer.

    Args:
        quote: Quote instance that was just updated

    Returns:
        dict: Status of email sending {'business': bool, 'customer': bool}
    """
    results = {
        'business': False,
        'customer': False,
        'errors': []
    }

    try:
        # Send to business
        results['business'] = send_quote_updated_to_business(quote)
    except Exception as e:
        error_msg = f"Error sending update email to business: {str(e)}"
        logger.error(error_msg)
        results['errors'].append(error_msg)

    try:
        # Send to customer
        results['customer'] = send_quote_updated_to_customer(quote)
    except Exception as e:
        error_msg = f"Error sending update email to customer: {str(e)}"
        logger.error(error_msg)
        results['errors'].append(error_msg)

    return results


def send_quote_updated_to_business(quote):
    """
    Send updated quote information to business email.

    Args:
        quote: Quote instance

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Prepare context for template
        items = quote.quoteitem_set.select_related('product', 'product__brand', 'product__category').all()

        context = {
            'quote': quote,
            'quote_number': quote.quote_number,
            'contact': quote.contact,
            'items': items,
            'total_amount': quote.total_amount or sum(item.subtotal or 0 for item in items),
            'business_name': settings.BUSINESS_NAME,
            'created_at': quote.created_at,
            'updated_at': quote.updated_at,
            'user': quote.user,
            'message': quote.message,
        }

        # Render text version (no HTML template for updates yet)
        text_content = render_to_string('emails/quote_updated_business.txt', context)

        # Create email
        customer_display_name = quote.contact.company_name or f"{quote.contact.first_name} {quote.contact.last_name}".strip() or "Cliente"
        subject = f'Cotización #{quote.quote_number} Actualizada - {customer_display_name}'
        from_email = f'{settings.DEFAULT_FROM_NAME} <{settings.DEFAULT_FROM_EMAIL}>'
        to_email = [settings.BUSINESS_EMAIL]

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email,
        )

        # Print email content to console for debugging (BEFORE sending)
        safe_print("\n" + "="*80)
        safe_print(f"UPDATE EMAIL TO BUSINESS: {settings.BUSINESS_EMAIL}")
        safe_print("="*80)
        safe_print(f"Subject: {subject}")
        safe_print(f"From: {from_email}")
        safe_print(f"To: {to_email}")
        safe_print("-"*80)
        safe_print(text_content)
        safe_print("="*80 + "\n")

        # Send email
        email.send(fail_silently=False)
        logger.info(f"Quote #{quote.quote_number} update email sent to business: {settings.BUSINESS_EMAIL}")

        return True

    except Exception as e:
        logger.error(f"Failed to send update email to business: {str(e)}")
        raise


def send_quote_updated_to_customer(quote):
    """
    Send quote update notification email to customer.

    Args:
        quote: Quote instance

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Check if contact has email
        if not quote.contact.email:
            logger.warning(f"Quote #{quote.quote_number}: Contact has no email address")
            return False

        # Prepare context for template
        items = quote.quoteitem_set.select_related('product').all()

        # Build customer full name
        customer_name = f"{quote.contact.first_name} {quote.contact.last_name}".strip() or "Cliente"

        context = {
            'quote': quote,
            'quote_number': quote.quote_number,
            'contact': quote.contact,
            'customer_name': customer_name,
            'items': items,
            'total_items': items.count(),
            'total_amount': quote.total_amount or sum(item.subtotal or 0 for item in items),
            'business_name': settings.BUSINESS_NAME,
            'business_email': settings.BUSINESS_EMAIL,
            'business_phone': settings.BUSINESS_PHONE,
            'business_address': settings.BUSINESS_ADDRESS,
            'created_at': quote.created_at,
            'updated_at': quote.updated_at,
            'message': quote.message,
        }

        # Render text version (no HTML template for updates yet)
        text_content = render_to_string('emails/quote_updated_customer.txt', context)

        # Create email
        subject = f'Actualización de Cotización #{quote.quote_number}'
        from_email = f'{settings.DEFAULT_FROM_NAME} <{settings.DEFAULT_FROM_EMAIL}>'
        to_email = [quote.contact.email]

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email,
        )

        # Print email content to console for debugging (BEFORE sending)
        safe_print("\n" + "="*80)
        safe_print(f"UPDATE EMAIL TO CUSTOMER: {quote.contact.email}")
        safe_print("="*80)
        safe_print(f"Subject: {subject}")
        safe_print(f"From: {from_email}")
        safe_print(f"To: {to_email}")
        safe_print("-"*80)
        safe_print(text_content)
        safe_print("="*80 + "\n")

        # Send email
        email.send(fail_silently=False)
        logger.info(f"Quote #{quote.quote_number} update notification sent to customer: {quote.contact.email}")

        return True

    except Exception as e:
        logger.error(f"Failed to send update email to customer: {str(e)}")
        raise
