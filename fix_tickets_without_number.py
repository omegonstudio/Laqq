"""
Script para asignar números de ticket a tickets que no tienen
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from tickets.models import ServiceTicket
from datetime import datetime

# Buscar tickets sin número
tickets_sin_numero = ServiceTicket.objects.filter(ticket_number__isnull=True) | ServiceTicket.objects.filter(ticket_number='')

print(f"Tickets sin número encontrados: {tickets_sin_numero.count()}")

for ticket in tickets_sin_numero:
    # Generar número automático
    year = ticket.created_at.year if ticket.created_at else datetime.now().year

    last_ticket = ServiceTicket.objects.filter(
        ticket_number__startswith=f'T-{year}'
    ).exclude(
        ticket_number__isnull=True
    ).exclude(
        ticket_number=''
    ).order_by('-ticket_number').first()

    if last_ticket and last_ticket.ticket_number:
        try:
            last_number = int(last_ticket.ticket_number.split('-')[-1])
            new_number = last_number + 1
        except (ValueError, IndexError):
            new_number = 1
    else:
        new_number = 1

    new_ticket_number = f'T-{year}-{new_number:05d}'

    print(f"Asignando número {new_ticket_number} al ticket {ticket.id}")
    ticket.ticket_number = new_ticket_number
    ticket.save()

print("\nProceso completado!")
print(f"Tickets corregidos: {tickets_sin_numero.count()}")
