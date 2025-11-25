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

    class Meta:
        db_table = 'service_tickets'
        ordering = ['-created_at']    