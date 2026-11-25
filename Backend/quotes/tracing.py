"""
Trazabilidad de cotizaciones: snapshots y registro de eventos.
"""
from __future__ import annotations

from decimal import Decimal
from typing import Any, Optional

from django.db import transaction
from django.utils import timezone

from .models import Quote, QuoteTrace

# Catálogo vigente de estados de cotización.
QUOTE_STATE_IDS = {
    'abierto',
    'enviado',
    'enviado_fuera',
    'aceptado',
    'rechazado',
    'cerrado',
}

# Transiciones permitidas desde el BO: todos los estados son modificables.
ALLOWED_STATE_TRANSITIONS = {
    state_id: set(QUOTE_STATE_IDS) - {state_id}
    for state_id in QUOTE_STATE_IDS
}


def _json_safe(value: Any) -> Any:
    if isinstance(value, Decimal):
        return str(value)
    if hasattr(value, 'isoformat'):
        try:
            return value.isoformat()
        except Exception:
            return str(value)
    return value


def _user_ref(user) -> Optional[dict]:
    if not user:
        return None
    return {
        'id': str(user.pk),
        'username': getattr(user, 'username', '') or '',
        'email': getattr(user, 'email', '') or '',
        'full_name': (
            f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip()
            or getattr(user, 'username', '')
            or getattr(user, 'email', '')
        ),
    }


def build_light_snapshot(
    quote: Quote,
    *,
    changes: Optional[dict] = None,
) -> dict:
    """Snapshot liviano: estado, responsable, totales, diffs opcionales."""
    contact = quote.contact
    return {
        'kind': 'light',
        'quote_number': quote.quote_number,
        'state_id': quote.state_id,
        'state_name': getattr(quote.state, 'name', None),
        'user': _user_ref(quote.user),
        'total_amount': _json_safe(quote.total_amount),
        'currency': quote.currency,
        'contact': {
            'id': str(contact.pk) if contact else None,
            'email': getattr(contact, 'email', None),
            'company_name': getattr(contact, 'company_name', None),
            'first_name': getattr(contact, 'first_name', None),
            'last_name': getattr(contact, 'last_name', None),
        },
        'changes': changes or {},
    }


def build_full_snapshot(quote: Quote) -> dict:
    """Snapshot completo al enviar: cabecera + ítems + specs."""
    light = build_light_snapshot(quote)
    items = []
    for item in quote.quoteitem_set.select_related('product', 'variant').all():
        product = item.product
        variant = item.variant
        items.append({
            'id': str(item.pk),
            'product_id': str(product.pk) if product else None,
            'product_code': getattr(product, 'product_code', None),
            'product_name': getattr(product, 'name', None),
            'variant_id': str(variant.pk) if variant else None,
            'variant_code': getattr(variant, 'code', None),
            'variant_name': getattr(variant, 'name', None),
            'quantity': item.quantity,
            'unit_price': _json_safe(item.unit_price),
            'subtotal': _json_safe(item.subtotal),
        })
    return {
        **light,
        'kind': 'full',
        'message': quote.message,
        'observaciones': quote.observaciones,
        'specs': quote.specs or {},
        'quote_type_id': quote.quote_type_id,
        'items': items,
    }


def mark_quote_managed(quote: Quote) -> None:
    """Pasa la cotización a 'En gestión' sin crear un evento visible."""
    if quote.managed_at is not None:
        return
    Quote.objects.filter(pk=quote.pk, managed_at__isnull=True).update(
        managed_at=timezone.now()
    )
    quote.refresh_from_db(fields=['managed_at'])


@transaction.atomic
def record_quote_trace(
    quote: Quote,
    reason: str,
    *,
    actor=None,
    snapshot: Optional[dict] = None,
    mark_managed: Optional[bool] = None,
) -> QuoteTrace:
    """
    Persiste un evento de trazabilidad.
    mark_managed: por defecto True si reason ∈ MANAGEMENT_REASONS.
    """
    if mark_managed is None:
        mark_managed = reason in QuoteTrace.MANAGEMENT_REASONS

    if snapshot is None:
        if reason == QuoteTrace.REASON_SENT:
            snapshot = build_full_snapshot(quote)
        else:
            snapshot = build_light_snapshot(quote)

    trace = QuoteTrace.objects.create(
        quote=quote,
        reason=reason,
        actor=actor if getattr(actor, 'is_authenticated', False) else None,
        snapshot=snapshot,
    )

    if mark_managed:
        mark_quote_managed(quote)

    return trace


def can_transition_state(from_id: str, to_id: str) -> bool:
    if from_id == to_id:
        return True
    allowed = ALLOWED_STATE_TRANSITIONS.get(from_id)
    if allowed is None:
        # Estado desconocido: permitir para no bloquear datos legacy
        return True
    return to_id in allowed


def next_version_meta(quote: Quote) -> dict:
    """Calcula el próximo version_number / version_label sin persistir."""
    from django.db.models import Max
    from .models import QuoteVersion

    current_max = (
        QuoteVersion.objects.filter(quote=quote).aggregate(m=Max('version_number')).get('m')
        or 0
    )
    number = current_max + 1
    label = f'{quote.quote_number}-{number}'
    return {'version_number': number, 'version_label': label}


def create_quote_version(
    quote: Quote,
    *,
    pdf_file=None,
    reason: str = 'saved',
    actor=None,
) -> 'QuoteVersion':
    """
    Crea la siguiente versión con snapshot completo y PDF opcional.
    Marca la cotización como gestionada.
    """
    from .models import QuoteVersion

    meta = next_version_meta(quote)
    version = QuoteVersion.objects.create(
        quote=quote,
        version_number=meta['version_number'],
        version_label=meta['version_label'],
        reason=reason,
        actor=actor if getattr(actor, 'is_authenticated', False) else None,
        snapshot=build_full_snapshot(quote),
    )
    if pdf_file is not None:
        filename = getattr(pdf_file, 'name', None) or f'{version.version_label}.pdf'
        version.pdf.save(filename, pdf_file, save=True)

    mark_quote_managed(quote)
    return version
