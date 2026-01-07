# Sistema de Adjuntos (Attachments) - Múltiples Archivos

**Fecha:** 2026-01-07
**Versión:** 2.0

---

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Modelo Attachment](#modelo-attachment)
4. [Endpoints - Tickets](#endpoints---tickets)
5. [Endpoints - Productos](#endpoints---productos)
6. [Ejemplos de Uso](#ejemplos-de-uso)
7. [Migración desde Versión Anterior](#migración-desde-versión-anterior)

---

## Descripción General

El sistema de attachments permite asociar **múltiples archivos** (imágenes, PDFs, manuales, datasheets) a diferentes entidades del sistema como Tickets y Productos.

### ✅ Características

- **Múltiples archivos por entidad**: Soporta ilimitados archivos por ticket/producto
- **Clasificación por rol**: image, manual, datasheet, other
- **Almacenamiento en disco**: Archivos guardados en `mediafiles/attachments/{type}/{id}/`
- **URLs públicas**: Cada archivo tiene una URL accesible
- **Archivo principal opcional**: Los modelos pueden mantener un attachment "principal" via ForeignKey
- **Upload multipart o base64**: Soporta ambos métodos
- **Eliminación individual**: Permite borrar archivos específicos
- **Upload masivo**: Sube múltiples archivos en una sola request

---

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Entidad (Product, ServiceTicket, etc.)            │
│                                                     │
│  - image_attachment (FK) → Attachment "principal"  │
│                                                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ 1:N (vía campos genéricos)
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Attachment (Múltiples)                            │
│                                                     │
│  - file (FileField) → mediafiles/attachments/...   │
│  - attachable_type = 'product' | 'ServiceTicket'   │
│  - attachable_id = UUID de la entidad              │
│  - role = 'image' | 'manual' | 'datasheet' | ...   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Campos Genéricos

Los attachments se asocian mediante campos genéricos:
- `attachable_type`: Tipo de entidad ('product', 'ServiceTicket', etc.)
- `attachable_id`: UUID de la entidad
- `role`: Clasificación del archivo

---

## Modelo Attachment

### Campos

```python
class Attachment(models.Model):
    id = UUIDField(primary_key=True)
    file = FileField(upload_to=attachment_upload_to)
    file_name = CharField(max_length=255)
    content_type = CharField(max_length=100)
    size_bytes = IntegerField()
    role = CharField(choices=ROLE_CHOICES)  # image, manual, datasheet, other

    # Campos genéricos para asociación
    attachable_type = CharField(max_length=100)
    attachable_id = UUIDField()

    created_by = ForeignKey(User)
    created_at = DateTimeField(auto_now_add=True)
```

### Roles Disponibles

| Role | Descripción | Ejemplo |
|------|-------------|---------|
| `image` | Imágenes (PNG, JPG, etc.) | Fotos de productos, capturas de pantalla |
| `manual` | Manuales y documentación PDF | Manuales de usuario, guías |
| `datasheet` | Hojas de datos técnicas | Especificaciones técnicas, certificados |
| `other` | Otros archivos | Cualquier otro tipo de archivo |

### Función upload_to

Los archivos se guardan en:
```
mediafiles/attachments/{attachable_type}/{attachable_id}/{uuid}_{filename}
```

Ejemplo:
```
mediafiles/attachments/product/abc123.../def456_manual.pdf
mediafiles/attachments/ServiceTicket/xyz789.../abc123_foto.jpg
```

---

## Endpoints - Tickets

### 1. Subir UN archivo

**Endpoint:** `POST /tickets/{id}/attach_file/`

**Método 1: Multipart/form-data (Recomendado)**

```bash
curl -X POST http://localhost:8000/tickets/{id}/attach_file/ \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/file.jpg" \
  -F "role=image"
```

**Método 2: JSON con Base64**

```bash
curl -X POST http://localhost:8000/tickets/{id}/attach_file/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "file_name": "documento.pdf",
    "content_type": "application/pdf",
    "data": "base64_encoded_data...",
    "role": "manual"
  }'
```

**Response:**
```json
{
  "message": "File attached successfully",
  "attachment_id": "abc123...",
  "ticket_number": "T-2026-00001",
  "file_name": "documento.pdf",
  "url": "http://localhost:8000/media/attachments/ServiceTicket/xyz.../documento.pdf",
  "role": "manual"
}
```

---

### 2. Subir MÚLTIPLES archivos

**Endpoint:** `POST /tickets/{id}/attach_files/`

```bash
curl -X POST http://localhost:8000/tickets/{id}/attach_files/ \
  -H "Authorization: Bearer {token}" \
  -F "files=@/path/to/file1.jpg" \
  -F "files=@/path/to/file2.pdf" \
  -F "files=@/path/to/file3.png" \
  -F "role=image"
```

**Response:**
```json
{
  "message": "3 file(s) attached successfully",
  "ticket_number": "T-2026-00001",
  "attachments": [
    {
      "id": "abc123...",
      "file_name": "file1.jpg",
      "url": "http://localhost:8000/media/attachments/.../file1.jpg",
      "role": "image",
      "size_bytes": 125648
    },
    {
      "id": "def456...",
      "file_name": "file2.pdf",
      "url": "http://localhost:8000/media/attachments/.../file2.pdf",
      "role": "manual",
      "size_bytes": 523912
    }
  ],
  "errors": []
}
```

---

### 3. Listar todos los attachments

**Endpoint:** `GET /tickets/{id}/list_attachments/`

```bash
curl -X GET http://localhost:8000/tickets/{id}/list_attachments/ \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "ticket_number": "T-2026-00001",
  "total_attachments": 3,
  "attachments": [
    {
      "id": "abc123...",
      "file_name": "foto1.jpg",
      "content_type": "image/jpeg",
      "size_bytes": 125648,
      "url": "http://localhost:8000/media/attachments/.../foto1.jpg",
      "role": "image",
      "created_at": "2026-01-07T10:30:00Z"
    }
  ]
}
```

---

### 4. Eliminar un attachment

**Endpoint:** `DELETE /tickets/{ticket_id}/attachments/{attachment_id}/`

```bash
curl -X DELETE http://localhost:8000/tickets/{ticket_id}/attachments/{attachment_id}/ \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "message": "Attachment deleted successfully",
  "file_name": "foto1.jpg"
}
```

---

## Endpoints - Productos

### 1. Subir UN archivo

**Endpoint:** `POST /products/{id}/upload_attachment/`

```bash
curl -X POST http://localhost:8000/products/{id}/upload_attachment/ \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/manual.pdf" \
  -F "role=manual"
```

---

### 2. Subir MÚLTIPLES archivos

**Endpoint:** `POST /products/{id}/upload_attachments/`

```bash
curl -X POST http://localhost:8000/products/{id}/upload_attachments/ \
  -H "Authorization: Bearer {token}" \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.jpg" \
  -F "files=@/path/to/datasheet.pdf" \
  -F "role=image"
```

**Response:**
```json
{
  "message": "3 file(s) uploaded successfully",
  "product_code": "PIP-AUTO-100",
  "attachments": [
    {
      "id": "abc123...",
      "file_name": "image1.jpg",
      "url": "http://localhost:8000/media/attachments/product/.../image1.jpg",
      "role": "image"
    }
  ],
  "errors": []
}
```

---

### 3. Listar todos los attachments

**Endpoint:** `GET /products/{id}/list_attachments/`

```bash
curl -X GET http://localhost:8000/products/{id}/list_attachments/ \
  -H "Authorization: Bearer {token}"
```

---

### 4. Eliminar un attachment

**Endpoint:** `DELETE /products/{product_id}/attachments/{attachment_id}/`

```bash
curl -X DELETE http://localhost:8000/products/{product_id}/attachments/{attachment_id}/ \
  -H "Authorization: Bearer {token}"
```

---

## Ejemplos de Uso

### Ejemplo 1: Subir fotos de un ticket desde el frontend

```javascript
// React/JavaScript
const uploadTicketPhotos = async (ticketId, files) => {
  const formData = new FormData();

  // Agregar múltiples archivos
  files.forEach(file => {
    formData.append('files', file);
  });

  // Especificar role
  formData.append('role', 'image');

  const response = await fetch(`http://localhost:8000/tickets/${ticketId}/attach_files/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return await response.json();
};

// Uso
const files = document.getElementById('fileInput').files;
const result = await uploadTicketPhotos('abc123', files);
console.log(`${result.message} - ${result.attachments.length} archivos subidos`);
```

---

### Ejemplo 2: Listar y eliminar attachments

```javascript
// Listar todos los attachments de un ticket
const listTicketAttachments = async (ticketId) => {
  const response = await fetch(`http://localhost:8000/tickets/${ticketId}/list_attachments/`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  console.log(`Total: ${data.total_attachments}`);

  return data.attachments;
};

// Eliminar un attachment específico
const deleteAttachment = async (ticketId, attachmentId) => {
  const response = await fetch(
    `http://localhost:8000/tickets/${ticketId}/attachments/${attachmentId}/`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return await response.json();
};
```

---

### Ejemplo 3: Upload desde Python/Django shell

```python
from tickets.models import ServiceTicket
from attachments.models import Attachment
from django.core.files import File

ticket = ServiceTicket.objects.first()

# Subir archivo
with open('/path/to/file.jpg', 'rb') as f:
    attachment = Attachment.objects.create(
        file=File(f, name='foto.jpg'),
        role='image',
        content_type='image/jpeg',
        attachable_type='ServiceTicket',
        attachable_id=ticket.id
    )

print(f"Attachment creado: {attachment.url}")

# Listar todos los attachments de un ticket
attachments = Attachment.objects.filter(
    attachable_type='ServiceTicket',
    attachable_id=ticket.id
)

for att in attachments:
    print(f"- {att.file_name} ({att.role}) - {att.url}")
```

---

## Migración desde Versión Anterior

### ❌ Versión Anterior (SOBRESCRIBÍA)

```python
# En views.py (VIEJO - NO USAR)
ticket.attachment = attachment  # ← Sobrescribía el attachment anterior
ticket.save()
```

### ✅ Nueva Versión (Múltiples archivos)

```python
# En views.py (NUEVO)
# Solo crear el Attachment con campos genéricos
attachment = Attachment.objects.create(
    file=file_obj,
    role=role,
    attachable_type='ServiceTicket',
    attachable_id=ticket.id,
    created_by=request.user
)

# Opcionalmente, establecer como principal solo si no existe
if not ticket.attachment:
    ticket.attachment = attachment
    ticket.save()
```

### Cambios en el código

**Antes:**
- El campo `ticket.attachment` se sobrescribía cada vez
- Solo podías tener 1 archivo por ticket

**Ahora:**
- Se crean múltiples `Attachment` asociados por `attachable_type` + `attachable_id`
- El campo `ticket.attachment` es solo el "principal" (opcional)
- Puedes tener ilimitados archivos por ticket/producto

---

## Serializers

Los serializers ahora incluyen automáticamente todos los attachments:

### ServiceTicketSerializer

```python
class ServiceTicketSerializer(serializers.ModelSerializer):
    attachments = serializers.SerializerMethodField(read_only=True)

    def get_attachments(self, obj):
        qs = Attachment.objects.filter(
            attachable_type='ServiceTicket',
            attachable_id=obj.id
        ).order_by('-created_at')
        return AttachmentSerializer(qs, many=True, context=self.context).data
```

**Response de GET /tickets/{id}/ incluye:**

```json
{
  "id": "abc123...",
  "ticket_number": "T-2026-00001",
  "description": "...",
  "attachment": "def456...",  // Attachment principal (FK)
  "attachments": [  // TODOS los attachments
    {
      "id": "def456...",
      "file_name": "foto1.jpg",
      "url": "http://...",
      "role": "image"
    },
    {
      "id": "ghi789...",
      "file_name": "manual.pdf",
      "url": "http://...",
      "role": "manual"
    }
  ]
}
```

---

## Permisos

### Tickets
- **Clientes**: Solo pueden subir/ver/eliminar attachments de sus propios tickets
- **Admin/BackOffice**: Pueden gestionar attachments de cualquier ticket

### Productos
- **Público**: Solo lectura de attachments
- **Admin**: CRUD completo de attachments

---

## Configuración

### MEDIA_ROOT y MEDIA_URL

En `config/settings.py`:

```python
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'mediafiles'
```

### Servir archivos en desarrollo

En `config/urls.py`:

```python
from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### Servir archivos en producción

- **Opción 1**: Nginx/Apache sirven directamente desde `mediafiles/`
- **Opción 2**: S3/Cloud Storage (requiere configurar `django-storages`)

---

## Resumen de Cambios

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Cantidad de archivos** | 1 por ticket/producto | Ilimitados |
| **Almacenamiento** | BinaryField `data` | FileField `file` en disco |
| **Método de upload** | Solo base64 | Multipart + base64 |
| **Upload masivo** | ❌ No soportado | ✅ Endpoint `attach_files/` |
| **Eliminación** | ❌ Solo sobrescribir | ✅ Endpoint `DELETE attachments/{id}/` |
| **Listado** | ❌ Solo en serializer | ✅ Endpoint `list_attachments/` |
| **Role/clasificación** | ❌ No existía | ✅ image/manual/datasheet/other |
| **Attachment principal** | Solo 1 (FK) | 1 principal + N adicionales |

---

## Testing

### Desde Swagger UI

1. Ir a http://localhost:8000/swagger/
2. Buscar endpoint `POST /tickets/{id}/attach_files/`
3. Click en "Try it out"
4. Subir archivos usando el input `files`
5. Ver response con lista de attachments creados

### Desde cURL

```bash
# Subir múltiples archivos
curl -X POST http://localhost:8000/tickets/abc123/attach_files/ \
  -H "Authorization: Bearer your_token" \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg" \
  -F "files=@manual.pdf"

# Listar attachments
curl http://localhost:8000/tickets/abc123/list_attachments/ \
  -H "Authorization: Bearer your_token"

# Eliminar attachment
curl -X DELETE http://localhost:8000/tickets/abc123/attachments/def456/ \
  -H "Authorization: Bearer your_token"
```

---

## Troubleshooting

### Problema: "File not found" al acceder a URL

**Causa**: MEDIA_ROOT no está configurado correctamente

**Solución**:
1. Verificar `settings.py`: `MEDIA_ROOT = BASE_DIR / 'mediafiles'`
2. Verificar que la carpeta `mediafiles/` existe
3. En desarrollo, agregar `static()` en `urls.py`

### Problema: Attachment se sobrescribe

**Causa**: Código antiguo que asigna `ticket.attachment = ...` sin verificar

**Solución**: Usar el nuevo endpoint `attach_files/` o verificar antes de asignar:
```python
if not ticket.attachment:
    ticket.attachment = attachment
    ticket.save()
```

### Problema: No puedo subir múltiples archivos

**Causa**: Usando endpoint `attach_file/` en lugar de `attach_files/`

**Solución**: Usar endpoint correcto:
- `attach_file/` → 1 archivo
- `attach_files/` → Múltiples archivos

---

**Autor:** Claude Code
**Última actualización:** 2026-01-07
**Estado:** ✅ Implementado y funcionando
