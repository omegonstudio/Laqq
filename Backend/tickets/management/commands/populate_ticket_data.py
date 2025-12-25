"""
Management command para poblar datos iniciales de tickets
Uso: python manage.py populate_ticket_data
"""
from django.core.management.base import BaseCommand
from tickets.models import TicketState, TicketPriority


class Command(BaseCommand):
    help = 'Poblar estados y prioridades iniciales para tickets de servicio técnico'

    def handle(self, *args, **options):
        self.stdout.write('Creando estados de tickets...')

        states = [
            {
                'id': 'new',
                'name': 'Nuevo',
                'color': '#3498db',  # Azul
                'description': 'Ticket recién creado, sin asignar',
                'is_final': False
            },
            {
                'id': 'open',
                'name': 'Abierto',
                'color': '#f39c12',  # Naranja
                'description': 'Ticket asignado a un técnico',
                'is_final': False
            },
            {
                'id': 'in_progress',
                'name': 'En progreso',
                'color': '#9b59b6',  # Púrpura
                'description': 'Técnico trabajando en el ticket',
                'is_final': False
            },
            {
                'id': 'waiting_parts',
                'name': 'Esperando repuestos',
                'color': '#e74c3c',  # Rojo
                'description': 'En espera de repuestos o materiales',
                'is_final': False
            },
            {
                'id': 'resolved',
                'name': 'Resuelto',
                'color': '#1abc9c',  # Verde agua
                'description': 'Problema resuelto, esperando confirmación',
                'is_final': False
            },
            {
                'id': 'closed',
                'name': 'Cerrado',
                'color': '#27ae60',  # Verde
                'description': 'Ticket cerrado y finalizado',
                'is_final': True
            },
        ]

        for state_data in states:
            state, created = TicketState.objects.get_or_create(
                id=state_data['id'],
                defaults=state_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'+ Estado creado: {state.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'- Estado ya existe: {state.name}')
                )

        self.stdout.write('\nCreando prioridades de tickets...')

        priorities = [
            {
                'id': 'low',
                'name': 'Baja',
                'level': 1,
                'color': '#95a5a6',  # Gris
                'description': 'Problema menor sin urgencia'
            },
            {
                'id': 'medium',
                'name': 'Media',
                'level': 2,
                'color': '#3498db',  # Azul
                'description': 'Problema estándar con prioridad normal'
            },
            {
                'id': 'high',
                'name': 'Alta',
                'level': 3,
                'color': '#f39c12',  # Naranja
                'description': 'Problema importante que requiere atención pronta'
            },
            {
                'id': 'urgent',
                'name': 'Urgente',
                'level': 4,
                'color': '#e74c3c',  # Rojo
                'description': 'Problema crítico que requiere atención inmediata'
            },
        ]

        for priority_data in priorities:
            priority, created = TicketPriority.objects.get_or_create(
                id=priority_data['id'],
                defaults=priority_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'+ Prioridad creada: {priority.name} (nivel {priority.level})')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'- Prioridad ya existe: {priority.name}')
                )

        self.stdout.write(
            self.style.SUCCESS('\n+ Datos iniciales cargados exitosamente')
        )
