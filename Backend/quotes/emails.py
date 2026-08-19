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


def _quote_item_email_rows(quote):
    """Filas listas para el mail interno: producto, variante, specs y cantidad."""
    items = (
        quote.quoteitem_set
        .select_related('product', 'product__brand', 'product__category', 'variant')
        .prefetch_related('product__technical_specs', 'variant__technical_specs')
        .all()
    )
    rows = []
    for item in items:
        product = item.product
        specs = []
        if item.variant_id:
            specs = list(item.variant.technical_specs.all())
        if not specs and product:
            specs = list(product.technical_specs.all())

        variant_label = ''
        if item.variant:
            variant_label = item.variant.code or ''
            if item.variant.name:
                variant_label = (
                    f"{variant_label} — {item.variant.name}"
                    if variant_label
                    else item.variant.name
                )

        rows.append({
            'item': item,
            'name': product.name if product else '',
            'code': getattr(product, 'product_code', None) or '',
            'brand': product.brand.name if product and product.brand else '',
            'category': product.category.name if product and product.category else '',
            'variant': variant_label,
            'specs': specs,
            'quantity': item.quantity,
            'unit_price': item.unit_price,
            'subtotal': item.subtotal,
        })
    return rows

# Control email output during tests
SHOW_EMAIL_OUTPUT = os.environ.get('SHOW_EMAIL_OUTPUT', 'false').lower() == 'true'

LOGO_CID = 'laqqlogo'


def _resolve_logo_path():
    """Return the logo file path to embed, or '' if none is available."""
    path = getattr(settings, 'BUSINESS_LOGO_PATH', '')
    candidates = [path]
    if path:
        base, _ = os.path.splitext(path)
        candidates.extend([base + '.svg', base + '.png'])
    return next((c for c in candidates if c and os.path.exists(c)), '')


def get_logo_url():
    """Return the value to use in the template's <img src>.

    - If BUSINESS_LOGO_URL is configured, return that absolute URL (hosted).
    - Otherwise embed the logo as an inline CID attachment (``cid:laqqlogo``),
      which renders in Gmail/Outlook. Note: base64 ``data:`` URIs are blocked
      by those clients, so CID is used instead of data URIs.
    """
    configured = getattr(settings, 'BUSINESS_LOGO_URL', '')
    if configured:
        return configured
    base = getattr(settings, 'FRONTEND_BASE_URL', '').rstrip('/')
    if base:
        return f'{base}/laqq_marca_color_neg.png'
    return ''


def attach_logo_inline(email):
    """Attach the logo image inline (CID) so it renders in Gmail/Outlook.

    Email clients (and Gmail's image proxy) block base64 ``data:`` URIs, so inline
    CID attachments are the reliable way to embed a self-contained logo.

    No-op when BUSINESS_LOGO_URL is used or when no raster logo file is found.
    """
    # Gmail/Outlook only render images from public absolute URLs, never CID
    # inline attachments. The logo is now referenced by a hosted URL in the
    # template, so there is nothing to attach here. Kept as a no-op for stability.
    return False
    if not path.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.gif')):
        logger.warning(
            'El logo debe ser PNG/JPG para embeberlo inline; se omitió: %s', path
        )
        return False
    try:
        with open(path, 'rb') as f:
            data = f.read()
    except Exception as exc:  # pragma: no cover - best effort
        logger.warning('No se pudo leer el logo para embebir: %s', exc)
        return False
    from email.mime.image import MIMEImage
    img = MIMEImage(data)
    img.add_header('Content-ID', f'<{LOGO_CID}>')
    img.add_header('Content-Disposition', 'inline', filename='logo.png')
    email.attach(img)
    return True



def safe_print(text):
    """Print text with proper encoding handling for different consoles."""
    if not SHOW_EMAIL_OUTPUT:
        return

    try:
        print(text)
    except UnicodeEncodeError:
        # Fallback for Windows console that can't handle UTF-8
        sys.stdout.buffer.write((text + '\n').encode('utf-8', errors='replace'))


