# LaQQ — Checklist Pre-Launch / GO LIVE (SEO)

Documento operativo. El SEO de producción ya está implementado; solo permanece una capa **PRE-LAUNCH** de anti-indexación marcada con comentarios `PRE-LAUNCH` en el código.

---

## Estrategia PRE-LAUNCH (oficial Google)

**Permitir rastreo. Impedir indexación.**

| Mecanismo | Rol |
|-----------|-----|
| `robots.txt` → `Allow: /` | Google **puede** rastrear (crawl) |
| Meta `robots` → `noindex, …` | Señala **no indexar** en HTML |
| `X-Robots-Tag` → `noindex, …` | Misma señal en headers (PDF, media, assets, API HTML) |

### Por qué NO usamos `Disallow: /`

Según la documentación de Google y lo observado en Search Console:

- Si `robots.txt` bloquea el rastreo, Google **no puede leer** el `noindex` (meta ni `X-Robots-Tag`).
- Resultado típico: *“La página se ha indexado aunque un archivo robots.txt la tenía bloqueada.”*
- URLs como `/` y `/login` permanecen en el índice sin poder “enterarse” del noindex.

Por eso la estrategia correcta en pre-lanzamiento es: **rastreable + noindex**.

Buscar en el repo: `PRE-LAUNCH`

---

## Estado actual (Pre-Launch)

| Capa | Valor actual | Archivo |
|------|--------------|---------|
| robots.txt | `Allow: /` (rastreo permitido) | `Frontend/public/robots.txt` |
| Meta robots | `noindex, nofollow, noarchive, nosnippet, noimageindex` | `Frontend/index.html` (una sola definición) |
| X-Robots-Tag | mismo set vía `$x_robots_tag` | `Frontend/nginx.conf` (`/`, `/media`, `/static`, assets, robots, sitemap) |
| Sitemap | archivo listo en `/sitemap.xml`, **no** anunciado en robots.txt | `Frontend/public/sitemap.xml` |
| Swagger | deshabilitado (`ENABLE_API_DOCS=False`) | `Backend/config/urls.py` + `.env` |

---

## Día del GO LIVE — checklist

### Anti-indexación → indexación

- [ ] **robots.txt** — Mantener `Allow: /` y **añadir** la línea Sitemap:
  ```
  User-agent: *
  Allow: /

  Sitemap: https://laqq.omegon.com.ar/sitemap.xml
  ```
  (`Frontend/public/robots.txt`)

- [ ] **Meta robots** — En `Frontend/index.html` cambiar `content` a:
  ```
  index, follow
  ```

- [ ] **X-Robots-Tag** — En `Frontend/nginx.conf` cambiar:
  ```
  set $x_robots_tag "index, follow";
  ```
  (o eliminar todos los `add_header X-Robots-Tag ...` si preferís el default del motor)

- [ ] Redeploy frontend (rebuild imagen nginx) para aplicar HTML + robots + nginx.

### Tras deploy PRE-LAUNCH (este ajuste Allow)

- [ ] Confirmar en vivo: `curl -s http://laqq.omegon.com.ar/robots.txt` → `Allow: /`
- [ ] En Search Console → inspección de URL → **Solicitar indexación** (en realidad: solicitar *rastreo*) de `/` y `/login` para que Google relea el `noindex` y las saque del índice.
- [ ] Usar también **Removals** temporales en Search Console si hace falta acelerar la desaparición de resultados.

### Sitemap y Search Console (GO LIVE)

- [ ] Verificar que `https://laqq.omegon.com.ar/sitemap.xml` responde `200` y `Content-Type` XML.
- [ ] Enviar sitemap en **Google Search Console**.
- [ ] Solicitar indexación de la home y páginas clave (`/`, `/products`, `/company`, `/contact`).
- [ ] Verificar propiedad del dominio en Search Console (DNS o meta).
- [ ] Monitorear cobertura / “Páginas indexadas” las primeras 48–72 h.

### HTTPS / Canonical / Rich results

- [ ] Confirmar **HTTPS** activo (TLS en el droplet o proxy) y redirección HTTP→HTTPS.
- [ ] Verificar canonical home: `https://laqq.omegon.com.ar/`
- [ ] Verificar OG/Twitter con [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) y [Twitter/X Card Validator](https://cards-dev.twitter.com/validator).
- [ ] Probar JSON-LD con [Rich Results Test](https://search.google.com/test/rich-results).
- [ ] Verificar `robots.txt` en vivo y con el tester de Search Console.

### Post deploy smoke

- [ ] `curl -sI https://laqq.omegon.com.ar/ | grep -i x-robots`
- [ ] `curl -s https://laqq.omegon.com.ar/robots.txt`
- [ ] `curl -sI https://laqq.omegon.com.ar/media/...` (X-Robots coherente con la etapa)
- [ ] Home, productos, ficha, contacto, cotización OK.
- [ ] Login + backoffice OK.

---

## Lo que NO hay que rehacer el día del lanzamiento

Ya está listo y **no** debe borrarse:

- Title / description
- Canonical + `SeoHead` por ruta
- Open Graph completo (`og:url`, `og:image`, etc.)
- Twitter Cards completas
- Schema.org (`Organization` + `WebSite`)
- `sitemap.xml` estático de rutas públicas
- `site.webmanifest` + favicons / apple-touch-icon
- `lang="es-AR"`
- CORS/CSRF con origen `https://laqq.omegon.com.ar`
- `VITE_API_BASE_URL=/api` (compatible HTTPS)
- 404 real para assets faltantes (extensiones); SPA soft-404 documentado

---

## Swagger / API docs

**Pre-Launch:** rutas Swagger/ReDoc **no montadas** (`ENABLE_API_DOCS=False`).

**Rehabilitar (staff):**

1. En `.env` del servidor: `ENABLE_API_DOCS=True`
2. Reiniciar contenedor `laqq-backend`
3. Entrar autenticado como admin/staff a `/api/swagger/`

**Docs públicas (no recomendado):** cambiar `permission_classes` a `AllowAny` y `public=True` en `Backend/config/urls.py`.

---

## APIs públicas (notas — no rotas en este cambio)

Endpoints que el **frontend público** necesita y se mantienen abiertos:

| Endpoint | Motivo |
|----------|--------|
| `/api/products/list/` | Catálogo |
| `/api/products/brands/`, `/categories/` | Filtros |
| Lectura de attachments / media | Imágenes de producto |

**Propuesta futura (post GO LIVE o endurecimiento):**

- Restringir `GET /api/attachments/` listado global (AllowAny hoy lista cientos de URLs); servir attachments solo filtrados por producto.
- No exponer `api_root` en producción o reducirlo.
- Mantener Swagger cerrado al público.

No se aplicó el cierre de listados para **no romper** el front actual.

---

## Soft-404 (React Router)

- Rutas SPA sin archivo → `index.html` **200** + UI `NotFound`. Intencional; no cambiar a `=404` en `location /`.
- Assets con extensión inexistentes → **404** nginx real.

---

## Assets

- Plantilla Excel movida a `Frontend/src/assets/templates/` (ya no en `/TablaCargaMasiva.xlsx` público predecible).
- PDFs de mobiliario en `/pdfs/` se mantienen (contenido de marketing intencional).
