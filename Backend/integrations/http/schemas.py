from dataclasses import dataclass
from typing import Optional


@dataclass
class HttpBinaryResponse:
    """Respuesta binaria básica para descargas (imagenes, archivos)."""

    content: bytes
    content_type: str
    filename: Optional[str] = None

