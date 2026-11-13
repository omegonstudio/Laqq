"""Exportación Excel de tickets de servicio técnico (patrón products)."""
from io import BytesIO

from django.db.models import Prefetch

from .models import ServiceTicket

EXCEL_MAX_CELL = 32767

BASE_HEADERS = [
    'id',
    'ticket_number',
    'state_id',
    'state_name',
    'contact_email',
    'contact_first_name',
    'contact_last_name',
    'company_name',
    'contact_phone',
    'contact_country',
    'producto_laqq',
    'product_name',
    'product_id',
    'numero_de_serie',
    'marca',
    'modelo',
    'description',
    'resolution_notes',
    'assigned_user_id',
    'assigned_user_email',
    'assigned_user_name',
    'created_at',
    'assigned_at',
    'started_at',
    'diagnosed_at',
    'quoted_at',
    'resolved_at',
    'closed_at',
    'updated_at',
]

INTERNAL_NOTES_HEADER = 'internal_notes'


def export_queryset():
    return (
        ServiceTicket.objects.select_related(
            'contact',
            'state',
            'assigned_user',
            'product',
        ).order_by('-created_at')
    )


def _cell(value):
    if value is None:
        return ''
    text = str(value)
    if len(text) > EXCEL_MAX_CELL:
        return text[:EXCEL_MAX_CELL]
    return text


def _dt(value):
    if not value:
        return ''
    return value.isoformat()


def build_tickets_workbook(tickets, *, include_internal_notes=False):
    try:
        from openpyxl import Workbook
    except ImportError as exc:
        raise ImportError('openpyxl no está instalado') from exc

    headers = list(BASE_HEADERS)
    if include_internal_notes:
        headers.append(INTERNAL_NOTES_HEADER)

    wb = Workbook()
    ws = wb.active
    ws.title = 'Tickets'
    ws.append(headers)

    for ticket in tickets:
        contact = ticket.contact
        assigned = ticket.assigned_user
        assigned_name = ''
        if assigned:
            assigned_name = f'{assigned.first_name or ""} {assigned.last_name or ""}'.strip() or (
                assigned.username or ''
            )
        row = [
            _cell(ticket.id),
            _cell(ticket.ticket_number),
            _cell(ticket.state_id),
            _cell(ticket.state.name if ticket.state_id else ''),
            _cell(contact.email if contact else ''),
            _cell(contact.first_name if contact else ''),
            _cell(contact.last_name if contact else ''),
            _cell(contact.company_name if contact else ''),
            _cell(contact.phone if contact else ''),
            _cell(contact.country if contact else ''),
            _cell(ticket.producto_laqq),
            _cell(ticket.product_name),
            _cell(ticket.product_id),
            _cell(ticket.numero_de_serie),
            _cell(ticket.marca),
            _cell(ticket.modelo),
            _cell(ticket.description),
            _cell(ticket.resolution_notes),
            _cell(ticket.assigned_user_id),
            _cell(assigned.email if assigned else ''),
            _cell(assigned_name),
            _dt(ticket.created_at),
            _dt(ticket.assigned_at),
            _dt(ticket.started_at),
            _dt(ticket.diagnosed_at),
            _dt(ticket.quoted_at),
            _dt(ticket.resolved_at),
            _dt(ticket.closed_at),
            _dt(ticket.updated_at),
        ]
        if include_internal_notes:
            row.append(_cell(ticket.internal_notes))
        ws.append(row)

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer
