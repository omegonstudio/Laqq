from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Quote
from .emails import send_quote_created_email, send_quote_updated_email
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Quote)
def send_quote_notification(sender, instance, created, **kwargs):
    """
    Enviar notificación por email cuando se crea o actualiza una cotización
    """
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
                    print(f"✅ Email enviado al negocio para cotización #{instance.quote_number}")
                else:
                    print(f"⚠️ No se pudo enviar email al negocio para cotización #{instance.quote_number}")
                    
                if results['customer']:
                    print(f"✅ Email enviado al cliente para cotización #{instance.quote_number}")
                else:
                    print(f"⚠️ No se pudo enviar email al cliente para cotización #{instance.quote_number}")
                    
                if results['errors']:
                    for error in results['errors']:
                        print(f"❌ Error: {error}")
                        
            except Exception as e:
                print(f"❌ Error al enviar emails para cotización #{instance.quote_number}: {e}")
        else:
            # Cotización actualizada
            try:
                results = send_quote_updated_email(instance)
                
                if results['business']:
                    print(f"✅ Email de actualización enviado al negocio para cotización #{instance.quote_number}")
                    
                if results['customer']:
                    print(f"✅ Email de actualización enviado al cliente para cotización #{instance.quote_number}")
                    
                if results['errors']:
                    for error in results['errors']:
                        print(f"❌ Error: {error}")
                        
            except Exception as e:
                print(f"❌ Error al enviar emails de actualización para cotización #{instance.quote_number}: {e}")
                
    finally:
        # Reconectar el signal
        post_save.connect(send_quote_notification, sender=Quote)