def _sender_from_user(user):
    """Nombre, apellido y email del usuario que editó/envió la cotización."""
    if not user:
        return None
    full_name = f"{getattr(user, 'first_name', '') or ''} {getattr(user, 'last_name', '') or ''}".strip()
    email = getattr(user, 'email', '') or ''
    if not full_name and not email:
        full_name = getattr(user, 'username', '') or ''
    if not full_name and not email:
        return None
    return {
        'name': full_name,
        'email': email,
        'display': f"{full_name} ({email})" if full_name and email else (full_name or email),
    }


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
        item_rows = _quote_item_email_rows(quote)
        items = [row['item'] for row in item_rows]

        context = {
            'quote': quote,
            'quote_number': quote.quote_number,
            'contact': quote.contact,
            'items': items,
            'item_rows': item_rows,
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
        to_email = [settings.QUOTES_EMAIL]

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email,
        )
        email.attach_alternative(html_content, "text/html")
        attach_logo_inline(email)

        # Print email content to console for debugging (BEFORE sending)
        safe_print("\n" + "="*80)
        safe_print(f"EMAIL TO BUSINESS: {settings.QUOTES_EMAIL}")
        safe_print("="*80)
        safe_print(f"Subject: {subject}")
        safe_print(f"From: {from_email}")
        safe_print(f"To: {to_email}")
        safe_print("-"*80)
        safe_print(text_content)
        safe_print("="*80 + "\n")

        # Send email via Resend API (or locmem during tests)
        send_email_message(email)
        logger.info(f"Quote #{quote.quote_number} email sent to business: {settings.QUOTES_EMAIL}")

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
        attach_logo_inline(email)

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
        item_rows = _quote_item_email_rows(quote)
        items = [row['item'] for row in item_rows]

        context = {
            'quote': quote,
            'quote_number': quote.quote_number,
            'contact': quote.contact,
            'items': items,
            'item_rows': item_rows,
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
        to_email = [settings.QUOTES_EMAIL]

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email,
        )

        # Print email content to console for debugging (BEFORE sending)
        safe_print("\n" + "="*80)
        safe_print(f"UPDATE EMAIL TO BUSINESS: {settings.QUOTES_EMAIL}")
        safe_print("="*80)
        safe_print(f"Subject: {subject}")
        safe_print(f"From: {from_email}")
        safe_print(f"To: {to_email}")
        safe_print("-"*80)
        safe_print(text_content)
        safe_print("="*80 + "\n")

        # Send email via Resend API (or locmem during tests)
        send_email_message(email)
        logger.info(f"Quote #{quote.quote_number} update email sent to business: {settings.QUOTES_EMAIL}")

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


def send_updated_quote_to_customer(quote, pdf_file=None, sender=None):
    """
    Send updated quote with full details to customer (manual send from backoffice).
    This is called manually when the user presses the "Send" button.

    Args:
        quote: Quote instance
        pdf_file: Optional uploaded PDF (e.g. request.FILES['pdf_file']) generado
            en el front-end. Se adjunta directamente al correo en memoria, sin
            guardarlo en disco ni en la base de datos. Si es None, el correo
            se envía sin adjunto.
        sender: Usuario autenticado que edita y envía (request.user). Se muestra
            en el mail como leyenda (nombre, apellido y email).

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

        sender_info = _sender_from_user(sender) or _sender_from_user(getattr(quote, 'user', None))

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
            'sender_name': sender_info['name'] if sender_info else '',
            'sender_email': sender_info['email'] if sender_info else '',
            'sender_display': sender_info['display'] if sender_info else '',
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
        attach_logo_inline(email)

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


def send_quote_assigned_email(quote, assignee):
    """
    Aviso interno al usuario del backoffice al que se le asignó una cotización.
    """
    if not assignee or not getattr(assignee, 'email', None):
        logger.warning(
            "Quote #%s: no se envía aviso de asignación (usuario sin email)",
            quote.quote_number,
        )
        return False

    try:
        assignee_name = f"{assignee.first_name or ''} {assignee.last_name or ''}".strip() or assignee.username
        contact = quote.contact
        contact_name = ""
        if contact:
            contact_name = f"{contact.first_name or ''} {contact.last_name or ''}".strip()

        frontend_base = getattr(settings, 'FRONTEND_BASE_URL', '').rstrip('/')
        backoffice_url = f"{frontend_base}/backoffice/quotes" if frontend_base else ''

        context = {
            'quote': quote,
            'quote_number': quote.quote_number,
            'assignee_name': assignee_name,
            'contact': contact,
            'contact_name': contact_name or '—',
            'company_name': (contact.company_name if contact else None) or '—',
            'contact_email': (contact.email if contact else None) or '—',
            'business_name': settings.BUSINESS_NAME,
            'logo_url': get_logo_url(),
            'backoffice_url': backoffice_url,
            'created_at': quote.created_at,
        }

        html_content = render_to_string('emails/quote_assigned.html', context)
        text_content = render_to_string('emails/quote_assigned.txt', context)

        subject = f'Te asignaron la cotización #{quote.quote_number}'
        from_email = f'{settings.DEFAULT_FROM_NAME} <{settings.DEFAULT_FROM_EMAIL}>'

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[assignee.email],
        )
        email.attach_alternative(html_content, "text/html")
        attach_logo_inline(email)

        safe_print("\n" + "=" * 80)
        safe_print(f"QUOTE ASSIGNED EMAIL TO USER: {assignee.email}")
        safe_print("=" * 80)
        safe_print(text_content)
        safe_print("=" * 80 + "\n")

        send_email_message(email)
        logger.info(
            "Quote #%s assignment notice sent to %s",
            quote.quote_number,
            assignee.email,
        )
        return True
    except Exception as e:
        logger.error(
            "Failed to send assignment email for quote #%s: %s",
            quote.quote_number,
            e,
        )
        return False

