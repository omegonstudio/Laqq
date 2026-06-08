# Cambios de backend que impactan en el frontend

## 0. Fix: error 500 al crear/listar variantes de producto

**Síntoma:** el contenedor tiraba este error en algunos flujos relacionados a variantes de producto:
```
django.core.exceptions.FieldError: Invalid field name(s) for model ProductVariant: 'dimensions'.
```

**Causa:** una migración había eliminado el campo `dimensions` del modelo `ProductVariant`, pero quedaron referencias sueltas a ese campo en código interno del backend (scripts de ejemplo, comandos de management y tests) que seguían intentando crear/leer variantes con `dimensions`.

**Fix aplicado:** se quitaron todas las referencias a `dimensions` para que coincidan con el modelo actual.

**Impacto en el front:** ninguno — no cambió ningún endpoint ni formato de respuesta. El campo `dimensions` ya no existe en `ProductVariant` (no lo manden ni lo esperen en los payloads de variantes).

---

## 1. Envío de cotización actualizada por email — ahora acepta adjunto PDF

**Endpoint:** `POST /api/quotes/list/{id}/send-updated/`

- Antes: solo aceptaba JSON.
- Ahora: acepta `multipart/form-data` (también sigue aceptando JSON).
- Nuevo campo opcional en el form-data: **`pdf_file`** — un archivo PDF generado en el front (no se persiste en disco ni en BD, se adjunta en memoria al correo).
- Validación: si `pdf_file` viene pero no es un PDF (por `content_type` o extensión `.pdf`), el backend responde `400` con:
  ```json
  { "error": "El archivo adjunto debe ser un PDF" }
  ```
- Si no se envía `pdf_file`, el correo se manda igual, sin adjunto (no es obligatorio).

**Respuesta exitosa (200 OK)** — ahora puede incluir `attachment` cuando hubo adjunto:
```json
{
  "message": "Updated quote sent successfully to cliente@example.com",
  "quote_number": "Q-2026-00015",
  "sent_to": "cliente@example.com",
  "attachment": "cotizacion.pdf"
}
```

**Cómo armar el request desde el front (ejemplo):**
```js
const formData = new FormData();
formData.append('pdf_file', pdfBlob, 'cotizacion.pdf'); // opcional

await fetch(`/api/quotes/list/${quoteId}/send-updated/`, {
  method: 'POST',
  body: formData,
  headers: {
    Authorization: `Bearer ${token}`,
    // NO seteen 'Content-Type': el browser arma el boundary del multipart automáticamente
  },
});
```

---

## 2. Categorías — nuevas reglas de validación

**Endpoint:** `POST /products/categories/` y `PUT/PATCH /products/categories/{id}/`

- **Crear categoría sin `parent`:** ahora devuelve `400` (antes podía crearse una categoría "huérfana" de nivel 0):
  ```json
  { "parent": "No se pueden crear categorías de nivel 0 directamente. Toda categoría debe tener una categoría padre." }
  ```
- **Reasignar el `parent` de una categoría principal (nivel 0):** ahora devuelve `400`:
  ```json
  { "parent": "No se puede reasignar el padre de una categoría principal (nivel 0)." }
  ```
- **Quitar el `parent` de una categoría que ya tenía uno:** ahora devuelve `400` (evita crear huérfanas):
  ```json
  { "parent": "No se puede quitar la categoría padre: esto crearía una categoría huérfana de nivel 0." }
  ```

**Endpoint:** `DELETE /products/categories/{id}/`

- **Eliminar una categoría principal (nivel 0, sin `parent`):** ahora devuelve `403`:
  ```json
  { "detail": "No se pueden eliminar las categorías principales (nivel 0)." }
  ```
  (Esto protege a las 4 categorías base: Insumos, Equipamientos/Equipos, Mobiliario, Procesos — la UI debería deshabilitar o mostrar mensaje al intentar borrar/editar el padre de estas.)

---

## 3. Sin cambios de contrato en otros endpoints

No hubo modificaciones en formatos de respuesta de productos, marcas, variantes, tickets, usuarios ni estados de cotización — esos puntos del relevamiento ya estaban correctos en el backend.
