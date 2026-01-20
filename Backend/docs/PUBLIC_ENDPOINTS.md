# Endpoints Públicos - LAQQ API

**Fecha:** 2026-01-20
**Versión:** 1.0

---

## Introducción

Este documento detalla los endpoints de la API de LAQQ que son **públicos** (no requieren autenticación) y están diseñados para ser consumidos desde el frontend web por usuarios anónimos.

---

## 🌐 Endpoints Públicos

### GET Endpoints (Lectura)

#### 1. Attachments (Archivos)
**Endpoint:** `GET /attachments/`

**Descripción:** Obtener lista de archivos adjuntos (imágenes, documentos, etc.)

**Autenticación:** No requiere

**Uso:** Ver imágenes de productos, manuales, datasheets

**Ejemplo:**
```bash
curl http://localhost:8000/attachments/
```

---

#### 2. Products - Marcas
**Endpoint:** `GET /products/brands/`

**Descripción:** Listar todas las marcas de productos

**Autenticación:** No requiere

**Response:**
```json
[
  {
    "id": "uuid...",
    "name": "Eppendorf",
    "description": "Equipamiento de laboratorio de precisión"
  }
]
```

**Ejemplo:**
```bash
curl http://localhost:8000/products/brands/
```

---

#### 3. Products - Categorías
**Endpoint:** `GET /products/categories/`

**Descripción:** Listar todas las categorías de productos

**Autenticación:** No requiere

**Response:**
```json
[
  {
    "id": "uuid...",
    "name": "Pipetas",
    "description": "Pipetas automáticas y manuales",
    "parent": null
  }
]
```

**Ejemplo:**
```bash
curl http://localhost:8000/products/categories/
```

---

#### 4. Products - Lista de Productos
**Endpoint:** `GET /products/list/`

**Descripción:** Listar productos disponibles en catálogo (solo lectura)

**Autenticación:** No requiere

**Query Parameters:**
- `page` - Número de página
- `page_size` - Cantidad de resultados
- `search` - Buscar por nombre/descripción
- `brand` - Filtrar por marca (UUID)
- `category` - Filtrar por categoría (UUID)
- `ordering` - Ordenar resultados

**Response:**
```json
{
  "count": 150,
  "next": "http://localhost:8000/products/list/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid...",
      "name": "Pipeta Automática 100ml",
      "description": "Pipeta automática de precisión",
      "price": "25000.00",
      "stock": 15,
      "brand": {
        "id": "uuid...",
        "name": "Eppendorf"
      },
      "category": {
        "id": "uuid...",
        "name": "Equipamiento"
      }
    }
  ]
}
```

**Ejemplo:**
```bash
curl "http://localhost:8000/products/list/?search=pipeta&page=1"
```

---

#### 5. Notes - Lista de Notas/Blog
**Endpoint:** `GET /notes/list/`

**Descripción:** Listar notas/artículos públicos (blog, noticias)

**Autenticación:** No requiere

**Response:**
```json
{
  "count": 10,
  "results": [
    {
      "id": "uuid...",
      "title": "Nuevos productos disponibles",
      "summary": "Resumen del artículo...",
      "content": "Contenido completo...",
      "created_at": "2026-01-15T10:00:00Z"
    }
  ]
}
```

**Ejemplo:**
```bash
curl http://localhost:8000/notes/list/
```

---

### POST Endpoints (Creación)

#### 6. Quotes - Crear Cotización
**Endpoint:** `POST /quotes/list/`

**Descripción:** Crear una cotización anónima desde el formulario web

**Autenticación:** ❌ No requiere (público)

**Flujo:**
1. Usuario web llena formulario de cotización
2. Se crea automáticamente un `Contact` si no existe
3. Se envía email al usuario con confirmación
4. Backoffice recibe notificación

**Request:**
```json
{
  "contact": {
    "company_name": "Distribuidora Médica SA",
    "first_name": "María",
    "last_name": "González",
    "email": "compras@distmed.com.ar",
    "phone": "+54 11 5555-6666"
  },
  "message": "Solicito cotización para los siguientes productos",
  "items": [
    {
      "product_id": "uuid-producto-1",
      "quantity": 10
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "uuid...",
  "quote_number": "Q-2026-00015",
  "message": "Cotización creada exitosamente. Recibirá un email con la confirmación."
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:8000/quotes/list/ \
  -H "Content-Type: application/json" \
  -d '{
    "contact": {
      "company_name": "Distribuidora Médica SA",
      "first_name": "María",
      "last_name": "González",
      "email": "compras@distmed.com.ar",
      "phone": "+54 11 5555-6666"
    },
    "message": "Solicito cotización urgente"
  }'
```

---

#### 7. Quote Items - Agregar Items a Cotización
**Endpoint:** `POST /quotes/items/`

**Descripción:** Agregar productos a una cotización (carrito)

**Autenticación:** ❌ No requiere (público)

**Request:**
```json
{
  "quote": "uuid-de-la-cotizacion",
  "product": "uuid-del-producto",
  "quantity": 10,
  "notes": "Especificaciones adicionales"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid...",
  "quote": "uuid...",
  "product": {
    "id": "uuid...",
    "name": "Pipeta Automática 100ml",
    "price": "25000.00"
  },
  "quantity": 10,
  "subtotal": "250000.00"
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:8000/quotes/items/ \
  -H "Content-Type: application/json" \
  -d '{
    "quote": "quote-uuid-here",
    "product": "product-uuid-here",
    "quantity": 10
  }'
```

---

#### 8. Users - Obtener Token (Login)
**Endpoint:** `POST /users/token/`

**Descripción:** Autenticarse para obtener JWT token

**Autenticación:** No requiere (es el endpoint de login)

**Request:**
```json
{
  "username": "compras",
  "password": "xK9$aB2!mY7@"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:8000/users/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "compras",
    "password": "password123"
  }'
```

---

## 🔒 Endpoints Protegidos (Requieren Autenticación)

Los siguientes endpoints **NO son públicos** y requieren un token JWT válido en el header `Authorization: Bearer {token}`:

### Admin/Backoffice Only

| Endpoint | Método | Descripción | Permiso |
|----------|--------|-------------|---------|
| `/quotes/list/` | GET | Ver todas las cotizaciones | Admin/Backoffice |
| `/quotes/list/{id}/` | GET | Ver detalle de cotización | Admin/Backoffice |
| `/quotes/list/{id}/` | PUT/PATCH | Editar cotización | Admin |
| `/quotes/list/{id}/` | DELETE | Eliminar cotización | Admin |
| `/quotes/items/` | GET | Ver items de cotizaciones | Admin/Backoffice |
| `/quotes/items/{id}/` | PUT/PATCH | Editar item | Admin |
| `/quotes/items/{id}/` | DELETE | Eliminar item | Admin |
| `/quotes/items/bulk/` | POST | Operación bulk (cuando se implemente) | Admin |
| `/products/list/` | POST/PUT/PATCH/DELETE | Gestionar productos | Admin |
| `/contacts/` | ALL | Gestionar contactos | Admin/Backoffice |
| `/users/` | ALL | Gestionar usuarios | Admin |
| `/tickets/` | ALL (excepto POST) | Gestionar tickets | Admin/Backoffice |

---

## 📋 Resumen por Módulo

### Productos (Products)
- ✅ **GET** `/products/brands/` - Público
- ✅ **GET** `/products/categories/` - Público
- ✅ **GET** `/products/list/` - Público (solo lectura)
- 🔒 **POST/PUT/PATCH/DELETE** `/products/list/` - Admin

### Attachments
- ✅ **GET** `/attachments/` - Público
- ✅ **POST** `/attachments/` - Público (para subir imágenes en cotizaciones)
- 🔒 **PUT/PATCH/DELETE** `/attachments/` - Admin

### Notas (Notes)
- ✅ **GET** `/notes/list/` - Público

### Cotizaciones (Quotes)
- ✅ **POST** `/quotes/list/` - Público (crear cotización anónima)
- ✅ **POST** `/quotes/items/` - Público (agregar items)
- 🔒 **GET** `/quotes/list/` - Admin/Backoffice
- 🔒 **PUT/PATCH/DELETE** `/quotes/` - Admin
- 🔒 **GET** `/quotes/items/` - Admin/Backoffice

### Autenticación (Users)
- ✅ **POST** `/users/token/` - Público (login)
- ✅ **POST** `/users/token/refresh/` - Público (refresh token)

---

## 🛡️ Seguridad

### Endpoints Públicos
Los endpoints públicos tienen las siguientes restricciones:

1. **Rate Limiting:** (A implementar) Limitar cantidad de requests por IP
2. **Validación:** Todos los datos se validan en el backend
3. **CORS:** Solo orígenes permitidos pueden hacer requests
4. **Sin información sensible:** Los endpoints públicos no exponen datos privados

### Protección Implementada

#### Cotizaciones (Quotes)
- ✅ **POST público:** Solo para crear cotizaciones nuevas
- ✅ **GET protegido:** Usuarios autenticados no pueden ver cotizaciones de otros
- ✅ **Filtrado automático:** Admin ve todo, usuarios solo lo suyo
- ✅ **PUT/PATCH/DELETE protegido:** Solo admins pueden modificar

#### Quote Items
- ✅ **POST público:** Solo para agregar items a cotizaciones
- ✅ **GET protegido:** Solo admin/backoffice puede ver items
- ✅ **Bulk operations protegido:** Solo admin

---

## 🔧 Configuración CORS

Los endpoints públicos están configurados con CORS para permitir requests desde:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",      # React (default)
    "http://localhost:8080",      # Vue (default)
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
    "http://localhost:8081"
]
```

---

## 📝 Casos de Uso

### Caso 1: Usuario Web (Anónimo) - Solicitar Cotización

**Flujo:**
1. Usuario navega catálogo → `GET /products/list/`
2. Selecciona productos
3. Llena formulario → `POST /quotes/list/` con datos de contacto
4. Agrega productos → `POST /quotes/items/` por cada producto
5. Recibe email de confirmación

**Sin necesidad de login.**

---

### Caso 2: Usuario Web (Anónimo) - Ver Productos

**Flujo:**
1. Ver marcas → `GET /products/brands/`
2. Ver categorías → `GET /products/categories/`
3. Ver productos → `GET /products/list/?category=uuid`
4. Buscar → `GET /products/list/?search=pipeta`

**Sin necesidad de login.**

---

### Caso 3: Backoffice - Gestionar Cotizaciones

**Flujo:**
1. Login → `POST /users/token/`
2. Ver cotizaciones → `GET /quotes/list/` (con token)
3. Ver detalle → `GET /quotes/list/{id}/` (con token)
4. Editar estado → `PATCH /quotes/list/{id}/` (con token, solo admin)

**Requiere autenticación y rol admin/backoffice.**

---

## 🔗 Links Relacionados

- [API General](API.md) - Documentación completa de la API
- [Frontend Integration](FRONTEND_INTEGRATION.md) - Guía de integración frontend
- [Architecture](ARCHITECTURE.md) - Arquitectura del sistema

---

## 📞 Soporte

Si necesitás agregar nuevos endpoints públicos o modificar permisos, contactá al equipo de desarrollo.

---

**Autor:** Claude Code
**Última actualización:** 2026-01-20
