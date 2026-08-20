"""
Management command para poblar datos iniciales de cotizaciones.
Uso: python manage.py populate_quote_data
"""
from django.core.management.base import BaseCommand
from quotes.models import QuoteType, QuoteState


class Command(BaseCommand):
    help = 'Poblar tipos y estados iniciales para cotizaciones'

    def handle(self, *args, **options):
        self.stdout.write('Creando tipos de cotización...')

        quote_types = [
            {
                'id': 'standard',
                'name': 'Estándar',
                'description': 'Cotización estándar',
            },
            {
                'id': 'express',
                'name': 'Express',
                'description': 'Cotización con entrega rápida',
            },
        ]

        for type_data in quote_types:
            qt, created = QuoteType.objects.get_or_create(
                id=type_data['id'],
                defaults=type_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'+ Tipo creado: {qt.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'- Tipo ya existe: {qt.name}')
                )

        self.stdout.write('\nCreando estados de cotización...')

        quote_states = [
            {
                'id': 'pending',
                'name': 'Pendiente',
                'color': '#f39c12',
                'description': 'Cotización recibida, pendiente de revisión',
            },
            {
                'id': 'assigned',
                'name': 'Asignada',
                'color': '#8e44ad',
                'description': 'Cotización asignada a un usuario del backoffice',
            },
            {
                'id': 'sent',
                'name': 'Enviada',
                'color': '#3498db',
                'description': 'Cotización enviada al cliente',
            },
            {
                'id': 'confirmed',
                'name': 'Confirmada',
                'color': '#27ae60',
                'description': 'Cotización aceptada por el cliente',
            },
            {
                'id': 'rejected',
                'name': 'Rechazada',
                'color': '#e74c3c',
                'description': 'Cotización rechazada por el cliente',
            },
            {
                'id': 'expired',
                'name': 'Vencida',
                'color': '#95a5a6',
                'description': 'Cotización vencida por tiempo',
            },
        ]

        for state_data in quote_states:
            qs, created = QuoteState.objects.get_or_create(
                id=state_data['id'],
                defaults=state_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'+ Estado creado: {qs.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'- Estado ya existe: {qs.name}')
                )

        self.stdout.write(
            self.style.SUCCESS('\n+ Datos iniciales de cotizaciones cargados exitosamente')
        )
