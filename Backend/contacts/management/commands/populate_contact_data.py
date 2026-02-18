"""
Management command para poblar datos iniciales de contactos.
Uso: python manage.py populate_contact_data
"""
from django.core.management.base import BaseCommand
from contacts.models import ContactState


class Command(BaseCommand):
    help = 'Poblar estados iniciales para contactos'

    def handle(self, *args, **options):
        self.stdout.write('Creando estados de contactos...')

        states = [
            {
                'id': 'new',
                'name': 'Nuevo',
                'color': '#3498db',
            },
            {
                'id': 'in_progress',
                'name': 'En progreso',
                'color': '#f39c12',
            },
            {
                'id': 'responded',
                'name': 'Respondido',
                'color': '#9b59b6',
            },
            {
                'id': 'closed',
                'name': 'Cerrado',
                'color': '#27ae60',
            },
        ]

        for state_data in states:
            state, created = ContactState.objects.get_or_create(
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

        self.stdout.write(
            self.style.SUCCESS('\n+ Datos iniciales de contactos cargados exitosamente')
        )
