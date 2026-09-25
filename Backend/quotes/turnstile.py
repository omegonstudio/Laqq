"""Verificación de Cloudflare Turnstile para cotizaciones públicas."""
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'


def is_turnstile_enabled():
    """Activo si hay secret. override_settings(TURNSTILE_SECRET_KEY=...) alcanza en tests."""
    if getattr(settings, 'TURNSTILE_ENABLED', True) is False:
        return False
    return bool(getattr(settings, 'TURNSTILE_SECRET_KEY', ''))


def verify_turnstile_token(token, remote_ip=None):
    """POST a siteverify. True si Cloudflare acepta el token."""
    if not is_turnstile_enabled():
        return True
    if not token or not str(token).strip():
        return False

    payload = {
        'secret': settings.TURNSTILE_SECRET_KEY,
        'response': str(token).strip(),
    }
    if remote_ip:
        payload['remoteip'] = remote_ip

    timeout = getattr(settings, 'INTEGRATION_HTTP_TIMEOUT', 10)
    try:
        response = requests.post(TURNSTILE_VERIFY_URL, data=payload, timeout=timeout)
        response.raise_for_status()
        data = response.json()
        return bool(data.get('success'))
    except (requests.RequestException, ValueError):
        logger.exception('Turnstile siteverify failed')
        return False
