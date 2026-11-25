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


def _ticket_create_context(ticket):
    """Build template context from existing ticket/contact fields only."""
    contact = ticket.contact
    return {
        'ticket': ticket,
        'ticket_number': ticket.ticket_number,
        'contact': contact,
        'customer_name': f"{contact.first_name} {contact.last_name}".strip() or "Cliente",
        'company_name': contact.company_name or '',
        'product_name': ticket.product_name or '',
        'numero_de_serie': ticket.numero_de_serie or '',
        'marca': ticket.marca or '',
        'modelo': ticket.modelo or '',
        'description': ticket.description,
        'state': ticket.state,
        'business_name': settings.BUSINESS_NAME,
        'tickets_email': settings.TICKETS_EMAIL,
        'business_phone': getattr(settings, 'BUSINESS_PHONE', None) or '',
        'business_address': getattr(settings, 'BUSINESS_ADDRESS', None) or '',
        'created_at': ticket.created_at,
    }


def send_ticket_created_email(ticket, username=None, password=None):
    """
    Send email notifications when a new ticket is created.
    Sends exactly once to TICKETS_EMAIL and once to the customer.

    username/password are accepted for backward compatibility with callers/tests
    but are not used in templates (no credentials / portal access in create emails).

    Returns:
        dict: Status of email sending {'business': bool, 'customer': bool, 'errors': list}
    """
    results = {
        'business': False,
        'customer': False,
        'errors': []
    }

    try:
        results['business'] = send_ticket_to_business(ticket)
    except Exception as e:
        error_msg = f"Error sending email to business: {str(e)}"
        logger.error(error_msg)
        results['errors'].append(error_msg)

    try:
        results['customer'] = send_ticket_to_customer(ticket)
    except Exception as e:
        error_msg = f"Error sending email to customer: {str(e)}"
        logger.error(error_msg)
        results['errors'].append(error_msg)

    return results


def send_ticket_to_business(ticket):
    """
    Send ticket information to TICKETS_EMAIL (Servicio Técnico support).

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        context = _ticket_create_context(ticket)

        html_content = render_to_string('emails/ticket_business.html', context)
        text_content = render_to_string('emails/ticket_business.txt', context)

        customer_display_name = (
            ticket.contact.company_name
            or f"{ticket.contact.first_name} {ticket.contact.last_name}".strip()
            or "Cliente"
        )
        subject = f'Nuevo Ticket de Servicio #{ticket.ticket_number} de {customer_display_name}'
        from_email = f'{settings.DEFAULT_FROM_NAME} <{settings.DEFAULT_FROM_EMAIL}>'
        to_email = [settings.TICKETS_EMAIL]

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email,
        )
        email.attach_alternative(html_content, "text/html")

        safe_print("\n" + "="*80)
        safe_print(f"EMAIL TO BUSINESS: {settings.TICKETS_EMAIL}")
        safe_print("="*80)
        safe_print(f"Subject: {subject}")
        safe_print(f"From: {from_email}")
        safe_print(f"To: {to_email}")
        safe_print("-"*80)
        safe_print(text_content)
        safe_print("="*80 + "\n")

        send_email_message(email)
        logger.info(
            f"Ticket #{ticket.ticket_number} email sent to business: {settings.TICKETS_EMAIL}"
        )

        return True

    except Exception as e:
        logger.error(f"Failed to send ticket email to business: {str(e)}")
        raise


def send_ticket_to_customer(ticket, username=None, password=None):
    """
    Send ticket reception confirmation to the customer.

    username/password kept for backward compatibility; not used in content.

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        if not ticket.contact.email:
            logger.warning(
                f"Ticket #{ticket.ticket_number}: Contact has no email address"
            )
            return False

        context = _ticket_create_context(ticket)

        html_content = render_to_string('emails/ticket_customer.html', context)
        text_content = render_to_string('emails/ticket_customer.txt', context)

        subject = (
            f'Recibimos tu solicitud de Servicio Técnico #{ticket.ticket_number}'
        )
        from_email = f'{settings.DEFAULT_FROM_NAME} <{settings.DEFAULT_FROM_EMAIL}>'
        to_email = [ticket.contact.email]

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email,
        )
        email.attach_alternative(html_content, "text/html")

        safe_print("\n" + "="*80)
        safe_print(f"EMAIL TO CUSTOMER: {ticket.contact.email}")
        safe_print("="*80)
        safe_print(f"Subject: {subject}")
        safe_print(f"From: {from_email}")
        safe_print(f"To: {to_email}")
        safe_print("-"*80)
        safe_print(text_content)
        safe_print("="*80 + "\n")

        send_email_message(email)
        logger.info(
            f"Ticket #{ticket.ticket_number} confirmation sent to customer: "
            f"{ticket.contact.email}"
        )

        return True

    except Exception as e:
        logger.error(f"Failed to send confirmation email to customer: {str(e)}")
        raise


