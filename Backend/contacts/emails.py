"""
Email notifications for contact management.
Sends professional HTML emails to business when contacts or messages are created.
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


def send_contact_created_email(contact):
    """
    Send email notification when a new contact is created.
    Sends to business only.

    Args:
        contact: Contact instance that was just created

    Returns:
        dict: Status of email sending {'business': bool, 'customer': bool, 'errors': []}
    """
    results = {
        'business': False,
        'customer': False,
        'errors': []
    }

    try:
        # Send to business
        results['business'] = send_contact_to_business(contact)
    except Exception as e:
        error_msg = f"Error sending email to business: {str(e)}"
        logger.error(error_msg)
        results['errors'].append(error_msg)

    # Optionally send welcome email to contact
    try:
        results['customer'] = send_welcome_to_contact(contact)
    except Exception as e:
        error_msg = f"Error sending welcome email to contact: {str(e)}"
        logger.error(error_msg)
        results['errors'].append(error_msg)

    return results


def send_contact_to_business(contact):
    """
    Send new contact information to business email.

    Args:
        contact: Contact instance

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        context = {
            'contact': contact,
            'company_name': contact.company_name,
            'first_name': contact.first_name,
            'last_name': contact.last_name,
            'email': contact.email,
            'phone': contact.phone,
            'country': contact.country,
            'message': contact.message,
            'state': contact.state,
            'business_name': settings.BUSINESS_NAME,
            'created_at': contact.created_at,
        }

        # Render HTML template
        html_content = render_to_string('emails/contact_business.html', context)

        # Render text version as fallback
        text_content = strip_tags(html_content)

        # Create email
        subject = f'Nuevo Contacto: {contact.first_name} {contact.last_name} - {contact.company_name}'
        from_email = f'{settings.DEFAULT_FROM_NAME} <{settings.DEFAULT_FROM_EMAIL}>'
        to_email = [settings.BUSINESS_EMAIL]

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email,
        )

        # Attach HTML version
        email.attach_alternative(html_content, "text/html")

        # Print email content to console for debugging
        safe_print("\n" + "="*80)
        safe_print(f"EMAIL TO BUSINESS: {settings.BUSINESS_EMAIL}")
        safe_print("="*80)
        safe_print(f"Subject: {subject}")
        safe_print(f"From: {from_email}")
        safe_print(f"To: {to_email}")
        safe_print("-"*80)
        safe_print("HTML email sent (check email client for visual preview)")
        safe_print("="*80 + "\n")

        # Send email
        send_email_message(email)
        logger.info(f"Contact email sent to business: {settings.BUSINESS_EMAIL} for {contact.email}")

        return True

    except Exception as e:
        logger.error(f"Failed to send contact email to business: {str(e)}")
        raise


def send_welcome_to_contact(contact):
    """
    Send welcome email to the new contact.

    Args:
        contact: Contact instance

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Check if contact has email
        if not contact.email:
            logger.warning(f"Contact has no email address")
            return False

        context = {
            'contact': contact,
            'first_name': contact.first_name,
            'business_name': settings.BUSINESS_NAME,
            'business_email': settings.BUSINESS_EMAIL,
            'business_phone': settings.BUSINESS_PHONE,
        }

        # Render HTML template
        html_content = render_to_string('emails/contact_customer.html', context)

        # Render text version as fallback
        text_content = strip_tags(html_content)

        # Create email
        subject = f'Gracias por contactarnos - {settings.BUSINESS_NAME}'
        from_email = f'{settings.DEFAULT_FROM_NAME} <{settings.DEFAULT_FROM_EMAIL}>'
        to_email = [contact.email]

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email,
        )

        # Attach HTML version
        email.attach_alternative(html_content, "text/html")

        # Print email content to console for debugging
        safe_print("\n" + "="*80)
        safe_print(f"WELCOME EMAIL TO CONTACT: {contact.email}")
        safe_print("="*80)
        safe_print(f"Subject: {subject}")
        safe_print(f"From: {from_email}")
        safe_print(f"To: {to_email}")
        safe_print("-"*80)
        safe_print("HTML email sent (check email client for visual preview)")
        safe_print("="*80 + "\n")

        # Send email
        send_email_message(email)
        logger.info(f"Welcome email sent to contact: {contact.email}")

        return True

    except Exception as e:
        logger.error(f"Failed to send welcome email to contact: {str(e)}")
        raise


def send_message_created_email(message):
    """
    Send email notification when a new message is created.
    Sends to business only.

    Args:
        message: Message instance that was just created

    Returns:
        dict: Status of email sending {'business': bool, 'errors': []}
    """
    results = {
        'business': False,
        'errors': []
    }

    try:
        # Send to business
        results['business'] = send_message_to_business(message)
    except Exception as e:
        error_msg = f"Error sending message email to business: {str(e)}"
        logger.error(error_msg)
        results['errors'].append(error_msg)

    return results


def send_message_to_business(message):
    """
    Send new message information to business email.

    Args:
        message: Message instance

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Build sender name
        sender_name = f"{message.first_name or ''} {message.last_name or ''}".strip() or "Anónimo"

        context = {
            'message': message,
            'sender_name': sender_name,
            'company_name': message.company_name,
            'first_name': message.first_name,
            'last_name': message.last_name,
            'email': message.email,
            'phone': message.phone,
            'country': message.country,
            'message_text': message.message,
            'state': message.state,
            'business_name': settings.BUSINESS_NAME,
            'created_at': message.created_at,
        }

        # Render HTML template
        html_content = render_to_string('emails/message_business.html', context)

        # Render text version as fallback
        text_content = strip_tags(html_content)

        # Create email
        if message.company_name:
            sender_display = f"{sender_name} ({message.company_name})"
        else:
            sender_display = sender_name

        subject = f'Nuevo Mensaje de {sender_display}'
        from_email = f'{settings.DEFAULT_FROM_NAME} <{settings.DEFAULT_FROM_EMAIL}>'
        to_email = [settings.BUSINESS_EMAIL]

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email,
        )

        # Attach HTML version
        email.attach_alternative(html_content, "text/html")

        # Print email content to console for debugging
        safe_print("\n" + "="*80)
        safe_print(f"MESSAGE EMAIL TO BUSINESS: {settings.BUSINESS_EMAIL}")
        safe_print("="*80)
        safe_print(f"Subject: {subject}")
        safe_print(f"From: {from_email}")
        safe_print(f"To: {to_email}")
        safe_print("-"*80)
        safe_print("HTML email sent (check email client for visual preview)")
        safe_print("="*80 + "\n")

        # Send email
        send_email_message(email)
        logger.info(f"Message email sent to business: {settings.BUSINESS_EMAIL}")

        return True

    except Exception as e:
        logger.error(f"Failed to send message email to business: {str(e)}")
        raise