from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ServiceTicket
from .emails import send_ticket_created_email
import secrets
import string


@receiver(post_save, sender=ServiceTicket)
def send_ticket_notification(sender, instance, created, **kwargs):
    """
    Enviar notificación por email cuando se crea un nuevo ticket
    """
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
                    print(f"✅ Email enviado al negocio para ticket #{instance.ticket_number}")
                else:
                    print(f"⚠️ No se pudo enviar email al negocio para ticket #{instance.ticket_number}")
                    
                if results['customer']:
                    print(f"✅ Email enviado al cliente para ticket #{instance.ticket_number}")
                else:
                    print(f"⚠️ No se pudo enviar email al cliente para ticket #{instance.ticket_number}")
                    
                if results['errors']:
                    for error in results['errors']:
                        print(f"❌ Error: {error}")
                        
            except Exception as e:
                print(f"❌ Error al enviar emails para ticket #{instance.ticket_number}: {e}")
                
        finally:
            # Reconectar el signal
            post_save.connect(send_ticket_notification, sender=ServiceTicket)