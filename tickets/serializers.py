from rest_framework import serializers
from .models import ServiceTicket, TicketState, TicketPriority
from datetime import datetime
from django.utils import timezone

class TicketStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketState
        fields = '__all__'

class TicketPrioritySerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketPriority
        fields = '__all__'

class ServiceTicketSerializer(serializers.ModelSerializer):
    # Campos de solo lectura calculados automáticamente
    class Meta:
        model = ServiceTicket
        fields = '__all__'
        read_only_fields = [
            'ticket_number',
            'assigned_at',
            'started_at',
            'resolved_at',
            'closed_at'
        ]

    def validate_description(self, value):
        """Validar que la descripción tenga al menos 20 caracteres"""
        if len(value.strip()) < 20:
            raise serializers.ValidationError("Description must be at least 20 characters long")
        return value

    def validate(self, data):
        """Validaciones cruzadas de campos"""
        # Si se proporciona un product, sincronizar product_name
        if 'product' in data and data['product']:
            data['product_name'] = data['product'].name

        return data

    def create(self, validated_data):
        """Crear ticket con número automático y estado inicial"""
        # Auto-generate ticket_number
        if not validated_data.get('ticket_number'):
            year = datetime.now().year
            last_ticket = ServiceTicket.objects.filter(
                ticket_number__startswith=f'T-{year}'
            ).order_by('-created_at').first()

            if last_ticket and last_ticket.ticket_number:
                try:
                    last_number = int(last_ticket.ticket_number.split('-')[-1])
                    new_number = last_number + 1
                except (ValueError, IndexError):
                    new_number = 1
            else:
                new_number = 1

            validated_data['ticket_number'] = f'T-{year}-{new_number:05d}'

        # Si no se especifica estado, usar 'new'
        if 'state' not in validated_data:
            try:
                validated_data['state'] = TicketState.objects.get(id='new')
            except TicketState.DoesNotExist:
                pass

        # Si no se especifica prioridad, usar 'medium'
        if 'priority' not in validated_data:
            try:
                validated_data['priority'] = TicketPriority.objects.get(id='medium')
            except TicketPriority.DoesNotExist:
                pass

        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Actualizar ticket con lógica de transición de estados"""
        # Obtener el estado anterior y nuevo
        old_state = instance.state.id if instance.state else None
        new_state = validated_data.get('state')
        new_state_id = new_state.id if new_state else None

        # Obtener usuario asignado anterior y nuevo
        old_assigned_user = instance.assigned_user
        new_assigned_user = validated_data.get('assigned_user', old_assigned_user)

        # Lógica de fechas según transiciones de estado
        now = timezone.now()

        # Asignación: Si se asigna un usuario por primera vez
        if new_assigned_user and not old_assigned_user and not instance.assigned_at:
            validated_data['assigned_at'] = now
            # Si el estado es 'new', cambiar automáticamente a 'open'
            if old_state == 'new':
                try:
                    validated_data['state'] = TicketState.objects.get(id='open')
                    new_state_id = 'open'
                except TicketState.DoesNotExist:
                    pass

        # Inicio de trabajo: Cambio a 'in_progress'
        if new_state_id == 'in_progress' and old_state != 'in_progress':
            if not instance.started_at:
                validated_data['started_at'] = now

        # Resolución: Cambio a 'resolved'
        if new_state_id == 'resolved' and old_state != 'resolved':
            if not instance.resolved_at:
                validated_data['resolved_at'] = now

        # Cierre: Cambio a 'closed'
        if new_state_id == 'closed' and old_state != 'closed':
            if not instance.closed_at:
                validated_data['closed_at'] = now
            # Si no tiene fecha de resolución, agregarla también
            if not instance.resolved_at:
                validated_data['resolved_at'] = now

        return super().update(instance, validated_data)