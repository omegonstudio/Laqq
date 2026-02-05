# Admin Django - Sistema de Attachments (Múltiples Archivos)

**Fecha:** 2026-01-07
**Versión:** 2.0
**Para:** Administradores del sistema LAQQ

---

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Cómo Funciona](#cómo-funciona)
3. [Productos - Gestión de Attachments](#productos---gestión-de-attachments)
4. [Tickets - Gestión de Attachments](#tickets---gestión-de-attachments)
5. [Roles de Archivos](#roles-de-archivos)
6. [Ejemplos Paso a Paso](#ejemplos-paso-a-paso)
7. [Troubleshooting](#troubleshooting)

---

## Descripción General

El admin de Django ahora soporta **múltiples archivos** por Producto y por Ticket, usando un sistema de **Inline TabularInline** similar al de las Especificaciones Dinámicas.

### ✅ Características

- **Múltiples archivos**: Sube todos los archivos que necesites (imágenes, PDFs, manuales)
- **No sobrescribe**: Cada archivo se suma a la lista existente
- **Tabla inline**: Interfaz como las "Especificaciones Dinámicas" con tabla + botón "Agregar otro/a"
- **Eliminar individual**: Botón 🗑️ para borrar archivos específicos
- **Campos automáticos**: `file_name`, `size_bytes`, `created_at` se completan solos
- **Clasificación por rol**: image, manual, datasheet, other

---

## Cómo Funciona

### Antes (❌ Problema)

```
┌─────────────────────────────────────────┐
│ Image attachment:  [Browse...] 🔗       │  ← Solo 1 archivo
│                                         │
│ Attachments:                            │
│   - foto1.jpg                           │  ← Lista read-only
│   [Subir nuevo archivo]                 │  ← Abría otra página
└─────────────────────────────────────────┘

Problema: Al subir un archivo nuevo, SOBRESCRIBÍA el anterior
```

### Ahora (✅ Solución)

```
┌───────────────────────────────────────────────────────────────┐
│ ARCHIVOS ADJUNTOS                                             │
│                                                               │
│ File         │ Role   │ File name    │ Size bytes │ Created  │
│ ──────────────────────────────────────────────────────────── │
│ [Browse...] │ image  │ foto1.jpg    │ 125648     │ 2026-... │ 🗑️
│ [Browse...] │ manual │ manual.pdf   │ 523912     │ 2026-... │ 🗑️
│ [Browse...] │ other  │ datasheet... │ 89234      │ 2026-... │ 🗑️
│                                                               │
│ [+ Agregar otro/a Archivo Adjunto]                           │
└───────────────────────────────────────────────────────────────┘

Ventaja: Múltiples archivos en tabla, fácil de gestionar
```

---

## Productos - Gestión de Attachments

### Ubicación en el Admin

1. Ir a: **Admin → Products → Products**
2. Click en un producto existente (o crear uno nuevo)
3. Scrollear hasta la sección **"ARCHIVOS ADJUNTOS"**

### Campos Disponibles

| Campo | Descripción | Editable | Obligatorio |
|-------|-------------|----------|-------------|
| **File** | Botón para subir archivo | ✅ Sí | ✅ Sí |
| **Role** | Clasificación del archivo | ✅ Sí | ❌ No (default: 'other') |
| **File name** | Nombre del archivo | ❌ Auto | - |
| **Size bytes** | Tamaño en bytes | ❌ Auto | - |
| **Created at** | Fecha de subida | ❌ Auto | - |
| **🗑️** | Botón eliminar | ✅ Sí | - |

### Campos Automáticos (No Visibles)

Estos campos se configuran automáticamente:
- `attachable_type`: Siempre es `'product'`
- `attachable_id`: UUID del producto
- `created_by`: Usuario que subió el archivo
- `content_type`: MIME type del archivo (image/jpeg, application/pdf, etc.)

---

## Tickets - Gestión de Attachments

### Ubicación en el Admin

1. Ir a: **Admin → Tickets → Service Tickets**
2. Click en un ticket existente (o crear uno nuevo)
3. Scrollear hasta la sección **"ARCHIVOS ADJUNTOS"**

### Campos Disponibles

Misma estructura que Productos:

| Campo | Descripción | Editable |
|-------|-------------|----------|
| **File** | Archivo a subir | ✅ Sí |
| **Role** | image/manual/datasheet/other | ✅ Sí |
| **File name** | Nombre (auto) | ❌ No |
| **Size bytes** | Tamaño (auto) | ❌ No |
| **Created at** | Fecha (auto) | ❌ No |

### Comportamiento automático al guardar

Cuando guardás un ticket con attachments desde el admin:

1. Cada archivo se asocia al ticket mediante `attachable_type='ServiceTicket'` y `attachable_id`
2. Si el ticket **no tiene attachment principal**, se setea automáticamente al primer archivo (por fecha de creación)
3. El campo `attachment` (singular) es el que aparece como objeto con URL en la API (`GET /tickets/{id}/`)
4. El campo `attachments` (plural) contiene **todos** los archivos asociados

### Diferencias con Versión Anterior

**Antes:**
- Campo `attachment` (ForeignKey) en el formulario
- Solo 1 archivo por ticket
- Sobrescribía al subir nuevo
- `save_formset` estaba en el Inline (código muerto, nunca se ejecutaba)

**Ahora:**
- Inline table "ARCHIVOS ADJUNTOS"
- Múltiples archivos ilimitados
- Campo `attachment` se setea automáticamente al primero
- `save_formset` en `ServiceTicketAdmin` (se ejecuta correctamente al guardar)

---

## Roles de Archivos

### Valores Disponibles

| Role | Descripción | Cuándo Usar | Ejemplo |
|------|-------------|-------------|---------|
| **image** | Imágenes | Fotos de productos, capturas de pantalla, diagramas | `foto_producto.jpg`, `captura_error.png` |
| **manual** | Manuales | PDFs de instrucciones, guías de usuario, documentación | `manual_usuario.pdf`, `guia_instalacion.pdf` |
| **datasheet** | Hojas técnicas | Certificados, especificaciones técnicas, hojas de datos | `certificado_iso.pdf`, `datasheet_tecnica.pdf` |
| **other** | Otros | Cualquier otro tipo de archivo | `reporte.xlsx`, `documento.docx` |

### Auto-detección de Role

Si no especificás el `role`, el sistema lo infiere automáticamente por MIME type:

```python
# Lógica de auto-detección
if file.content_type.startswith('image/'):
    role = 'image'
elif 'pdf' in file.content_type:
    role = 'manual'
else:
    role = 'other'
```

**Ejemplo:**
- Subís `foto.jpg` sin especificar role → Se asigna `image` automáticamente
- Subís `manual.pdf` sin especificar role → Se asigna `manual` automáticamente

---

## Ejemplos Paso a Paso

### Ejemplo 1: Subir Múltiples Imágenes a un Producto

**Escenario:** Querés agregar 3 fotos a la Pipeta Automática 100ml

**Pasos:**

1. **Ir al producto**
   - Admin → Products → Products
   - Click en "Pipeta Automática 100ml"

2. **Scrollear a "ARCHIVOS ADJUNTOS"**
   - Verás una tabla (probablemente vacía si es nuevo)

3. **Subir primera imagen**
   - Click en botón "Browse..." de la primera fila
   - Seleccionar `pipeta_frente.jpg`
   - En "Role" seleccionar: `image`

4. **Agregar más filas**
   - Click en "➕ Agregar otro/a Archivo Adjunto"
   - Repetir para `pipeta_lateral.jpg` y `pipeta_detalle.jpg`
   - Todas con role `image`

5. **Guardar**
   - Click en "Guardar" (abajo del formulario)
   - ✅ Los 3 archivos quedan guardados

6. **Verificar**
   - Refrescar la página del producto
   - Ver tabla con las 3 imágenes
   - Campos `file_name`, `size_bytes`, `created_at` completados automáticamente

---

### Ejemplo 2: Agregar Manual y Datasheet a un Producto

**Escenario:** Pipeta ya tiene 3 fotos, ahora querés agregar manual y certificado

**Pasos:**

1. Editar producto "Pipeta Automática 100ml"

2. En "ARCHIVOS ADJUNTOS" verás las 3 fotos existentes:
   ```
   File               │ Role  │ File name           │ Size    │ Created
   ───────────────────┼───────┼─────────────────────┼─────────┼──────────
   pipeta_frente.jpg  │ image │ pipeta_frente.jpg   │ 125648  │ 2026-...
   pipeta_lateral.jpg │ image │ pipeta_lateral.jpg  │ 98234   │ 2026-...
   pipeta_detalle.jpg │ image │ pipeta_detalle.jpg  │ 145892  │ 2026-...
   ```

3. Click "➕ Agregar otro/a Archivo Adjunto" (2 veces)

4. **Fila 4:** Subir `manual_pipeta.pdf` con role `manual`

5. **Fila 5:** Subir `certificado_iso.pdf` con role `datasheet`

6. Click "Guardar"

7. Ahora tenés **5 archivos** en total:
   - 3 imágenes
   - 1 manual
   - 1 datasheet

---

### Ejemplo 3: Eliminar un Archivo Específico

**Escenario:** Te equivocaste y subiste `foto_antigua.jpg`, querés eliminarla

**Pasos:**

1. Editar el producto

2. En tabla "ARCHIVOS ADJUNTOS", buscar la fila con `foto_antigua.jpg`

3. Click en checkbox "Eliminar" (🗑️) al final de esa fila

4. Click "Guardar"

5. ✅ Solo se elimina ese archivo, los demás quedan intactos

---

### Ejemplo 4: Subir Archivos a un Ticket

**Escenario:** Cliente envió 2 fotos del problema + 1 PDF con detalles

**Pasos:**

1. Admin → Tickets → Service Tickets

2. Abrir el ticket (ej: T-2026-00001)

3. Scrollear a "ARCHIVOS ADJUNTOS"

4. **Fila 1:**
   - File: `problema_foto1.jpg`
   - Role: `image`

5. Click "➕ Agregar otro/a Archivo Adjunto"

6. **Fila 2:**
   - File: `problema_foto2.jpg`
   - Role: `image`

7. Click "➕ Agregar otro/a Archivo Adjunto"

8. **Fila 3:**
   - File: `detalle_problema.pdf`
   - Role: `other`

9. Click "Guardar"

10. ✅ Ticket ahora tiene 3 attachments

---

## Troubleshooting

### Problema 1: No veo la sección "ARCHIVOS ADJUNTOS"

**Causa:** Estás creando un objeto nuevo (sin guardar todavía)

**Solución:**
1. Primero guardá el producto/ticket (botón "Guardar")
2. Luego editalo de nuevo
3. Ahora sí verás la sección de attachments

**Razón:** Django inline requiere que el objeto padre exista en la BD antes de poder asociar objetos relacionados.

---

### Problema 2: Al guardar me da error "attachable_id cannot be null"

**Causa:** Intentás agregar attachments a un objeto que no está guardado

**Solución:**
1. Guardá primero el producto/ticket (sin attachments)
2. Editalo de nuevo
3. Ahora agregá los attachments

---

### Problema 3: File name no se completa automáticamente

**Causa:** El campo `file` está vacío o el archivo no se subió correctamente

**Solución:**
1. Verificá que seleccionaste un archivo (botón "Browse...")
2. Verificá que el archivo no sea muy grande (> 10 MB)
3. El `file_name` solo se completa DESPUÉS de guardar

---

### Problema 4: No puedo editar el campo "File name"

**Causa:** Es un campo readonly (solo lectura) que se completa automáticamente

**Solución:** No es necesario editarlo. El sistema lo completa con el nombre real del archivo subido.

---

### Problema 5: Eliminé un attachment pero el archivo sigue en disco

**Causa:** Puede haber un delay en la eliminación del archivo físico

**Solución:**
1. Es normal, Django elimina el archivo de forma asíncrona en algunos casos
2. El archivo físico se elimina automáticamente al borrar el registro
3. Si persiste, puede ser por permisos de escritura en `mediafiles/`

---

### Problema 6: ¿Puedo cambiar el archivo después de subirlo?

**Respuesta:** No directamente. Debes:
1. Eliminar el attachment existente (🗑️)
2. Agregar uno nuevo con el archivo correcto

---

## Comparación: Antes vs Ahora

| Aspecto | Antes (v1.0) | Ahora (v2.0) |
|---------|--------------|--------------|
| **Cantidad de archivos** | Solo 1 (sobrescribía) | ✅ Ilimitados |
| **Interfaz** | Campo FK + botón externo | ✅ Tabla inline |
| **Agregar archivos** | Botón que abre otra página | ✅ Botón "+ Agregar otro/a" in-place |
| **Eliminar archivos** | Solo reemplazar | ✅ Checkbox eliminar individual |
| **Ver archivos** | Lista read-only | ✅ Tabla editable |
| **Campos visibles** | Solo nombre | ✅ file, role, file_name, size, created |
| **Clasificación** | ❌ No existía | ✅ Por role (image/manual/datasheet/other) |
| **Auto-completado** | ❌ No | ✅ file_name, size_bytes, created_at |

---

## Ubicación de Archivos en Disco

Los archivos se guardan en:

```
Backend/
└── mediafiles/
    └── attachments/
        ├── product/
        │   └── {product_uuid}/
        │       ├── {random_uuid}_foto1.jpg
        │       ├── {random_uuid}_manual.pdf
        │       └── {random_uuid}_datasheet.pdf
        └── ServiceTicket/
            └── {ticket_uuid}/
                ├── {random_uuid}_problema.jpg
                └── {random_uuid}_detalle.pdf
```

**Estructura:**
```
mediafiles/attachments/{attachable_type}/{attachable_id}/{uuid}_{filename}
```

**Ejemplo real:**
```
mediafiles/attachments/product/abc123-def456-789.../9876xyz_manual_pipeta.pdf
```

---

## URLs de Acceso a Archivos

### Desarrollo (Django dev server)

```
http://localhost:8000/media/attachments/product/{uuid}/{uuid}_filename.jpg
```

### Producción (Nginx)

```
https://portal.laqq.com/media/attachments/product/{uuid}/{uuid}_filename.jpg
```

**Nota:** Las URLs se generan automáticamente y están disponibles en:
- Serializers de la API (campo `url`)
- Admin inline (el nombre es clickeable si configurás un readonly field con link)

---

## Integración con la API

Los attachments agregados desde el admin **automáticamente aparecen en la API**:

### Ejemplo: GET /products/{id}/

```json
{
  "id": "abc123...",
  "name": "Pipeta Automática 100ml",
  "attachments": [
    {
      "id": "def456...",
      "file_name": "pipeta_frente.jpg",
      "url": "http://localhost:8000/media/attachments/.../pipeta_frente.jpg",
      "role": "image",
      "size_bytes": 125648,
      "created_at": "2026-01-07T10:30:00Z"
    },
    {
      "id": "ghi789...",
      "file_name": "manual_pipeta.pdf",
      "url": "http://localhost:8000/media/attachments/.../manual_pipeta.pdf",
      "role": "manual",
      "size_bytes": 523912,
      "created_at": "2026-01-07T10:35:00Z"
    }
  ]
}
```

---

## Permisos de Usuario

### Quién puede gestionar attachments en el admin

| Tipo de usuario | Puede ver | Puede agregar | Puede eliminar |
|----------------|-----------|---------------|----------------|
| **Superuser** | ✅ Todos | ✅ Todos | ✅ Todos |
| **Staff (admin/back)** | ✅ Todos | ✅ Todos | ✅ Todos |
| **Client** | ❌ No tiene acceso al admin | ❌ No | ❌ No |

**Nota:** Los clientes gestionan attachments desde la API usando los endpoints:
- `POST /tickets/{id}/attach_file/`
- `POST /tickets/{id}/attach_files/` (múltiples)
- `DELETE /tickets/{id}/attachments/{attachment_id}/`

---

## Buenas Prácticas

### ✅ Recomendaciones

1. **Usar roles correctos:**
   - Imágenes → `image`
   - PDFs de manuales → `manual`
   - Certificados/datasheets → `datasheet`

2. **Nombres descriptivos:**
   - ✅ `pipeta_100ml_frontal.jpg`
   - ❌ `IMG_1234.jpg`

3. **Tamaños razonables:**
   - Imágenes: < 2 MB
   - PDFs: < 10 MB
   - Comprimí archivos muy grandes antes de subir

4. **Eliminar duplicados:**
   - Si subiste el mismo archivo 2 veces por error, eliminá uno

5. **Verificar antes de guardar:**
   - Revisá que todos los archivos sean correctos
   - Una vez guardado, para cambiar tenés que eliminar y re-subir

### ❌ Evitar

1. **No subir archivos temporales:**
   - Archivos de prueba
   - Screenshots de debugging

2. **No usar espacios en nombres:**
   - ✅ `manual_pipeta_100ml.pdf`
   - ❌ `manual pipeta 100ml.pdf`

3. **No subir archivos ejecutables:**
   - `.exe`, `.bat`, `.sh` → Potencial riesgo de seguridad

4. **No dejar filas vacías:**
   - Si agregaste una fila de más, eliminala antes de guardar

---

## Resumen Rápido

### Para Productos

1. Admin → Products → Product → [Editar]
2. Scrollear a "ARCHIVOS ADJUNTOS"
3. Click "+ Agregar otro/a Archivo Adjunto"
4. Seleccionar archivo + role
5. Guardar

### Para Tickets

1. Admin → Tickets → Service Ticket → [Editar]
2. Scrollear a "ARCHIVOS ADJUNTOS"
3. Click "+ Agregar otro/a Archivo Adjunto"
4. Seleccionar archivo + role
5. Guardar

---

## Preguntas Frecuentes

**Q: ¿Puedo subir archivos sin especificar role?**
A: Sí, el sistema asigna `'other'` por defecto y auto-detecta `'image'` o `'manual'` por MIME type.

**Q: ¿Cuántos archivos puedo subir?**
A: Ilimitados, pero considerá el espacio en disco y performance.

**Q: ¿Puedo ver los archivos antes de subir?**
A: No, Django admin no tiene preview. Subí el archivo y luego podés acceder vía URL.

**Q: ¿Se pueden ordenar los attachments?**
A: Sí, se ordenan por `created_at` descendente (más recientes primero).

**Q: ¿Qué pasa si elimino un producto con attachments?**
A: Los attachments asociados también se eliminan (cascade delete).

**Q: ¿Los attachments del admin son los mismos que de la API?**
A: Sí, 100%. Son el mismo modelo, misma tabla, mismos registros.

---

**Autor:** Claude Code
**Última actualización:** 2026-02-04
**Estado:** ✅ Implementado y funcionando

---

## Ver También

- [ATTACHMENTS.md](ATTACHMENTS.md) - Documentación técnica del sistema de attachments (API)
- [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) - Integración con frontend
- [TICKETS_CLIENT_PORTAL.md](TICKETS_CLIENT_PORTAL.md) - Portal de clientes
