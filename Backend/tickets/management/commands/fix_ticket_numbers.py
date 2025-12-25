"""
Management command para asignar números de ticket a tickets que no tienen
"""
from django.core.management.base import BaseCommand
from tickets.models import ServiceTicket
from datetime import datetime


class Command(BaseCommand):
    help = 'Asigna números de ticket a tickets que no tienen'

    def handle(self, *args, **options):
        # Buscar tickets sin número
        tickets_sin_numero = ServiceTicket.objects.filter(
            ticket_number__isnull=True
        ) | ServiceTicket.objects.filter(ticket_number='')

        self.stdout.write(
            self.style.WARNING(
                f'Tickets sin número encontrados: {tickets_sin_numero.count()}'
            )
        )

        count = 0
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

            self.stdout.write(
                f'Asignando número {new_ticket_number} al ticket {ticket.id}'
            )
            ticket.ticket_number = new_ticket_number
            ticket.save()
            count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nProceso completado! Tickets corregidos: {count}'
            )
        )
