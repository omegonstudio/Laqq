"""
Email notifications for quote management.
Sends professional HTML emails to business and customers when quotes are created.
"""
import logging
import sys
import os
import base64
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
from config.resend_mail import send_email_message

logger = logging.getLogger(__name__)

# Control email output during tests
SHOW_EMAIL_OUTPUT = os.environ.get('SHOW_EMAIL_OUTPUT', 'false').lower() == 'true'

def get_logo_url():
    """Return an absolute logo URL or a base64 data URI for embedding in emails.

    If settings.BUSINESS_LOGO_URL is set, it is returned as-is (absolute URL).
    Otherwise the file at settings.BUSINESS_LOGO_PATH is read and embedded as a
    base64 data URI so the email is self-contained and works without external hosts.
    """
    configured = getattr(settings, 'BUSINESS_LOGO_URL', '')
    if configured:
        return configured

    path = getattr(settings, 'BUSINESS_LOGO_PATH', '')
    # Fall back to the SVG sibling if the preferred PNG is not present yet.
    candidates = [path]
    if path:
        base, _ = os.path.splitext(path)
        candidates.extend([base + '.svg', base + '.png'])
    path = next((c for c in candidates if c and os.path.exists(c)), '')
    if not path:
        return ''

    ext = os.path.splitext(path)[1].lower()
    mime = {
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
    }.get(ext, 'application/octet-stream')

    try:
        with open(path, 'rb') as f:
            encoded = base64.b64encode(f.read()).decode('ascii')
        return f'data:{mime};base64,{encoded}'
    except Exception as exc:  # pragma: no cover - best effort
        logger.warning('No se pudo embebir el logo del email: %s', exc)
        return ''



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
            'logo_url': get_logo_url(),
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

        # Send email via Resend API (or locmem during tests)
        send_email_message(email)
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
            'logo_url': get_logo_url(),
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

        # Send email via Resend API (or locmem during tests)
        send_email_message(email)
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

        # Send email via Resend API (or locmem during tests)
        send_email_message(email)
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

        # Send email via Resend API (or locmem during tests)
        send_email_message(email)
        logger.info(f"Quote #{quote.quote_number} update notification sent to customer: {quote.contact.email}")

        return True

    except Exception as e:
        logger.error(f"Failed to send update email to customer: {str(e)}")
        raise


def send_updated_quote_to_customer(quote, pdf_file=None):
    """
    Send updated quote with full details to customer (manual send from backoffice).
    This is called manually when the user presses the "Send" button.

    Args:
        quote: Quote instance
        pdf_file: Optional uploaded PDF (e.g. request.FILES['pdf_file']) generado
            en el front-end. Se adjunta directamente al correo en memoria, sin
            guardarlo en disco ni en la base de datos. Si es None, el correo
            se envía sin adjunto.

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
            'logo_url': get_logo_url(),
            'business_email': settings.BUSINESS_EMAIL,
            'business_phone': settings.BUSINESS_PHONE,
            'business_address': settings.BUSINESS_ADDRESS,
            'created_at': quote.created_at,
            'updated_at': quote.updated_at,
            'message': quote.message,
            'observaciones': quote.observaciones,
        }

        # Render HTML and text versions
        html_content = render_to_string('emails/quote_updated_customer.html', context)
        text_content = render_to_string('emails/quote_updated_customer.txt', context)

        # Create email
        subject = f'Cotización Actualizada #{quote.quote_number} - {settings.BUSINESS_NAME}'
        from_email = f'{settings.DEFAULT_FROM_NAME} <{settings.DEFAULT_FROM_EMAIL}>'
        to_email = [quote.contact.email]

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email,
        )
        email.attach_alternative(html_content, "text/html")

        # Adjuntar el PDF recibido del front-end directamente en memoria
        # (sin persistirlo en disco ni en la base de datos)
        if pdf_file is not None:
            pdf_file.seek(0)
            email.attach(pdf_file.name, pdf_file.read(), 'application/pdf')
            logger.info(f"Quote #{quote.quote_number}: attaching PDF '{pdf_file.name}' to customer email")
        else:
            logger.info(f"Quote #{quote.quote_number}: no PDF provided, sending email without attachment")

        # Print email content to console for debugging (BEFORE sending)
        safe_print("\n" + "="*80)
        safe_print(f"UPDATED QUOTE EMAIL TO CUSTOMER: {quote.contact.email}")
        safe_print("="*80)
        safe_print(f"Subject: {subject}")
        safe_print(f"From: {from_email}")
        safe_print(f"To: {to_email}")
        safe_print("-"*80)
        safe_print(text_content)
        safe_print("="*80 + "\n")

        # Send email via Resend API (or locmem during tests)
        send_email_message(email)
        logger.info(f"Updated quote #{quote.quote_number} sent to customer: {quote.contact.email}")

        return True

    except Exception as e:
        logger.error(f"Failed to send updated quote email to customer: {str(e)}")
        raise
