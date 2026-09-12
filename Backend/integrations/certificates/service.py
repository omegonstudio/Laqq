"""Proxy de búsqueda de certificados Fisher / Solstice.

Contratos tomados de research_certificates.md (Scrapling) — no inventar params.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from django.conf import settings

from integrations.http import HttpClient
from integrations.http.errors import (
    HttpClientConfigError,
    HttpClientError,
    HttpClientResponseError,
)

FISHER_SEARCH_URL = (
    "https://www.fishersci.com/api/store/Assets/Documents/Certificates/v2/search"
)
FISHER_DOCUMENTS_HOST = "https://documents.fishersci.com"

SOLSTICE_SEARCH_URL = (
    "https://www.solstice.com/content/advancedmaterials/us/en/coa/"
    "jcr:content/root/responsivegrid/responsivegrid_93863770/"
    "coa_table.orderstatussearch"
)
SOLSTICE_ORIGIN = "https://www.solstice.com"
SOLSTICE_EDAM_ORIGIN = "https://prod-edam.solstice.com"

ALLOWED_HOSTS = ("www.fishersci.com", "www.solstice.com")


class CertificateSearchError(Exception):
    def __init__(self, message: str, *, status_code: int = 400):
        self.status_code = status_code
        super().__init__(message)


def _http_client() -> HttpClient:
    timeout = int(getattr(settings, "INTEGRATION_HTTP_TIMEOUT", 15) or 15)
    retries = int(getattr(settings, "INTEGRATION_HTTP_RETRIES", 2) or 2)
    return HttpClient(
        timeout=timeout,
        retries=retries,
        allowed_hosts=ALLOWED_HOSTS,
        max_bytes=2 * 1024 * 1024,
    )


def _fisher_asset_url(path: Optional[str]) -> Optional[str]:
    if not path:
        return None
    if path.startswith("http://") or path.startswith("https://"):
        return path
    return f"{FISHER_DOCUMENTS_HOST}/{path.lstrip('/')}"


def _normalize_fisher(payload: Dict[str, Any]) -> Dict[str, Any]:
    results: List[Dict[str, Any]] = []
    for asset_type in payload.get("assetTypes") or []:
        for doc_type in asset_type.get("documentTypes") or []:
            for asset in doc_type.get("assets") or []:
                results.append(
                    {
                        "id": asset.get("id"),
                        "title": asset.get("title") or asset.get("fileName") or "",
                        "lotNumber": asset.get("lotNumber") or "",
                        "documentType": asset.get("documentType")
                        or doc_type.get("value")
                        or "",
                        "fileName": asset.get("fileName") or "",
                        "url": _fisher_asset_url(asset.get("path")),
                        "publishDate": asset.get("publishDate"),
                        "productTitles": asset.get("productTitles") or [],
                    }
                )
    return {
        "provider": "fisher",
        "message": payload.get("message") or "",
        "results": results,
    }


def _normalize_solstice(payload: Dict[str, Any]) -> Dict[str, Any]:
    search_results = payload.get("search_results") or {}
    meta = search_results.get("meta") or {}
    results: List[Dict[str, Any]] = []
    for item in search_results.get("results") or []:
        url_raw = ((item.get("url") or {}).get("raw")) or ""
        if url_raw and not url_raw.startswith("http"):
            url = f"{SOLSTICE_EDAM_ORIGIN}{url_raw}"
        else:
            url = url_raw or None
        results.append(
            {
                "id": ((item.get("id") or {}).get("raw"))
                or ((item.get("_meta") or {}).get("id")),
                "title": ((item.get("title") or {}).get("raw")) or "",
                "lotNumber": ((item.get("batch_number") or {}).get("raw")) or "",
                "documentType": ((item.get("document_type") or {}).get("raw")) or "COA",
                "fileName": url_raw.rsplit("/", 1)[-1] if url_raw else "",
                "url": url,
                "publishDate": ((item.get("modified_date") or {}).get("raw")),
                "productTitles": [],
            }
        )
    page = meta.get("page") or {}
    message = ""
    total = page.get("total_results")
    if total is not None:
        message = f"Se encontraron {total} resultado(s)."
    elif results:
        message = f"Se encontraron {len(results)} resultado(s)."
    else:
        message = "No se encontraron certificados."
    return {
        "provider": "solstice",
        "message": message,
        "results": results,
    }


def search_fisher(*, article_no: str, lot_no: Optional[str] = None) -> Dict[str, Any]:
    sku = (article_no or "").strip()
    if len(sku) < 2:
        raise CertificateSearchError(
            "Fisher requiere Número de Artículo (mínimo 2 caracteres)."
        )

    params: Dict[str, Any] = {
        "skus": sku,
        "targetSite": "FSUS",
        "country": "US",
        "languages": "en",
        "erpType": "MF_US",
        "pageNo": "1",
        "rpp": "15",
        "sortBy": "publishDate",
        "sortType": "DESC",
        "partialSkuSearch": "true",
        "partialLotNumber": "false",
    }
    lot = (lot_no or "").strip()
    if lot:
        params["lotNumbers"] = lot

    client = _http_client()
    try:
        payload = client.request_json("GET", FISHER_SEARCH_URL, params=params)
    except HttpClientResponseError as exc:
        raise CertificateSearchError(
            f"Fisher respondió con error ({exc.status_code}).",
            status_code=502,
        ) from exc
    except (HttpClientConfigError, HttpClientError) as exc:
        raise CertificateSearchError(str(exc), status_code=502) from exc

    if not isinstance(payload, dict):
        raise CertificateSearchError("Respuesta inválida de Fisher.", status_code=502)
    return _normalize_fisher(payload)


def search_solstice(*, lot_no: str) -> Dict[str, Any]:
    lot = (lot_no or "").strip()
    if not lot:
        raise CertificateSearchError("Solstice requiere Número de Lote.")

    payload_obj = {
        "query": f'"{lot}"',
        "filters": {"all": [{"document_type": "COA"}]},
        "search_fields": {"batch_number": {"weight": 5}},
        "sort": [{"title": "desc"}],
        "page": {"current": 1, "size": 5},
    }
    form = {
        "payload": json.dumps(payload_obj, separators=(",", ":")),
        "tenantPath": "/content/advancedmaterials",
        "langMap": "advancedmaterials:en",
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Referer": f"{SOLSTICE_ORIGIN}/us/en/coa",
        "Origin": SOLSTICE_ORIGIN,
    }

    client = _http_client()
    try:
        payload = client.request_json(
            "POST",
            SOLSTICE_SEARCH_URL,
            data=form,
            headers=headers,
        )
    except HttpClientResponseError as exc:
        raise CertificateSearchError(
            f"Solstice respondió con error ({exc.status_code}).",
            status_code=502,
        ) from exc
    except (HttpClientConfigError, HttpClientError) as exc:
        raise CertificateSearchError(str(exc), status_code=502) from exc

    if not isinstance(payload, dict):
        raise CertificateSearchError("Respuesta inválida de Solstice.", status_code=502)
    return _normalize_solstice(payload)


def search_certificates(
    *,
    provider: str,
    article_no: Optional[str] = None,
    lot_no: Optional[str] = None,
) -> Dict[str, Any]:
    provider_key = (provider or "").strip().lower()
    if provider_key == "fisher":
        return search_fisher(article_no=article_no or "", lot_no=lot_no)
    if provider_key == "solstice":
        return search_solstice(lot_no=lot_no or "")
    raise CertificateSearchError("Proveedor no soportado. Usá 'fisher' o 'solstice'.")
