"""
Script para simular la creación de un ticket desde el admin
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from tickets.models import ServiceTicket, TicketState, TicketPriority
from contacts.models import Contact

# Obtener contacto y estado/prioridad
contact = Contact.objects.first()
state = TicketState.objects.get(id='new')
priority = TicketPriority.objects.get(id='medium')

print("Simulando creación de ticket desde admin...")
print("=" * 60)

# Crear ticket SIN especificar ticket_number (como hace el admin)
ticket = ServiceTicket(
    contact=contact,
    product_name='Producto de Prueba Admin',
    description='Este ticket se creó simulando el comportamiento del admin de Django sin especificar ticket_number.',
    state=state,
    priority=priority
)

print(f"ANTES de save():")
print(f"  ticket_number: '{ticket.ticket_number}'")
print(f"  Estado: {ticket.state.id if ticket.state else 'None'}")

# Guardar (esto ejecuta el método save() personalizado)
ticket.save()

print(f"\nDESPUES de save():")
print(f"  ticket_number: '{ticket.ticket_number}'")
print(f"  Estado: {ticket.state.id}")
print(f"  ID: {ticket.id}")

# Verificar que se guardó correctamente
ticket.refresh_from_db()
print(f"\nVERIFICACION desde BD:")
print(f"  ticket_number: '{ticket.ticket_number}'")

if ticket.ticket_number and ticket.ticket_number.startswith('T-2025-'):
    print("\nEXITO! El ticket se creo con numero automatico.")
else:
    print("\nERROR: El ticket no tiene numero o el formato es incorrecto.")

# Limpiar
ticket.delete()
print("\nTicket de prueba eliminado.")
