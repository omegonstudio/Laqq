"""
Email notifications for ticket management.
Sends professional HTML emails to business and customers when tickets are created.
"""
import logging
import sys
import os
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
from config.resend_mail import send_email_message

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


def send_ticket_created_email(ticket, username, password):
    """
    Send email notifications when a new ticket is created.
    Sends to both business and customer (with credentials).

    Args:
        ticket: ServiceTicket instance that was just created
        username: Generated username for the client
        password: Generated password for the client

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
        results['business'] = send_ticket_to_business(ticket)
    except Exception as e:
        error_msg = f"Error sending email to business: {str(e)}"
        logger.error(error_msg)
        results['errors'].append(error_msg)

    try:
        # Send to customer with credentials
        results['customer'] = send_ticket_to_customer(ticket, username, password)
    except Exception as e:
        error_msg = f"Error sending email to customer: {str(e)}"
        logger.error(error_msg)
        results['errors'].append(error_msg)

    return results


def send_ticket_to_business(ticket):
    """
    Send ticket information to business email.

    Args:
        ticket: ServiceTicket instance

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        context = {
            'ticket': ticket,
            'ticket_number': ticket.ticket_number,
            'contact': ticket.contact,
            'product_name': ticket.product_name,
            'description': ticket.description,
            'priority': ticket.priority,
            'state': ticket.state,
            'business_name': settings.BUSINESS_NAME,
            'created_at': ticket.created_at,
        }

        # Render HTML and text versions
        html_content = render_to_string('emails/ticket_business.html', context)
        text_content = render_to_string('emails/ticket_business.txt', context)

        # Create email
        customer_display_name = ticket.contact.company_name or f"{ticket.contact.first_name} {ticket.contact.last_name}".strip() or "Cliente"
        subject = f'Nuevo Ticket de Servicio #{ticket.ticket_number} de {customer_display_name}'
        from_email = f'{settings.DEFAULT_FROM_NAME} <{settings.DEFAULT_FROM_EMAIL}>'
        to_email = [settings.BUSINESS_EMAIL]

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email,
        )
        email.attach_alternative(html_content, "text/html")

        # Print email content to console for debugging
        safe_print("\n" + "="*80)
        safe_print(f"EMAIL TO BUSINESS: {settings.BUSINESS_EMAIL}")
        safe_print("="*80)
        safe_print(f"Subject: {subject}")
        safe_print(f"From: {from_email}")
        safe_print(f"To: {to_email}")
        safe_print("-"*80)
        safe_print(text_content)
        safe_print("="*80 + "\n")

        # Send email
        email.send(send_email_message(email))
        logger.info(f"Ticket #{ticket.ticket_number} email sent to business: {settings.BUSINESS_EMAIL}")

        return True

    except Exception as e:
        logger.error(f"Failed to send ticket email to business: {str(e)}")
        raise


def send_ticket_to_customer(ticket, username, password):
    """
    Send ticket confirmation email to customer with access credentials.

    Args:
        ticket: ServiceTicket instance
        username: Username for the client portal
        password: Password for the client portal

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Check if contact has email
        if not ticket.contact.email:
            logger.warning(f"Ticket #{ticket.ticket_number}: Contact has no email address")
            return False

        # Build customer full name
        customer_name = f"{ticket.contact.first_name} {ticket.contact.last_name}".strip() or "Cliente"

        # Build portal URL (adjust as needed)
        portal_url = getattr(settings, 'CLIENT_PORTAL_URL', 'http://localhost:8000/client-portal')

        context = {
            'ticket': ticket,
            'ticket_number': ticket.ticket_number,
            'contact': ticket.contact,
            'customer_name': customer_name,
            'product_name': ticket.product_name,
            'description': ticket.description,
            'priority': ticket.priority,
            'state': ticket.state,
            'business_name': settings.BUSINESS_NAME,
            'business_email': settings.BUSINESS_EMAIL,
            'business_phone': settings.BUSINESS_PHONE,
            'business_address': settings.BUSINESS_ADDRESS,
            'created_at': ticket.created_at,
            'username': username,
            'password': password,
            'portal_url': portal_url,
        }

        # Render HTML and text versions
        html_content = render_to_string('emails/ticket_customer.html', context)
        text_content = render_to_string('emails/ticket_customer.txt', context)

        # Create email
        subject = f'Ticket de Servicio #{ticket.ticket_number} - Acceso al Portal'
        from_email = f'{settings.DEFAULT_FROM_NAME} <{settings.DEFAULT_FROM_EMAIL}>'
        to_email = [ticket.contact.email]

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email,
        )
        email.attach_alternative(html_content, "text/html")

        # Print email content to console for debugging
        safe_print("\n" + "="*80)
        safe_print(f"EMAIL TO CUSTOMER: {ticket.contact.email}")
        safe_print("="*80)
        safe_print(f"Subject: {subject}")
        safe_print(f"From: {from_email}")
        safe_print(f"To: {to_email}")
        safe_print("-"*80)
        safe_print(text_content)
        safe_print("="*80 + "\n")

        # Send email
        email.send(send_email_message(email))
        logger.info(f"Ticket #{ticket.ticket_number} confirmation with credentials sent to customer: {ticket.contact.email}")

        return True

    except Exception as e:
        logger.error(f"Failed to send confirmation email to customer: {str(e)}")
        raise
