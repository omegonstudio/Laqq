"""
T9 workflow operativo de ServiceTicket.

Estados operativos: received → diagnosed → quoted → closed
Legacy (consultables, sin avance automático): new, open, in_progress, waiting_parts, resolved
"""
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import TicketState

OPERATIONAL_STATES = frozenset({'received', 'diagnosed', 'quoted', 'closed'})
LEGACY_STATES = frozenset({'new', 'open', 'in_progress', 'waiting_parts', 'resolved'})

# Acciones normales (sin reopen/classify)
NORMAL_TRANSITIONS = {
    'diagnose': {'from': frozenset({'received'}), 'to': 'diagnosed'},
    'quote': {'from': frozenset({'diagnosed'}), 'to': 'quoted'},
    'close': {
        'from': frozenset({'received', 'diagnosed', 'quoted'}),
        'to': 'closed',
    },
}


def is_operational(state_id):
    return state_id in OPERATIONAL_STATES


def is_legacy(state_id):
    return state_id in LEGACY_STATES


def _get_state(state_id):
    try:
        return TicketState.objects.get(id=state_id)
    except TicketState.DoesNotExist as exc:
        raise ValidationError({'state': f'Estado "{state_id}" no existe'}) from exc


def apply_timestamp_for_transition(ticket, to_state_id, now=None):
    """
    Registra fechas de transición operativa.
    No inventa fechas al clasificar (el caller no debe llamar esto en classify).
    No borra diagnosed_at/quoted_at en reopen.
    """
    now = now or timezone.now()
    if to_state_id == 'diagnosed' and not ticket.diagnosed_at:
        ticket.diagnosed_at = now
        # Compatibilidad legacy: started_at si aún vacío
        if not ticket.started_at:
            ticket.started_at = now
    elif to_state_id == 'quoted' and not ticket.quoted_at:
        ticket.quoted_at = now
        if not ticket.resolved_at:
            ticket.resolved_at = now
    elif to_state_id == 'closed' and not ticket.closed_at:
        ticket.closed_at = now


def transition_ticket(ticket, action, *, resolution_notes=None):
    """
    Aplica diagnose / quote / close.
    Aliases: start→diagnose, resolve→quote.
    """
    if action == 'start':
        action = 'diagnose'
    elif action == 'resolve':
        action = 'quote'

    rule = NORMAL_TRANSITIONS.get(action)
    if not rule:
        raise ValidationError({'action': f'Acción de workflow desconocida: {action}'})

    current = ticket.state_id
    if current not in rule['from']:
        raise ValidationError({
            'state': (
                f'No se puede ejecutar "{action}" desde el estado "{current}". '
                f'Estados permitidos: {sorted(rule["from"])}'
            )
        })

    to_state_id = rule['to']
    ticket.state = _get_state(to_state_id)
    apply_timestamp_for_transition(ticket, to_state_id)

    if action == 'quote' and resolution_notes is not None:
        ticket.resolution_notes = resolution_notes

    ticket.save()
    return ticket


def reopen_ticket(ticket):
    """closed → received. No borra diagnosed_at ni quoted_at."""
    if ticket.state_id != 'closed':
        raise ValidationError({
            'state': 'Solo se puede reabrir un ticket en estado closed',
        })
    ticket.state = _get_state('received')
    # closed_at se conserva como histórico; no se limpia diagnosed/quoted
    ticket.save()
    return ticket


def classify_ticket(ticket, to_state_id):
    """
    Legacy → operativo. No inventa fechas ni modifica otros campos.
    """
    if not is_legacy(ticket.state_id):
        raise ValidationError({
            'state': (
                f'Solo tickets legacy pueden clasificarse. '
                f'Estado actual: "{ticket.state_id}"'
            )
        })
    if to_state_id not in OPERATIONAL_STATES:
        raise ValidationError({
            'state': (
                f'Clasificación inválida "{to_state_id}". '
                f'Debe ser uno de: {sorted(OPERATIONAL_STATES)}'
            )
        })
    ticket.state = _get_state(to_state_id)
    # Sin apply_timestamp_for_transition: classify no inventa fechas
    ticket.save(update_fields=['state', 'updated_at'])
    return ticket
