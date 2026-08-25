"""
Autenticación JWT opcional para endpoints públicos de catálogo.

Problema que resuelve:
  Los endpoints de lectura pública (productos, categorías, marcas) usan
  permisos tipo ``IsReadOnlyOrAdmin`` que permiten GET anónimo, pero en DRF
  la autenticación se ejecuta ANTES que los permisos. Si el navegador de un
  visitante envía un ``Authorization: Bearer <token vencido>``, JWTAuthentication
  lanza ``AuthenticationFailed`` y DRF responde 401 — rompiendo el catálogo
  aunque la lectura debería ser pública.

Solución:
  ``OptionalJWTAuthentication`` trata los tokens inválidos/expirados como
  anónimos en peticiones de LECTURA (GET/HEAD/OPTIONS) en lugar de responder
  401. En peticiones de ESCRITURA (POST/PUT/PATCH/DELETE) mantiene el
  comportamiento estricto (401), preservando el flujo de refresh para
  usuarios autenticados.
"""
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication


class OptionalJWTAuthentication(JWTAuthentication):
    """JWT que tolera tokens inválidos/expirados en métodos de solo lectura."""

    def authenticate(self, request):
        # Métodos seguros (lectura): token inválido == anónimo, no 401.
        if request.method in {"GET", "HEAD", "OPTIONS"}:
            try:
                return super().authenticate(request)
            except AuthenticationFailed:
                return None
        # Escrituras: comportamiento estricto (401 si el token no vale).
        return super().authenticate(request)
