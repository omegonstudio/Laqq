from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import Contact, Message
from .emails import send_contact_created_email, send_message_created_email
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Contact)
def send_contact_notification(sender, instance, created, **kwargs):
    """
    Enviar notificación por email cuando se crea un nuevo contacto
    """
    # No enviar emails durante tests
    if getattr(settings, 'TESTING', False):
        return

    # Evitar recursión: solo enviar si es creación y no viene de un guardado interno
    if created and not kwargs.get('raw', False):
        # Desconectar el signal temporalmente para evitar recursión
        post_save.disconnect(send_contact_notification, sender=Contact)
        
        try:
            # Enviar emails
            try:
                results = send_contact_created_email(instance)
                
                if results['business']:
                    logger.info("Email enviado al negocio para contacto: %s", instance.email)
                else:
                    logger.warning("No se pudo enviar email al negocio para contacto: %s", instance.email)

                if results['customer']:
                    logger.info("Email de bienvenida enviado al contacto: %s", instance.email)
                else:
                    logger.warning("No se pudo enviar email de bienvenida al contacto: %s", instance.email)

                if results['errors']:
                    for error in results['errors']:
                        logger.error("Error en email de contacto: %s", error)

            except Exception as e:
                logger.error("Error al enviar emails para contacto %s: %s", instance.email, e)
                
        finally:
            # Reconectar el signal
            post_save.connect(send_contact_notification, sender=Contact)


@receiver(post_save, sender=Message)
def send_message_notification(sender, instance, created, **kwargs):
    """
    Enviar notificación por email cuando se crea un nuevo mensaje
    """
    # No enviar emails durante tests
    if getattr(settings, 'TESTING', False):
        return

    # Evitar recursión: solo enviar si es creación y no viene de un guardado interno
    if created and not kwargs.get('raw', False):
        # Desconectar el signal temporalmente para evitar recursión
        post_save.disconnect(send_message_notification, sender=Message)
        
        try:
            # Enviar emails
            try:
                results = send_message_created_email(instance)
                
                if results['business']:
                    sender_name = f"{instance.first_name or ''} {instance.last_name or ''}".strip() or "Anonimo"
                    logger.info("Email de mensaje enviado al negocio de: %s", sender_name)
                else:
                    logger.warning("No se pudo enviar email de mensaje al negocio")

                if results['errors']:
                    for error in results['errors']:
                        logger.error("Error en email de mensaje: %s", error)

            except Exception as e:
                logger.error("Error al enviar emails para mensaje: %s", e)
                
        finally:
            # Reconectar el signal
            post_save.connect(send_message_notification, sender=Message)