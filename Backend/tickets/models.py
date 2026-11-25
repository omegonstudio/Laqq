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
    producto_laqq = models.BooleanField(default=True)  # True si es producto de Laqq, False si es externo
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, blank=True, null=True, related_name='tickets')
    product_name = models.CharField(max_length=120, blank=True, default='')  # Mantener para flexibilidad
    numero_de_serie = models.CharField(max_length=255, default='')  # Número de serie del producto

    # Campos para productos externos (cuando producto_laqq = False)
    marca = models.CharField(max_length=255, blank=True, default='')  # Marca del producto externo
    modelo = models.CharField(max_length=255, blank=True, default='')  # Modelo del producto externo

    # Descripción del problema
    description = models.TextField()
    attachment = models.ForeignKey(Attachment, on_delete=models.SET_NULL, blank=True, null=True, related_name='tickets')

    # Estado y prioridad
    # T9-C: default operativo received (legacy 'new' se remapea en migración).
    state = models.ForeignKey(TicketState, on_delete=models.PROTECT, related_name='tickets', default='received')
    priority = models.ForeignKey(TicketPriority, on_delete=models.PROTECT, related_name='tickets', default='medium')

    # Asignación
    assigned_user = models.ForeignKey(settings.AUTH_USER_MODEL, blank=True, null=True, on_delete=models.SET_NULL, related_name='assigned_tickets')

    # Seguimiento de fechas
    created_at = models.DateTimeField(auto_now_add=True)  # Fecha de llegada
    assigned_at = models.DateTimeField(blank=True, null=True)  # Fecha de asignación
    started_at = models.DateTimeField(blank=True, null=True)  # Fecha de inicio de trabajo (legado)
    diagnosed_at = models.DateTimeField(blank=True, null=True)  # T9-C: pasó a Diagnosticado
    resolved_at = models.DateTimeField(blank=True, null=True)  # Fecha de resolución (legado)
    quoted_at = models.DateTimeField(blank=True, null=True)  # T9-C: pasó a Presupuestado
    closed_at = models.DateTimeField(blank=True, null=True)  # Fecha de cierre
    updated_at = models.DateTimeField(auto_now=True)

    # Notas de resolución (pueden llegar al cliente)
    resolution_notes = models.TextField(blank=True, null=True)
    # T9: notas internas — solo admin / servicio_tecnico (nunca cliente)
    internal_notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.ticket_number} - {self.product_name}"

    def save(self, *args, **kwargs):
        """
        Auto-genera ticket_number y assigned_at.
        Las transiciones de estado y timestamps operativos se gestionan
        en tickets.workflow (acciones API), no aquí.
        """
        from django.utils import timezone
        from datetime import datetime

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

        if self.pk:
            try:
                old_ticket = ServiceTicket.objects.get(pk=self.pk)
                old_assigned_user = old_ticket.assigned_user
            except ServiceTicket.DoesNotExist:
                old_assigned_user = None
        else:
            old_assigned_user = None

        # Primera asignación: solo assigned_at (no cambia estado — T9).
        if self.assigned_user and not old_assigned_user and not self.assigned_at:
            self.assigned_at = timezone.now()

        super().save(*args, **kwargs)

    class Meta:
        db_table = 'service_tickets'
        ordering = ['-created_at']


class TicketStateMigrationAudit(models.Model):
    """
    Auditoría de remapeos de estado (T9-C1: new → received).
    Permite revertir únicamente los tickets tocados por una migración concreta.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(
        ServiceTicket,
        on_delete=models.CASCADE,
        related_name='state_migration_audits',
    )
    from_state_id = models.CharField(max_length=50)
    to_state_id = models.CharField(max_length=50)
    migration_name = models.CharField(max_length=255)
    migrated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ticket_state_migration_audits'
        ordering = ['-migrated_at']
        indexes = [
            models.Index(fields=['migration_name', 'from_state_id', 'to_state_id']),
        ]

    def __str__(self):
        return (
            f"{self.migration_name}: {self.ticket_id} "
            f"{self.from_state_id}→{self.to_state_id}"
        )