def send_ticket_status_change_email(ticket):
    """
    Send email notification when a ticket status changes.
    Sends to customer only.

    Args:
        ticket: ServiceTicket instance

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        if not ticket.contact.email:
            logger.warning(
                f"Ticket #{ticket.ticket_number}: Contact has no email address"
            )
            return False

        customer_name = (
            f"{ticket.contact.first_name} {ticket.contact.last_name}".strip()
            or "Cliente"
        )

        context = {
            'ticket': ticket,
            'ticket_number': ticket.ticket_number,
            'contact': ticket.contact,
            'customer_name': customer_name,
            'product_name': ticket.product_name,
            'description': ticket.description,
            'resolution_notes': ticket.resolution_notes,
            'priority': ticket.priority,
            'state': ticket.state,
            'business_name': settings.BUSINESS_NAME,
            'business_email': settings.BUSINESS_EMAIL,
            'business_phone': getattr(settings, 'BUSINESS_PHONE', None),
            'updated_at': ticket.updated_at,
        }

        html_content = render_to_string('emails/ticket_status_change.html', context)
        text_content = render_to_string('emails/ticket_status_change.txt', context)

        subject = f'Actualización de Ticket #{ticket.ticket_number} - {ticket.state.name}'
        from_email = f'{settings.DEFAULT_FROM_NAME} <{settings.DEFAULT_FROM_EMAIL}>'
        to_email = [ticket.contact.email]

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email,
        )
        email.attach_alternative(html_content, "text/html")

        safe_print("\n" + "="*80)
        safe_print(f"EMAIL - TICKET STATUS CHANGE: {ticket.contact.email}")
        safe_print("="*80)
        safe_print(f"Subject: {subject}")
        safe_print(f"From: {from_email}")
        safe_print(f"To: {to_email}")
        safe_print(f"New State: {ticket.state.name}")
        safe_print("-"*80)
        safe_print(text_content[:500])
        safe_print("="*80 + "\n")

        send_email_message(email)
        logger.info(
            f"Ticket #{ticket.ticket_number} status change email sent to customer: "
            f"{ticket.contact.email} (new state: {ticket.state.name})"
        )

        return True

    except Exception as e:
        logger.error(
            f"Failed to send status change email for ticket "
            f"#{ticket.ticket_number}: {str(e)}"
        )
        return False


def send_ticket_assigned_email(ticket):
    """
    Notifica al técnico cuando se le asigna un ticket (Ticket 9C).

    Destinatario: ticket.assigned_user.email.
    No incluye prioridad (decisión 9B: dato exclusivamente interno).
    """
    try:
        assignee = ticket.assigned_user
        # Sin responsable no hay destinatario técnico (p.ej. tras unassign).
        if not assignee:
            return False

        if not assignee.email:
            # Asignación ya persistida: no fallar la operación por falta de email.
            logger.warning(
                f"Ticket #{ticket.ticket_number}: assigned user "
                f"{assignee.id} has no email address; skipping technician notification"
            )
            return False

        technician_name = (
            f"{assignee.first_name} {assignee.last_name}".strip()
            or assignee.username
            or "Técnico"
        )
        tickets_email = settings.TICKETS_EMAIL

        context = {
            'ticket': ticket,
            'ticket_number': ticket.ticket_number,
            'technician_name': technician_name,
            'product_name': ticket.product_name,
            'description': ticket.description,
            'state': ticket.state,
            # 9B: no pasar priority al template del técnico.
            'business_name': settings.BUSINESS_NAME,
            'tickets_email': tickets_email,
            'business_phone': getattr(settings, 'BUSINESS_PHONE', None),
            'updated_at': ticket.updated_at,
        }

        html_content = render_to_string('emails/ticket_assigned.html', context)
        text_content = render_to_string('emails/ticket_assigned.txt', context)

        subject = f'Ticket asignado #{ticket.ticket_number} - {ticket.state.name}'
        from_email = f'{settings.DEFAULT_FROM_NAME} <{settings.DEFAULT_FROM_EMAIL}>'
        to_email = [assignee.email]

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email,
        )
        email.attach_alternative(html_content, "text/html")

        safe_print("\n" + "="*80)
        safe_print(f"EMAIL - TICKET ASSIGNED: {assignee.email}")
        safe_print("="*80)
        safe_print(f"Subject: {subject}")
        safe_print(f"From: {from_email}")
        safe_print(f"To: {to_email}")
        safe_print("-"*80)
        safe_print(text_content[:500])
        safe_print("="*80 + "\n")

        send_email_message(email)
        logger.info(
            f"Ticket #{ticket.ticket_number} assignment email sent to technician: "
            f"{assignee.email}"
        )
        return True

    except Exception as e:
        # El caller debe aislar este fallo: nunca revertir la asignación guardada.
        logger.error(
            f"Failed to send assignment email for ticket "
            f"#{ticket.ticket_number}: {str(e)}"
        )
        raise
