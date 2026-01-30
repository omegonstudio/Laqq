from rest_framework import serializers
from .models import ServiceTicket, TicketState, TicketPriority
from datetime import datetime
from django.utils import timezone
from .utils import generate_secure_password, generate_username_from_contact
from .emails import send_ticket_created_email
from users.models import User, UserType, UserState
from attachments.models import Attachment
from attachments.serializers import AttachmentSerializer
from contacts.models import Contact
from contacts.serializers import ContactSerializer
import logging

logger = logging.getLogger(__name__)

class TicketStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketState
        fields = '__all__'

class TicketPrioritySerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketPriority
        fields = '__all__'

class ServiceTicketSerializer(serializers.ModelSerializer):
    # Lista de todos los attachments asociados al ticket (read-only)
    attachments = serializers.SerializerMethodField(read_only=True)

    # Contact como objeto en las respuestas (GET), pero acepta ID en las escrituras (POST/PUT/PATCH)
    contact = ContactSerializer(read_only=True)
    contact_id = serializers.PrimaryKeyRelatedField(
        queryset=Contact.objects.all(),
        source='contact',
        write_only=True
    )

    class Meta:
        model = ServiceTicket
        fields = '__all__'
        read_only_fields = [
            'ticket_number',
            'assigned_at',
            'started_at',
            'resolved_at',
            'closed_at',
            'attachments'
        ]

    def get_attachments(self, obj):
        """
        Retorna todos los attachments asociados al ticket.
        Busca por attachable_type='ServiceTicket' y attachable_id=ticket.id
        """
        qs = Attachment.objects.filter(
            attachable_type='ServiceTicket',
            attachable_id=obj.id
        ).order_by('-created_at')
        return AttachmentSerializer(qs, many=True, context=self.context).data

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
        """
        Crear ticket con número automático, estado inicial,
        usuario cliente automático y envío de email con credenciales
        """
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

        # Crear el ticket
        ticket = super().create(validated_data)

        # Crear usuario cliente automáticamente si no existe
        contact = ticket.contact
        username = None
        password = None

        try:
            # Verificar si el contacto ya tiene un usuario asociado
            existing_user = User.objects.filter(email=contact.email).first()

            if not existing_user:
                # Generar credenciales
                username = generate_username_from_contact(contact)
                password = generate_secure_password()

                # Obtener user_type 'client' y user_state 'active'
                client_type = UserType.objects.get(id='client')
                active_state = UserState.objects.get(id='active')

                # Crear nuevo usuario
                user = User.objects.create_user(
                    username=username,
                    email=contact.email,
                    password=password,
                    first_name=contact.first_name,
                    last_name=contact.last_name,
                    user_type=client_type,
                    state=active_state,
                )

                logger.info(f"Client user created: {username} for ticket {ticket.ticket_number}")
            else:
                logger.info(f"Client user already exists: {existing_user.username} for ticket {ticket.ticket_number}")

        except Exception as e:
            logger.error(f"Error creating client user for ticket {ticket.ticket_number}: {str(e)}")
            # No fallar la creación del ticket si falla la creación del usuario

        # Enviar email con credenciales (solo si se creó un nuevo usuario)
        if username and password:
            try:
                send_ticket_created_email(ticket, username, password)
                logger.info(f"Ticket creation email sent for {ticket.ticket_number}")
            except Exception as e:
                logger.error(f"Error sending ticket email for {ticket.ticket_number}: {str(e)}")
                # No fallar la creación del ticket si falla el envío de email

        return ticket

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