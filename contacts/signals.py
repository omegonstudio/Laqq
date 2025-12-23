from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Contact, Message
from .emails import send_contact_created_email, send_message_created_email
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Contact)
def send_contact_notification(sender, instance, created, **kwargs):
    """
    Enviar notificación por email cuando se crea un nuevo contacto
    """
    # Evitar recursión: solo enviar si es creación y no viene de un guardado interno
    if created and not kwargs.get('raw', False):
        # Desconectar el signal temporalmente para evitar recursión
        post_save.disconnect(send_contact_notification, sender=Contact)
        
        try:
            # Enviar emails
            try:
                results = send_contact_created_email(instance)
                
                if results['business']:
                    print(f"✅ Email enviado al negocio para contacto: {instance.email}")
                else:
                    print(f"⚠️ No se pudo enviar email al negocio para contacto: {instance.email}")
                    
                if results['customer']:
                    print(f"✅ Email de bienvenida enviado al contacto: {instance.email}")
                else:
                    print(f"⚠️ No se pudo enviar email de bienvenida al contacto: {instance.email}")
                    
                if results['errors']:
                    for error in results['errors']:
                        print(f"❌ Error: {error}")
                        
            except Exception as e:
                print(f"❌ Error al enviar emails para contacto {instance.email}: {e}")
                
        finally:
            # Reconectar el signal
            post_save.connect(send_contact_notification, sender=Contact)


@receiver(post_save, sender=Message)
def send_message_notification(sender, instance, created, **kwargs):
    """
    Enviar notificación por email cuando se crea un nuevo mensaje
    """
    # Evitar recursión: solo enviar si es creación y no viene de un guardado interno
    if created and not kwargs.get('raw', False):
        # Desconectar el signal temporalmente para evitar recursión
        post_save.disconnect(send_message_notification, sender=Message)
        
        try:
            # Enviar emails
            try:
                results = send_message_created_email(instance)
                
                if results['business']:
                    sender_name = f"{instance.first_name or ''} {instance.last_name or ''}".strip() or "Anónimo"
                    print(f"✅ Email de mensaje enviado al negocio de: {sender_name}")
                else:
                    print(f"⚠️ No se pudo enviar email de mensaje al negocio")
                    
                if results['errors']:
                    for error in results['errors']:
                        print(f"❌ Error: {error}")
                        
            except Exception as e:
                print(f"❌ Error al enviar emails para mensaje: {e}")
                
        finally:
            # Reconectar el signal
            post_save.connect(send_message_notification, sender=Message)