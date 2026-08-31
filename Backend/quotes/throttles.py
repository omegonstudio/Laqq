"""Límites de tasa para POST público de cotizaciones (anónimos)."""
from rest_framework.settings import api_settings
from rest_framework.throttling import AnonRateThrottle


def get_client_ip(request):
    """Misma lógica que DRF BaseThrottle.get_ident + NUM_PROXIES."""
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    remote_addr = request.META.get('REMOTE_ADDR')
    num_proxies = api_settings.NUM_PROXIES

    if num_proxies is not None:
        if num_proxies == 0 or xff is None:
            return remote_addr
        addrs = xff.split(',')
        client_addr = addrs[-min(num_proxies, len(addrs))]
        return client_addr.strip()

    return ''.join(xff.split()) if xff else remote_addr


class QuoteAnonBurstThrottle(AnonRateThrottle):
    scope = 'quote_anon_burst'

    def allow_request(self, request, view):
        if getattr(request.user, 'is_authenticated', False):
            return True
        return super().allow_request(request, view)


class QuoteAnonHourThrottle(AnonRateThrottle):
    scope = 'quote_anon_hour'

    def allow_request(self, request, view):
        if getattr(request.user, 'is_authenticated', False):
            return True
        return super().allow_request(request, view)
