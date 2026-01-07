# Integraciones (Backend + Frontend)

Este documento resume las integraciones actuales del monorepo y cómo configurarlas de forma segura y consistente.

## Mapa de integraciones

| Integración | Código | Endpoints / Uso | Variables de entorno | Riesgos / Mejoras |
| --- | --- | --- | --- | --- |
| Autenticación JWT (SimpleJWT) | `Backend/config/settings.py`, `users/` | Backend expone `/api/token/`, `/api/token/refresh/`; usado en frontend vía `apiClient` | `SECRET_KEY`, `DEBUG` | Asegurar `DEBUG=False` en prod y rotar `SECRET_KEY`; revisar expiración según negocio |
| Emails SMTP | `Backend/config/settings.py`, `contacts/emails.py`, `quotes/emails.py`, `tickets/emails.py` | Envío de notificaciones (contactos, tickets, etc.) | `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`, `DEFAULT_FROM_NAME`, `BUSINESS_*` | Usar contraseñas de aplicación; no registrar secretos; habilitar backend consola en dev |
| Descarga de imágenes de productos | `Backend/products/importer.py`, `Backend/integrations/http/` | Import CSV/Excel (`/products/bulk-upload/`) descarga imágenes externas | `ENABLE_PRODUCT_IMAGE_DOWNLOADS`, `PRODUCT_IMAGE_HOST_ALLOWLIST`, `INTEGRATION_HTTP_TIMEOUT`, `INTEGRATION_HTTP_RETRIES`, `PRODUCT_IMAGE_MAX_BYTES` | SSRF/descargas no deseadas mitigadas con allowlist y límite de tamaño; mantener lista de hosts confiables |
| Adjuntos binarios | `Backend/attachments/` | `/attachments/` para guardar/servir binarios (Base64 desde frontend) | (sin vars dedicadas) | Base64 puede inflar tamaño; considerar límites de tamaño en vistas si crece el uso |
| Frontend API Client | `Frontend/src/api/client.ts`, `Frontend/src/lib/api/` | Consumo de API con refresh de token y SDK interno de productos | `VITE_API_BASE_URL` | Mantener URL correcta por entorno; manejar errores normalizados |
| CORS / Frontend URL | `Backend/config/settings.py` | CORS permite `localhost`/`127.0.0.1` con puertos comunes | `FRONTEND_PORT`, `ALLOWED_HOSTS` | Ajustar hosts/puertos reales en prod |

## Convención de capa de integraciones (backend)

Se agregó un paquete ligero en `Backend/integrations/http/`:

- `client.py`: cliente `HttpClient` con timeouts, retries, allowlist de hosts y control de tamaño.
- `errors.py`: excepciones específicas.
- `schemas.py`: DTO de respuesta binaria.

Uso (ejemplo):

```python
from integrations.http import HttpClient

client = HttpClient(
    timeout=15,
    retries=2,
    allowed_hosts=['cdn.ejemplo.com'],
    max_bytes=5*1024*1024,
)
binary = client.fetch_binary("https://cdn.ejemplo.com/imagen.jpg")
```

## Integraciones en `products`

- **Bulk import**: endpoint `/products/bulk-upload/` (solo admin) importa CSV/XLSX, crea marcas/categorías y specs. Si se indica `image_url`, descarga la imagen con `HttpClient` usando:
  - `ENABLE_PRODUCT_IMAGE_DOWNLOADS` (flag global on/off).
  - `PRODUCT_IMAGE_HOST_ALLOWLIST` (coma, vacío = permitir cualquier host http/https).
  - `PRODUCT_IMAGE_MAX_BYTES` (límite de tamaño en bytes).
  - `INTEGRATION_HTTP_TIMEOUT`, `INTEGRATION_HTTP_RETRIES`.
- Relaciones de productos se crean a partir de `related_product_codes`.

## Capa API en frontend

- Wrapper HTTP con refresh JWT: `Frontend/src/api/client.ts`.
- SDK de productos centralizado: `Frontend/src/lib/api/products.ts` (brands, categories, products, specs) con endpoints normalizados y manejo de errores consistente.
- Los slices y hooks de productos/categorías/marcas/especificaciones usan este SDK.

## Variables de entorno relevantes

Backend:
- `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
- `DEFAULT_FROM_EMAIL`, `DEFAULT_FROM_NAME`, `BUSINESS_EMAIL`, `BUSINESS_NAME`, `BUSINESS_PHONE`, `BUSINESS_ADDRESS`, `QUOTE_RESPONSE_TIME`
- `FRONTEND_PORT`
- `INTEGRATION_HTTP_TIMEOUT`, `INTEGRATION_HTTP_RETRIES`, `PRODUCT_IMAGE_MAX_BYTES`, `PRODUCT_IMAGE_HOST_ALLOWLIST`, `ENABLE_PRODUCT_IMAGE_DOWNLOADS`

Frontend:
- `VITE_API_BASE_URL`

## Cómo probar en desarrollo

1. Copiar `.env.example` a `.env` y ajustar `VITE_API_BASE_URL`/DB/email si es necesario.
2. Levantar stack: `./scripts/dev-up.sh` (usa `docker-compose.dev.yml`).
3. Probar autenticación y refresh: login en frontend, verificar peticiones con bearer.
4. Probar `/products/bulk-upload/` con `skip_downloads=true` y luego con URLs permitidas según `PRODUCT_IMAGE_HOST_ALLOWLIST`.
5. Verificar correos en consola (`EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend`).

## Checklist producción

- `DEBUG=False`, `ALLOWED_HOSTS` configurado.
- `SECRET_KEY` único y secreto.
- SMTP real configurado (`EMAIL_*`, `DEFAULT_FROM_*`, `BUSINESS_*`).
- `VITE_API_BASE_URL` apuntando al dominio/API real.
- Definir `PRODUCT_IMAGE_HOST_ALLOWLIST` (hosts confiables) y `PRODUCT_IMAGE_MAX_BYTES` acorde CDN.
- Revisar certificados TLS y reverse proxy en `docker-compose.prod.yml`/Nginx.

## Ejemplos de requests/responses (products)

- `GET /products/list/?page=1&page_size=20`
  - Respuesta 200:
    ```json
    {
      "count": 1,
      "next": null,
      "previous": null,
      "results": [
        {
          "id": "uuid",
          "product_code": "abc-123",
          "name": "Producto demo",
          "brand": "Marca",
          "category": "Categoría",
          "description": "",
          "image_attachment": null,
          "is_active": true,
          "created_at": "2024-01-01 10:00:00",
          "updated_at": "2024-01-01 10:00:00",
          "specs": [],
          "related_products": []
        }
      ]
    }
    ```

- `POST /products/bulk-upload/` (solo admin)
  - multipart/form-data: `csv_file` (CSV/XLSX), `encoding` (opcional), `create_missing` (bool), `skip_downloads` (bool).
  - Respuesta 200:
    ```json
    {
      "created_brands": 1,
      "created_categories": 2,
      "created_attachments": 1,
      "created_products": 1,
      "updated_products": 0,
      "created_specs": 2,
      "updated_specs": 0,
      "created_relations": 0,
      "errors": []
    }
    ```

