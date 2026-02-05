from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import Quote
from .emails import send_quote_created_email, send_quote_updated_email
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Quote)
def send_quote_notification(sender, instance, created, **kwargs):
    """
    Enviar notificación por email cuando se crea o actualiza una cotización
    """
    # No enviar emails durante tests
    if getattr(settings, 'TESTING', False):
        return

    # Evitar recursión: solo enviar si no viene de un guardado interno
    if kwargs.get('raw', False):
        return
    
    # Desconectar el signal temporalmente para evitar recursión
    post_save.disconnect(send_quote_notification, sender=Quote)
    
    try:
        if created:
            # Nueva cotización
            try:
                results = send_quote_created_email(instance)

                if results['business']:
                    logger.info("Email enviado al negocio para cotizacion #%s", instance.quote_number)
                else:
                    logger.warning("No se pudo enviar email al negocio para cotizacion #%s", instance.quote_number)

                if results['customer']:
                    logger.info("Email enviado al cliente para cotizacion #%s", instance.quote_number)
                else:
                    logger.warning("No se pudo enviar email al cliente para cotizacion #%s", instance.quote_number)

                if results['errors']:
                    for error in results['errors']:
                        logger.error("Error en email de cotizacion: %s", error)

            except Exception as e:
                logger.error("Error al enviar emails para cotizacion #%s: %s", instance.quote_number, e)
        else:
            # Cotización actualizada
            try:
                results = send_quote_updated_email(instance)

                if results['business']:
                    logger.info("Email de actualizacion enviado al negocio para cotizacion #%s", instance.quote_number)

                if results['customer']:
                    logger.info("Email de actualizacion enviado al cliente para cotizacion #%s", instance.quote_number)

                if results['errors']:
                    for error in results['errors']:
                        logger.error("Error en email de actualizacion: %s", error)

            except Exception as e:
                logger.error("Error al enviar emails de actualizacion para cotizacion #%s: %s", instance.quote_number, e)
                
    finally:
        # Reconectar el signal
        post_save.connect(send_quote_notification, sender=Quote)