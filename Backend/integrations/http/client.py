import logging
from pathlib import Path
from typing import Iterable, Optional, Set
from urllib.parse import urlparse

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from .errors import HttpClientConfigError, HttpClientError, HttpClientResponseError
from .schemas import HttpBinaryResponse

logger = logging.getLogger(__name__)


class HttpClient:
    """
    Cliente HTTP pequeño con validación de host, timeout y retries.
    Pensado para descargas controladas (imágenes, archivos estáticos).
    """

    def __init__(
        self,
        *,
        timeout: int = 15,
        retries: int = 2,
        backoff_factor: float = 0.5,
        allowed_hosts: Optional[Iterable[str]] = None,
        max_bytes: Optional[int] = 5 * 1024 * 1024,
    ) -> None:
        self.timeout = timeout
        self.allowed_hosts: Optional[Set[str]] = {h.strip().lower() for h in allowed_hosts} if allowed_hosts else None
        self.max_bytes = max_bytes

        retry_cfg = Retry(
            total=retries,
            status_forcelist=[429, 500, 502, 503, 504],
            backoff_factor=backoff_factor,
            allowed_methods=["GET", "HEAD"],
            raise_on_status=False,
        )
        adapter = HTTPAdapter(max_retries=retry_cfg)
        self.session = requests.Session()
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

    def _validate_url(self, url: str) -> None:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            raise HttpClientConfigError("Solo se permiten URLs http/https")
        hostname = (parsed.hostname or "").lower()
        if self.allowed_hosts is not None and hostname not in self.allowed_hosts:
            raise HttpClientConfigError(f"Host no permitido para descargas: {hostname}")

    def fetch_binary(self, url: str) -> HttpBinaryResponse:
        self._validate_url(url)

        try:
            response = self.session.get(url, timeout=self.timeout, stream=True)
        except requests.RequestException as exc:
            raise HttpClientError(f"Error de red al descargar {url}: {exc}") from exc

        if response.status_code >= 400:
            raise HttpClientResponseError(
                status_code=response.status_code,
                message=f"Respuesta {response.status_code} al descargar {url}",
            )

        content_type = response.headers.get("Content-Type", "") or "application/octet-stream"
        filename = Path(urlparse(url).path).name or None

        content = bytearray()
        for chunk in response.iter_content(chunk_size=64 * 1024):
            if not chunk:
                continue
            content.extend(chunk)
            if self.max_bytes and len(content) > self.max_bytes:
                raise HttpClientResponseError(
                    status_code=response.status_code,
                    message=f"Archivo excede el límite configurado ({self.max_bytes} bytes)",
                )

        logger.debug("Descarga OK %s (%s bytes)", url, len(content))
        return HttpBinaryResponse(content=bytes(content), content_type=content_type, filename=filename)

