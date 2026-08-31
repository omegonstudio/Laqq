# Anti-spam en cotizaciones

Documento para revisar **antes** de implementar. Si algo no cierra, se cambia acá y después se codea.

## Problema

En agosto 2026 un bot pegó directo a:

```
POST /quotes/list/from-package/
```

Sin login, sin captcha, sin límite de tasa. Resultado: ~50 cotizaciones en el mismo minuto (`sample@email.tst`, nombre `e`, tipo Equipo, estado Pendiente). Cada alta dispara email al negocio y al “cliente”.

Causa: `CanCreateOrAdmin` deja pasar **cualquier POST** anónimo. El formulario público (`QuoteForm`) llama a ese endpoint y no hay desafío ni throttle.

Un widget solo en el front **no alcanza**. El bot no usa el formulario: pega JSON a la API. El token hay que validarlo en el backend.

## Decisión

**Cloudflare Turnstile** (validado en servidor) **+ límite por IP**.

No se usa Google reCAPTCHA. Turnstile es gratis, con poco fricción, y el throttle es lo que hubiera cortado el flood de 50 POST/minuto.

## Cómo queda el flujo

```
Usuario llena el form
        │
        ▼
Turnstile (Cloudflare) → token
        │
        ▼
POST /quotes/list/from-package/
  body: contacto + items + turnstile_token
        │
        ├─ 1. Throttle por IP (anónimos)
        │     3/min y 8/hora  → 429 si se pasa
        ├─ 2. Verificar token con Cloudflare (secret)
        │     falta / inválido → 400, no se crea Quote
        └─ 3. QuotePackageSerializer (como hoy)
              + rechazo de TLDs de prueba (.tst, .test, …)
```

Staff autenticado (JWT) **no** necesita Turnstile: el backoffice no usa este form. El formulario público de la web sí, siempre.

## Qué se toca

### Backend

| Archivo | Qué |
| --- | --- |
| `Backend/config/settings.py` | `TURNSTILE_SECRET_KEY`, `TURNSTILE_ENABLED` (activo si hay secret). `NUM_PROXIES = 1` y rates en `REST_FRAMEWORK`. |
| `Backend/quotes/turnstile.py` (nuevo) | `verify_turnstile_token(token, ip)` → POST a `https://challenges.cloudflare.com/turnstile/v0/siteverify`. |
| `Backend/quotes/throttles.py` (nuevo) | Throttles anónimos solo para `from-package`: 3/min y 8/hora. |
| `Backend/quotes/views.py` | En `create_from_package`: throttle en la action; si el user **no** está autenticado, exigir y verificar `turnstile_token`; sacarlo de `request.data` **antes** de `QuotePackageSerializer`. |
| `Backend/quotes/serializers.py` | En `validate_contact`, rechazar TLDs `.tst` `.test` `.invalid` `.example` `.localhost`. |
| `Backend/quotes/tests.py` | Cliente **sin** auth: sin token → 400; token malo → 400; token OK (mock) → 201; más de N POST → 429; staff autenticado sin token → 201. |

Nginx ya manda `X-Forwarded-For` / `X-Real-IP` (`Frontend/nginx.conf`). Sin `NUM_PROXIES = 1`, un bot puede rotar el header y **esquivar** el throttle.

Gunicorn tiene 3 workers y el cache de Django es por proceso: el límite es **aproximado** (hasta ~3×). Alcanza contra un flood. No se agrega Redis.

### Frontend

| Archivo | Qué |
| --- | --- |
| `Frontend/package.json` | Dependencia `@marsidev/react-turnstile`. |
| `Frontend/src/components/molecules/QuoteForm.tsx` | Widget encima del submit. Site key: `VITE_TURNSTILE_SITE_KEY`. Botón deshabilitado hasta tener token; si expira, se pide de nuevo. |
| `Frontend/src/types/api.ts` | `turnstile_token` en el payload de envío. |
| `Frontend/src/lib/api/quotes.ts` | Lo manda en `createFromForm`. |
| `Frontend/Dockerfile.prod` | `ARG`/`ENV` `VITE_TURNSTILE_SITE_KEY` (Vite lo hornea en el build). |
| `docker-compose.prod.yml` | `args` de build, igual que `VITE_API_BASE_URL`. |

**Sin rebuild del frontend la site key no existe en prod.**

### Env / docs

| Archivo | Qué |
| --- | --- |
| `env.example` | `TURNSTILE_SECRET_KEY` y `VITE_TURNSTILE_SITE_KEY`. |
| `README.md` | Una fila en la tabla de variables. |

## Variables

Local / tests (siempre pasan, keys oficiales de Cloudflare):

```
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

Producción (dashboard de Cloudflare → Turnstile, hostnames `laqq.com.ar` y `www.laqq.com.ar`):

```
VITE_TURNSTILE_SITE_KEY=<site key real>
TURNSTILE_SECRET_KEY=<secret real>
```

- Secret: solo backend (`.env`, no se commitea).
- Site key: pública, va en el JS del front en **build time**.

Si en prod no hay secret, Turnstile queda **apagado** (`TURNSTILE_ENABLED` falso). Eso es un agujero: hay que setearlo antes del deploy.

## Límites (propuestos, se pueden cambiar)

| Quién | Límite |
| --- | --- |
| Anónimo en `from-package` | 3 por minuto **y** 8 por hora, por IP |
| Staff autenticado | Sin este throttle |

Un cliente real pidiendo 2–3 cotizaciones en un rato no debería chocar. Un script de 50 en un minuto sí.

## Tests (criterio de hecho)

Cliente **sin** login contra `POST /quotes/list/from-package/`:

1. Sin `turnstile_token` → 400, no se crea `Quote`.
2. Token inválido (mock `success: false`) → 400.
3. Token OK (mock `success: true`) → 201.
4. Más de 3 POST/minuto (o 8/hora) → 429.
5. Usuario staff autenticado **sin** token → 201 (el backoffice no usa el widget).

## Fuera de alcance (esta pasada)

- Formulario de **contacto** y **tickets**: siguen públicos, mismo riesgo. Se puede copiar el patrón después.
- No se cierra el POST anónimo de `POST /quotes/list/` ni de items. El spam real usó `from-package`. Cerrar el resto es otro cambio de permisos.
- `laqq_user` como superuser de Postgres: no es de este ticket.
- Captcha en el backoffice: no.

## Deploy en el droplet (cuando esté mergeado)

1. Crear el widget Turnstile en Cloudflare (hostnames de Laqq).
2. En `.env` de prod: `TURNSTILE_SECRET_KEY` y `VITE_TURNSTILE_SITE_KEY`.
3. Rebuild **backend y frontend**, recreate. Si no se rebuilda el front, el form no tiene site key.
4. Probar a mano: enviar una cotización real desde `https://laqq.com.ar` y confirmar el widget + mail. Pegar JSON al endpoint sin token tiene que dar 400.

## Preguntas para cerrar antes de codear

1. ¿Los límites 3/min y 8/hora están bien, o preferís otros?
2. ¿Si falta el secret en prod, fallar cerrado (rechazar todo POST anónimo) o dejar pasar? El plan actual **deja pasar** si no hay secret. Más seguro: en `DJANGO_ENV=production` exigir secret y rechazar si no está.
3. ¿Documentar acá el resto de POSTs públicos (`/quotes/list/`, items, contacto, tickets) como follow-up, o no?
