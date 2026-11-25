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
                'id': 'abierto',
                'name': 'Abierto',
                'color': '#f39c12',
                'description': 'Cotización abierta / en curso',
            },
            {
                'id': 'enviado',
                'name': 'Enviado',
                'color': '#3498db',
                'description': 'Cotización enviada al cliente desde el sistema',
            },
            {
                'id': 'enviado_fuera',
                'name': 'Enviado por fuera del sistema',
                'color': '#2980b9',
                'description': 'Cotización enviada por un canal externo',
            },
            {
                'id': 'aceptado',
                'name': 'Aceptado',
                'color': '#27ae60',
                'description': 'Cotización aceptada por el cliente',
            },
            {
                'id': 'rechazado',
                'name': 'Rechazado',
                'color': '#e74c3c',
                'description': 'Cotización rechazada por el cliente',
            },
            {
                'id': 'cerrado',
                'name': 'Cerrado',
                'color': '#95a5a6',
                'description': 'Cotización cerrada',
            },
        ]

        for state_data in quote_states:
            qs, created = QuoteState.objects.update_or_create(
                id=state_data['id'],
                defaults={
                    'name': state_data['name'],
                    'color': state_data['color'],
                    'description': state_data['description'],
                },
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'+ Estado creado: {qs.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'- Estado actualizado: {qs.name}')
                )

        self.stdout.write(
            self.style.SUCCESS('\n+ Datos iniciales de cotizaciones cargados exitosamente')
        )
