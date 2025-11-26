"""
Script de prueba para verificar si se pueden cambiar estados de tickets
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from tickets.models import ServiceTicket, TicketState
from contacts.models import Contact

# Verificar que existan estados
print("Estados disponibles:")
states = TicketState.objects.all()
for state in states:
    print(f"  - {state.id}: {state.name}")

# Buscar un contacto existente o crear uno nuevo
contact = Contact.objects.first()
if not contact:
    print("No hay contactos en la base de datos. Creando uno...")
    from contacts.models import ContactState
    state = ContactState.objects.first()
    if not state:
        state = ContactState.objects.create(
            id='new',
            name='Nuevo'
        )
    contact = Contact.objects.create(
        company_name='Empresa Test',
        first_name='Cliente',
        last_name='de Prueba',
        email='test@example.com',
        state=state
    )
print(f"Usando contacto: {contact.first_name} {contact.last_name}")

# Crear un ticket de prueba (borrar si existe)
ServiceTicket.objects.filter(ticket_number='TEST-2025-00001').delete()

ticket = ServiceTicket.objects.create(
    ticket_number='TEST-2025-00001',
    contact=contact,
    product_name='Producto de Prueba',
    description='Esta es una descripción de prueba con más de 20 caracteres.'
)

print(f"\nTicket creado: {ticket.ticket_number}")
print(f"Estado inicial: {ticket.state.id if ticket.state else 'None'}")

# Intentar cambiar el estado
try:
    new_state = TicketState.objects.get(id='in_progress')
    ticket.state = new_state
    ticket.save()

    ticket.refresh_from_db()
    print(f"Estado despues del cambio: {ticket.state.id}")
    print(f"started_at: {ticket.started_at}")

    if ticket.started_at:
        print("OK - Cambio de estado exitoso con fecha automatica!")
    else:
        print("ADVERTENCIA - Estado cambio pero started_at es None")

except Exception as e:
    print(f"ERROR - Error al cambiar estado: {e}")

# Limpiar
ticket.delete()
print("\nTicket de prueba eliminado.")
