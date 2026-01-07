class HttpClientError(Exception):
    """Error de red o configuración al consumir HTTP externo."""


class HttpClientConfigError(HttpClientError):
    """La petición no cumple con políticas locales (host, esquema, etc.)."""


class HttpClientResponseError(HttpClientError):
    """El servidor remoto respondió con error o payload inválido."""

    def __init__(self, status_code: int, message: str = ""):
        self.status_code = status_code
        super().__init__(message or f"Respuesta HTTP {status_code}")

