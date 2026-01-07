import uuid
from django.db import models
from contacts.models import Contact
from attachments.models import Attachment
from products.models import Product
from django.conf import settings

class TicketState(models.Model):
    """Estados específicos para tickets de servicio técnico"""
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=20, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_final = models.BooleanField(default=False)  # True para estados 'closed'
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'ticket_states'
        ordering = ['name']

class TicketPriority(models.Model):
    """Prioridades para tickets de servicio técnico"""
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    level = models.IntegerField(default=0)  # Nivel numérico para ordenamiento (1=baja, 4=urgente)
    color = models.CharField(max_length=20, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'ticket_priorities'
        ordering = ['-level']

class ServiceTicket(models.Model):
    id = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)
    ticket_number = models.CharField(max_length=100, unique=True)
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='tickets')

    # Información del producto
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, blank=True, null=True, related_name='tickets')
    product_name = models.CharField(max_length=120)  # Mantener para flexibilidad

    # Descripción del problema
    description = models.TextField()
    attachment = models.ForeignKey(Attachment, on_delete=models.SET_NULL, blank=True, null=True, related_name='tickets')

    # Estado y prioridad
    state = models.ForeignKey(TicketState, on_delete=models.PROTECT, related_name='tickets', default='new')
    priority = models.ForeignKey(TicketPriority, on_delete=models.PROTECT, related_name='tickets', default='medium')

    # Asignación
    assigned_user = models.ForeignKey(settings.AUTH_USER_MODEL, blank=True, null=True, on_delete=models.SET_NULL, related_name='assigned_tickets')

    # Seguimiento de fechas
    created_at = models.DateTimeField(auto_now_add=True)  # Fecha de llegada
    assigned_at = models.DateTimeField(blank=True, null=True)  # Fecha de asignación
    started_at = models.DateTimeField(blank=True, null=True)  # Fecha de inicio de trabajo
    resolved_at = models.DateTimeField(blank=True, null=True)  # Fecha de resolución
    closed_at = models.DateTimeField(blank=True, null=True)  # Fecha de cierre
    updated_at = models.DateTimeField(auto_now=True)

    # Notas de resolución
    resolution_notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.ticket_number} - {self.product_name}"

    def save(self, *args, **kwargs):
        """
        Sobrescribir save() para:
        1. Auto-generar ticket_number si no existe
        2. Actualizar fechas automáticamente según cambios de estado
        Esto funciona tanto desde el admin de Django como desde la API.
        """
        from django.utils import timezone
        from datetime import datetime

        # 1. AUTO-GENERAR TICKET_NUMBER si no existe
        if not self.ticket_number:
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

            self.ticket_number = f'T-{year}-{new_number:05d}'

        # 2. ACTUALIZAR FECHAS SEGÚN CAMBIOS DE ESTADO
        # Si el ticket ya existe en la BD, obtener el estado anterior
        if self.pk:
            try:
                old_ticket = ServiceTicket.objects.get(pk=self.pk)
                old_state = old_ticket.state.id if old_ticket.state else None
                old_assigned_user = old_ticket.assigned_user
            except ServiceTicket.DoesNotExist:
                old_state = None
                old_assigned_user = None
        else:
            old_state = None
            old_assigned_user = None

        new_state = self.state.id if self.state else None
        now = timezone.now()

        # Asignación: Si se asigna un usuario por primera vez
        if self.assigned_user and not old_assigned_user and not self.assigned_at:
            self.assigned_at = now
            # Si el estado es 'new', cambiar automáticamente a 'open'
            if old_state == 'new' or new_state == 'new':
                try:
                    self.state = TicketState.objects.get(id='open')
                    new_state = 'open'
                except TicketState.DoesNotExist:
                    pass

        # Inicio de trabajo: Cambio a 'in_progress'
        if new_state == 'in_progress' and old_state != 'in_progress':
            if not self.started_at:
                self.started_at = now

        # Resolución: Cambio a 'resolved'
        if new_state == 'resolved' and old_state != 'resolved':
            if not self.resolved_at:
                self.resolved_at = now

        # Cierre: Cambio a 'closed'
        if new_state == 'closed' and old_state != 'closed':
            if not self.closed_at:
                self.closed_at = now
            # Si no tiene fecha de resolución, agregarla también
            if not self.resolved_at:
                self.resolved_at = now

        super().save(*args, **kwargs)

    class Meta:
        db_table = 'service_tickets'
        ordering = ['-created_at']    