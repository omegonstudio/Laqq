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
    Enviar notificación por email cuando se crea una cotización

    IMPORTANTE: Los emails de actualización se desactivaron automáticamente.
    Ahora solo se envían emails cuando:
    1. Se crea una nueva cotización (automático)
    2. El vendedor envía manualmente la cotización actualizada desde el backoffice
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
            # Nueva cotización - SÍ enviamos emails automáticamente
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
                logger.exception("Error al enviar emails para cotizacion #%s: %s", instance.quote_number, e)
        else:
            # Cotización actualizada - NO enviamos emails automáticamente
            # Los emails de actualización solo se envían manualmente desde el backoffice
            # usando el endpoint /api/quotes/list/{id}/send-updated/
            logger.info(
                "Cotización #%s actualizada. No se envían emails automáticos. "
                "Use el botón 'Enviar' en el backoffice para notificar al cliente.",
                instance.quote_number
            )

    finally:
        # Reconectar el signal
        post_save.connect(send_quote_notification, sender=Quote)