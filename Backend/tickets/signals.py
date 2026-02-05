from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import ServiceTicket
from .emails import send_ticket_created_email
import secrets
import string
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=ServiceTicket)
def send_ticket_notification(sender, instance, created, **kwargs):
    """
    Enviar notificación por email cuando se crea un nuevo ticket
    """
    # No enviar emails durante tests
    if getattr(settings, 'TESTING', False):
        return

    # Evitar recursión: solo enviar si es creación y no viene de un guardado interno
    if created and not kwargs.get('raw', False):
        # Desconectar el signal temporalmente para evitar recursión
        post_save.disconnect(send_ticket_notification, sender=ServiceTicket)

        try:
            # Generar credenciales
            username = instance.contact.email
            password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))

            # Enviar emails
            try:
                results = send_ticket_created_email(instance, username, password)

                if results['business']:
                    logger.info("Email enviado al negocio para ticket #%s", instance.ticket_number)
                else:
                    logger.warning("No se pudo enviar email al negocio para ticket #%s", instance.ticket_number)

                if results['customer']:
                    logger.info("Email enviado al cliente para ticket #%s", instance.ticket_number)
                else:
                    logger.warning("No se pudo enviar email al cliente para ticket #%s", instance.ticket_number)

                if results['errors']:
                    for error in results['errors']:
                        logger.error("Error en email de ticket: %s", error)

            except Exception as e:
                logger.error("Error al enviar emails para ticket #%s: %s", instance.ticket_number, e)

        finally:
            # Reconectar el signal
            post_save.connect(send_ticket_notification, sender=ServiceTicket)