"""
Helper para enviar emails vía Resend API.

Comportamiento:
- Si RESEND_API_KEY está configurada en settings, envía usando la API de Resend.
- Si no está configurada, lanza RuntimeError (no se usa SMTP ni fallback).
"""
import base64
import logging
from typing import List, Optional

import requests
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)


def _extract_html_from_email(email: EmailMultiAlternatives) -> Optional[str]:
    """
    Extrae contenido HTML de EmailMultiAlternatives.alternatives si existe.
    alternatives suele ser lista de tuplas (content, mimetype).
    """
    for alt in getattr(email, "alternatives", []) or []:
        try:
            content, mimetype = alt[0], alt[1]
        except Exception:
            continue
        if mimetype and mimetype.lower().startswith("text/html"):
            return content
    return None


def _build_attachments_payload(attachments) -> List[dict]:
    """
    Convierte attachments de Django Email a la estructura esperada por Resend:
    [{ "name": "file.pdf", "data": "<base64>", "type": "application/pdf" }, ...]
    Django admite attachments como:
      - list de tuplas (filename, content, mimetype)
      - objetos MIME (no manejados aquí)
    Ignoramos tipos no soportados para no romper el envío principal.
    """
    payload = []
    if not attachments:
        return payload

    for att in attachments:
        # att puede ser (filename, content, mimetype) ó (filename, content)
        if isinstance(att, (list, tuple)) and len(att) >= 2:
            filename = att[0]
            content = att[1]
            mimetype = att[2] if len(att) >= 3 else "application/octet-stream"

            try:
                if isinstance(content, str):
                    content_bytes = content.encode("utf-8")
                else:
                    content_bytes = content
                b64 = base64.b64encode(content_bytes).decode("ascii")
                payload.append(
                    {
                        "name": filename,
                        "data": b64,
                        "type": mimetype or "application/octet-stream",
                    }
                )
            except Exception as e:
                logger.warning("Skipping attachment %s due to error encoding: %s", filename, e)
                continue
        else:
            # No soportado (ej. EmailMessage._attachments MIME objects) -> ignorar
            logger.debug("Attachment type not supported for resend API, skipping: %r", type(att))
            continue

    return payload


def send_via_resend(email: EmailMultiAlternatives, timeout: int = 15) -> bool:
    """
    Envía el EmailMultiAlternatives usando la API de Resend.
    Lanza requests.HTTPError si la API responde error (resp.raise_for_status()).
    Retorna True si el envío fue aceptado (2xx).
    """
    api_key = getattr(settings, "RESEND_API_KEY", None)
    if not api_key or not str(api_key).strip():
        raise RuntimeError("RESEND_API_KEY no configurada")

    url = "https://api.resend.com/emails"

    html = _extract_html_from_email(email)
    text = email.body or None

    payload = {
        "from": email.from_email,
        "to": list(email.to) if isinstance(email.to, (list, tuple)) else [email.to],
        "subject": email.subject,
    }
    if html:
        payload["html"] = html
    if text:
        payload["text"] = text

    # attachments
    attachments_payload = _build_attachments_payload(getattr(email, "attachments", None) or [])
    if attachments_payload:
        payload["attachments"] = attachments_payload

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    logger.debug(
        "Sending email via Resend to=%s subject=%s attachments=%d",
        payload.get("to"),
        payload.get("subject"),
        len(attachments_payload),
    )

    resp = requests.post(url, headers=headers, json=payload, timeout=timeout)

    # Si no es 2xx raise_for_status() generará requests.HTTPError
    if 200 <= resp.status_code < 300:
        logger.info(
            "Email sent via Resend to=%s subject=%s status=%s",
            payload.get("to"),
            payload.get("subject"),
            resp.status_code,
        )
        return True

    logger.error("Resend API error status=%s body=%s", resp.status_code, resp.text)
    resp.raise_for_status()
    return False


def send_email_message(email: EmailMultiAlternatives) -> bool:
    """
    Entry point: envía usando Resend. NO realiza fallback a SMTP.
    - Si RESEND_API_KEY está configurada envía por Resend.
    - Si no está configurada lanza RuntimeError para evitar intento SMTP.
    """
    api_key = getattr(settings, "RESEND_API_KEY", None)
    if api_key and str(api_key).strip():
        return send_via_resend(email)

    msg = (
        "RESEND_API_KEY no configurada. Configure RESEND_API_KEY en el entorno para enviar emails "
        "(el envío por SMTP está deshabilitado)."
    )
    logger.error(msg)
    raise RuntimeError(msg)