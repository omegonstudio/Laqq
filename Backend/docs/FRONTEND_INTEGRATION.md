# Guía de Integración Frontend - Sistema Completo LAQQ

**Fecha:** 2025-12-23
**Versión:** 1.0
**Para:** Frontend Developer

---

## 📚 Tabla de Contenidos

1. [Arquitectura](#arquitectura)
2. [Configuración Inicial](#configuración-necesaria)
3. [Endpoints Públicos](#endpoints-públicos)
4. [Autenticación y Usuarios](#autenticación-jwt)
5. [Productos y Catálogo](#módulo-productos)
6. [Contactos y CRM](#módulo-contactos)
7. [Cotizaciones](#módulo-cotizaciones)
8. [Tickets de Servicio](#módulo-tickets)
9. [Dashboard y Estadísticas](#dashboard-y-estadísticas)
10. [Manejo de Archivos](#adjuntos-y-archivos)
11. [Códigos de Ejemplo](#ejemplos-de-integración)
12. [Errores Comunes](#errores-comunes)

---

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  FRONTEND (React/Vue/Angular)                      │
│  Puerto: 3000/8080                                 │
│  URL: http://localhost:3000 o https://portal.laqq.com│
│                                                     │
│  - Formulario de creación de tickets               │
│  - Login de distribuidoras                         │
│  - Dashboard de tickets                            │
│  - Subir archivos adjuntos                         │
│                                                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ HTTP/REST API
                   │ Authorization: Bearer {jwt_token}
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│                                                     │
│  BACKEND (Django REST Framework)                   │
│  Puerto: 8000                                      │
│  URL: http://localhost:8000                        │
│                                                     │
│  - API REST                                        │
│  - Autenticación JWT                               │
│  - Base de datos PostgreSQL                        │
│  - Lógica de negocio                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Backend YA está listo

El backend está **100% funcional** y listo para ser consumido desde el frontend:

- ✅ API REST completa
- ✅ CORS configurado para `localhost:3000`, `localhost:8080`, `localhost:8081`
- ✅ Autenticación JWT
- ✅ Creación automática de usuarios
- ✅ Envío de emails con credenciales
- ✅ Sistema de permisos por rol
- ✅ Filtrado automático de tickets por distribuidora

---

## 🚀 Setup local (primera vez o DB nueva)

Si levantás el entorno por primera vez o con una DB vacía, el entrypoint corre automáticamente al hacer `docker compose up`:

1. Migraciones
2. Datos de referencia (estados, tipos, prioridades)
3. Seed data de desarrollo

**No tenés que correr ningún comando manual.** Solo:

```bash
cp env.example .env
docker compose -f docker-compose.dev.yml up --build
```

Si por alguna razón los datos de referencia no están cargados (por ejemplo, si usás una DB existente de prod), podés correrlos manualmente:

```bash
docker compose -f docker-compose.dev.yml exec backend python manage.py populate_user_data
docker compose -f docker-compose.dev.yml exec backend python manage.py populate_ticket_data
docker compose -f docker-compose.dev.yml exec backend python manage.py populate_contact_data
docker compose -f docker-compose.dev.yml exec backend python manage.py populate_quote_data
```

Estos comandos son **idempotentes**: podés correrlos múltiples veces sin problema.

### Datos creados automáticamente

| Tipo | IDs disponibles |
|------|----------------|
| UserType | `admin`, `back`, `client` |
| UserState | `active`, `inactive`, `suspended` |
| TicketState | `new`, `open`, `in_progress`, `waiting_parts`, `resolved`, `closed` |
| TicketPriority | `low`, `medium`, `high`, `urgent` |
| ContactState | `new`, `in_progress`, `responded`, `closed` |
| QuoteType | `standard`, `express` |
| QuoteState | `pending`, `sent`, `confirmed`, `rejected`, `expired` |

> **Atención:** Los endpoints de tickets usan estos IDs hardcodeados. Si la DB no tiene estos registros, los endpoints `start/`, `resolve/` y `close/` de tickets van a responder con error `DoesNotExist`.

---

## 🔧 Configuración Necesaria

### 1. Variables de Entorno del Backend

Asegurate de que el backend tenga esto en su `.env`:

```env
# URL del FRONTEND (NO del backend!)
CLIENT_PORTAL_URL=http://localhost:3000/portal-cliente

# En producción sería:
# CLIENT_PORTAL_URL=https://portal.laqq.com/portal-cliente
```

**IMPORTANTE:** `CLIENT_PORTAL_URL` debe apuntar al **frontend**, no al backend. Este es el link que recibirán las distribuidoras en el email.

---

### 2. CORS ya configurado

El backend ya tiene CORS habilitado para:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",      # React (default)
    "http://localhost:8080",      # Vue (default)
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
    "http://localhost:8081"
]

CORS_ALLOW_CREDENTIALS = True  # Para JWT
```

Si tu frontend corre en otro puerto, avisame para agregarlo.

---

## 🗂️ Módulos del Sistema

LAQQ tiene 6 módulos principales que el frontend debe integrar:

| Módulo | Descripción | Endpoints Base |
|--------|-------------|----------------|
| **Autenticación** | Login, refresh token, permisos | `/users/token/` |
| **Productos** | Catálogo de productos químicos y equipos | `/products/` |
| **Contactos** | CRM de distribuidoras | `/contacts/` |
| **Cotizaciones** | Sistema de cotizaciones y carrito | `/quotes/` |
| **Tickets** | Servicio técnico y soporte | `/tickets/` |
| **Dashboard** | Estadísticas y métricas | `/dashboard/` |

---

## 🌐 Endpoints Públicos

**⚠️ IMPORTANTE:** Varios endpoints son **públicos** y **NO requieren autenticación JWT**.

### Endpoints Públicos (Sin Token)

#### GET (Lectura)
- `GET /products/list/` - Ver catálogo de productos
- `GET /products/brands/` - Ver marcas
- `GET /products/categories/` - Ver categorías
- `GET /attachments/` - Ver archivos adjuntos (imágenes, documentos)
- `GET /notes/list/` - Ver notas/blog
- `GET /tickets/states/` - Estados de tickets (para dropdowns/badges)
- `GET /tickets/priorities/` - Prioridades de tickets (para dropdowns/badges)

#### POST (Creación)
- `POST /contacts/messages/` - **Enviar mensaje de contacto** (sin login)
- `POST /quotes/list/` - **Crear cotización anónima** (sin login)
- `POST /quotes/items/` - **Agregar items a cotización** (sin login)
- `POST /users/token/` - Login (obtener token)
- `POST /users/token/refresh/` - Refresh token

### Flujo Típico de Usuario Anónimo

```javascript
// 1. Ver productos (sin token)
const products = await fetch('http://localhost:8000/products/list/');

// 2. Crear cotización (sin token)
const quote = await fetch('http://localhost:8000/quotes/list/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contact: {
      company_name: "Distribuidora SA",
      first_name: "María",
      last_name: "González",
      email: "compras@distmed.com.ar",
      phone: "+54 11 5555-6666"
    },
    message: "Solicito cotización"
  })
});

// 3. Agregar productos a la cotización (sin token)
const item = await fetch('http://localhost:8000/quotes/items/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    quote: quoteId,
    product: productId,
    quantity: 10
  })
});
```

**Ver documentación completa:** [docs/PUBLIC_ENDPOINTS.md](PUBLIC_ENDPOINTS.md)

---

## 📡 Autenticación JWT

**Base URL:** `http://localhost:8000` (desarrollo) o `https://api.laqq.com` (producción)

### 1. Login (Autenticación)

**Endpoint:** `POST /users/token/`

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
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Campos:**
- `access`: Token JWT para usar en requests (válido 60 minutos)
- `refresh`: Token para renovar el access token (válido 7 días)

**Ejemplo en JavaScript:**
```javascript
const login = async (username, password) => {
  const response = await fetch('http://localhost:8000/users/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();

  // Guardar tokens
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);

  return data;
};
```

---

### 2. Refresh Token

**Endpoint:** `POST /users/token/refresh/`

**Request:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Ejemplo:**
```javascript
const refreshToken = async () => {
  const refresh = localStorage.getItem('refresh_token');

  const response = await fetch('http://localhost:8000/users/token/refresh/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh })
  });

  const data = await response.json();
  localStorage.setItem('access_token', data.access);

  return data;
};
```

---

## 📦 Módulo: Productos

Catálogo completo de productos químicos y equipos de laboratorio que LAQQ vende a distribuidoras.

### Endpoints Principales

#### 1. Listar Productos

**Endpoint:** `GET /products/list/`

**Query Parameters:**
- `?page=1&page_size=20` - Paginación
- `?search=pipeta` - Buscar por nombre/descripción
- `?brand={uuid}` - Filtrar por marca
- `?category={uuid}` - Filtrar por categoría
- `?ordering=-created_at` - Ordenar

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
      "description": "Pipeta automática de precisión para laboratorio",
      "price": "25000.00",
      "stock": 15,
      "sku": "PIP-AUTO-100",
      "brand": {
        "id": "uuid...",
        "name": "Eppendorf"
      },
      "category": {
        "id": "uuid...",
        "name": "Equipamiento de Laboratorio"
      },
      "images": ["url1", "url2"],
      "is_active": true,
      "created_at": "2025-01-10T10:00:00Z"
    }
  ]
}
```

#### 2. Marcas

**Endpoint:** `GET /products/brands/`

```json
[
  {
    "id": "uuid...",
    "name": "Eppendorf",
    "description": "Equipamiento de laboratorio de precisión",
    "logo": "url_logo"
  }
]
```

#### 3. Categorías

**Endpoint:** `GET /products/categories/`

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

---

## 👥 Módulo: Contactos (CRM)

Gestión de distribuidoras y sus contactos.

### Endpoints Principales

#### 1. Listar Contactos

**Endpoint:** `GET /contacts/list/`

**Autenticación:** Requiere JWT (Admin/BackOffice solamente)

**Query Parameters:**
- `?state=active` - Filtrar por estado
- `?search=distribuidora` - Buscar en nombre/empresa/email

**Response:**
```json
{
  "count": 85,
  "results": [
    {
      "id": "uuid...",
      "company_name": "Distribuidora Médica del Sur SA",
      "first_name": "María",
      "last_name": "González",
      "email": "compras@distmedsur.com.ar",
      "phone": "011-4567-8900",
      "country": "Argentina",
      "state": {
        "id": "active",
        "name": "Activo",
        "color": "#27ae60"
      },
      "assigned_user": {
        "id": 5,
        "username": "vendedor1"
      },
      "created_at": "2025-01-05T14:00:00Z"
    }
  ]
}
```

#### 2. Crear Contacto

**Endpoint:** `POST /contacts/list/`

**Request:**
```json
{
  "company_name": "Nueva Distribuidora SA",
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "contacto@nuevadist.com",
  "phone": "+54 11 5555-6666",
  "country": "Argentina",
  "message": "Interesado en productos químicos"
}
```

#### 3. Estados de Contactos

**Endpoint:** `GET /contacts/states/`

```json
[
  {
    "id": "new",
    "name": "Nuevo",
    "color": "#3498db"
  },
  {
    "id": "qualified",
    "name": "Calificado",
    "color": "#f39c12"
  },
  {
    "id": "customer",
    "name": "Cliente",
    "color": "#27ae60"
  }
]
```

---

## 💰 Módulo: Cotizaciones

Sistema de generación de cotizaciones para distribuidoras (como un carrito de compra).

### Endpoints Principales

#### 1. Listar Cotizaciones

**Endpoint:** `GET /quotes/list/`

**Autenticación:** Requiere JWT

**Response:**
```json
{
  "count": 25,
  "results": [
    {
      "id": "uuid...",
      "quote_number": "Q-2025-00015",
      "contact": {
        "id": "uuid...",
        "company_name": "Distribuidora Médica SA",
        "email": "compras@distmed.com"
      },
      "state": {
        "id": "sent",
        "name": "Enviada"
      },
      "total": "150000.00",
      "items_count": 5,
      "created_at": "2025-01-20T10:00:00Z",
      "valid_until": "2025-02-20T10:00:00Z"
    }
  ]
}
```

#### 2. Crear Cotización

**Endpoint:** `POST /quotes/list/`

**Request:**
```json
{
  "contact": "uuid-del-contacto",
  "notes": "Cotización solicitada vía email",
  "valid_until": "2025-03-01"
}
```

#### 3. Items de Cotización

**Endpoint:** `GET /quotes/items/?quote={uuid}`

**Endpoint:** `POST /quotes/items/`

**Request (Agregar item):**
```json
{
  "quote": "uuid-de-la-cotizacion",
  "product": "uuid-del-producto",
  "quantity": 10,
  "unit_price": "25000.00",
  "discount_percent": 10.0
}
```

**Response:**
```json
{
  "id": "uuid...",
  "quote": "uuid...",
  "product": {
    "id": "uuid...",
    "name": "Pipeta Automática 100ml",
    "sku": "PIP-AUTO-100"
  },
  "quantity": 10,
  "unit_price": "25000.00",
  "discount_percent": 10.0,
  "subtotal": "225000.00"
}
```

#### 4. Enviar Cotización por Email

**Endpoint:** `POST /quotes/{id}/send_email/`

Envía la cotización al email del contacto automáticamente.

---

## 📊 Módulo: Dashboard

Métricas y estadísticas para admin/backoffice.

### Endpoint Principal

**Endpoint:** `GET /dashboard/summary/`

**Autenticación:** Requiere JWT (Admin/BackOffice)

**Response:**
```json
{
  "products": {
    "total": 150,
    "active": 142,
    "low_stock": 8
  },
  "contacts": {
    "total": 85,
    "new_this_month": 12,
    "active_customers": 65
  },
  "quotes": {
    "total": 250,
    "pending": 15,
    "sent": 45,
    "accepted": 120,
    "total_amount": "15500000.00"
  },
  "tickets": {
    "total": 95,
    "open": 12,
    "in_progress": 8,
    "resolved_this_month": 25
  }
}
```

---

## 🎫 Módulo: Tickets

Sistema de soporte técnico para distribuidoras. Ver sección detallada abajo.

---

### 3. Listar Tickets (de la distribuidora logueada)

**Endpoint:** `GET /tickets/`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters (opcionales):**
- `?page=1` - Número de página
- `?page_size=10` - Cantidad de resultados por página
- `?ordering=-created_at` - Ordenar por fecha descendente
- `?state=in_progress` - Filtrar por estado
- `?priority=high` - Filtrar por prioridad
- `?search=pipeta` - Buscar en descripción/producto

**Response (200 OK):**
```json
{
  "count": 15,
  "next": "http://localhost:8000/tickets/?page=2",
  "previous": null,
  "results": [
    {
      "id": "abc123-uuid...",
      "ticket_number": "T-2025-00001",
      "contact": {
        "id": "def456-uuid...",
        "company_name": "Distribuidora Médica SA",
        "first_name": "María",
        "last_name": "González",
        "email": "compras@distmedsur.com.ar",
        "phone": "011-4567-8900"
      },
      "product_name": "Pipeta Automática 100ml",
      "description": "La pipeta no dispensa el volumen correcto...",
      "state": {
        "id": "in_progress",
        "name": "En progreso",
        "color": "#9b59b6"
      },
      "priority": {
        "id": "high",
        "name": "Alta",
        "level": 3,
        "color": "#f39c12"
      },
      "assigned_user": {
        "id": 5,
        "username": "tecnico1",
        "first_name": "Juan",
        "last_name": "Técnico",
        "email": "tecnico1@laqq.com"
      },
      "attachment": {
        "id": "def456-uuid...",
        "file_name": "foto_problema.jpg",
        "url": "http://localhost:8000/media/attachments/ServiceTicket/.../foto_problema.jpg",
        "role": "image",
        "size_bytes": 125648,
        "created_at": "2025-12-23T10:35:00Z"
      },
      "attachments": [
        {
          "id": "def456-uuid...",
          "file_name": "foto_problema.jpg",
          "url": "http://localhost:8000/media/attachments/ServiceTicket/.../foto_problema.jpg",
          "role": "image",
          "size_bytes": 125648,
          "created_at": "2025-12-23T10:35:00Z"
        }
      ],
      "created_at": "2025-12-23T10:30:00Z",
      "updated_at": "2025-12-23T14:20:00Z",
      "assigned_at": "2025-12-23T11:00:00Z",
      "started_at": "2025-12-23T11:30:00Z",
      "resolved_at": null,
      "closed_at": null,
      "resolution_notes": null
    }
  ]
}
```

**Ejemplo:**
```javascript
const getTickets = async (page = 1) => {
  const token = localStorage.getItem('access_token');

  const response = await fetch(
    `http://localhost:8000/tickets/?page=${page}&page_size=10&ordering=-created_at`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    }
  );

  return await response.json();
};
```

**IMPORTANTE:** El backend **automáticamente filtra** los tickets para que la distribuidora solo vea los suyos (por email). No necesitás hacer nada adicional.

---

### 4. Ver Detalle de un Ticket

**Endpoint:** `GET /tickets/{id}/`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):** Mismo formato que el item en `results` arriba.

**Response (404 Not Found):** Si el ticket no existe o no pertenece a la distribuidora.

**Ejemplo:**
```javascript
const getTicketDetail = async (ticketId) => {
  const token = localStorage.getItem('access_token');

  const response = await fetch(`http://localhost:8000/tickets/${ticketId}/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  if (!response.ok) {
    throw new Error('Ticket no encontrado');
  }

  return await response.json();
};
```

---

### 5. Adjuntar Archivo a Ticket

**Endpoint:** `POST /tickets/{id}/attach_file/`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request:**
```json
{
  "file_name": "foto_producto_defectuoso.jpg",
  "content_type": "image/jpeg",
  "data": "base64_encoded_file_data_here..."
}
```

**Response (200 OK):**
```json
{
  "message": "File attached successfully",
  "attachment_id": "xyz789-uuid...",
  "ticket_number": "T-2025-00001",
  "file_name": "foto_producto_defectuoso.jpg"
}
```

**Response (403 Forbidden):** Si intentás adjuntar a un ticket que no es tuyo.

**Ejemplo:**
```javascript
const attachFile = async (ticketId, file) => {
  const token = localStorage.getItem('access_token');

  // Convertir archivo a base64
  const reader = new FileReader();
  const base64 = await new Promise((resolve) => {
    reader.onload = (e) => resolve(e.target.result.split(',')[1]);
    reader.readAsDataURL(file);
  });

  const response = await fetch(`http://localhost:8000/tickets/${ticketId}/attach_file/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file_name: file.name,
      content_type: file.type,
      data: base64
    })
  });

  return await response.json();
};
```

---

### 6. Crear Ticket (Usuario Anónimo desde Web)

**Endpoint:** `POST /tickets/`

**Headers:**
```
Content-Type: application/json
```

**NO requiere autenticación** - Este endpoint es público para que las distribuidoras puedan crear tickets desde la web sin login.

**Request:**
```json
{
  "contact": {
    "company_name": "Distribuidora Médica del Sur SA",
    "first_name": "María",
    "last_name": "González",
    "email": "compras@distmedsur.com.ar",
    "phone": "011-4567-8900"
  },
  "product_name": "Pipeta Automática 100ml",
  "description": "La pipeta no dispensa el volumen correcto. Al intentar dispensar 100ml, solo dispensa aproximadamente 85ml. Necesitamos calibración o reemplazo urgente."
}
```

**Response (201 Created):**
```json
{
  "id": "abc123-uuid...",
  "ticket_number": "T-2025-00001",
  "message": "Ticket creado exitosamente. Se ha enviado un email con las credenciales de acceso al portal."
}
```

**Lo que pasa automáticamente:**
1. ✅ Se crea el contacto si no existe
2. ✅ Se crea el ticket
3. ✅ Se verifica si existe usuario con ese email
4. ✅ Si no existe, se crea usuario con password random
5. ✅ Se envía email a la distribuidora con username y password
6. ✅ Se envía email a LAQQ notificando el nuevo ticket

**Ejemplo:**
```javascript
const createTicket = async (contactData, ticketData) => {
  const response = await fetch('http://localhost:8000/tickets/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contact: contactData,
      product_name: ticketData.product_name,
      description: ticketData.description
    })
  });

  return await response.json();
};
```

---

### 7. Estados Disponibles

**Endpoint:** `GET /tickets/states/`

**Headers:** No requiere autenticación

**Response (200 OK):**
```json
[
  {
    "id": "new",
    "name": "Nuevo",
    "color": "#3498db",
    "description": "Ticket recién creado",
    "is_final": false
  },
  {
    "id": "in_progress",
    "name": "En progreso",
    "color": "#9b59b6",
    "description": "Técnico trabajando en el ticket",
    "is_final": false
  },
  {
    "id": "resolved",
    "name": "Resuelto",
    "color": "#1abc9c",
    "description": "Problema resuelto",
    "is_final": false
  },
  {
    "id": "closed",
    "name": "Cerrado",
    "color": "#27ae60",
    "description": "Ticket cerrado y finalizado",
    "is_final": true
  }
]
```

**Uso:** Para mostrar badges de colores en el frontend.

---

### 8. Prioridades Disponibles

**Endpoint:** `GET /tickets/priorities/`

**Headers:** No requiere autenticación

**Response (200 OK):**
```json
[
  {
    "id": "low",
    "name": "Baja",
    "level": 1,
    "color": "#95a5a6",
    "description": "Problema menor sin urgencia"
  },
  {
    "id": "medium",
    "name": "Media",
    "level": 2,
    "color": "#3498db",
    "description": "Problema estándar"
  },
  {
    "id": "high",
    "name": "Alta",
    "level": 3,
    "color": "#f39c12",
    "description": "Problema importante"
  },
  {
    "id": "urgent",
    "name": "Urgente",
    "level": 4,
    "color": "#e74c3c",
    "description": "Problema crítico"
  }
]
```

---

## 🎨 Componentes Frontend Sugeridos

### Para Distribuidoras (Público + Portal Cliente)

1. **Landing Page** (`/`)
   - Catálogo de productos (público)
   - Información de la empresa
   - Botón de "Crear Ticket" y "Portal Cliente"

2. **Catálogo de Productos** (`/productos`)
   - Grid de productos con paginación
   - Filtros por marca/categoría
   - Búsqueda
   - Ver detalle de producto
   - NO requiere login

3. **Crear Ticket** (`/crear-ticket`) ⭐
   - Formulario público (sin login)
   - Datos de contacto
   - Descripción del problema
   - Producto afectado

4. **Login** (`/login`)
   - Username y password
   - Recuperar contraseña

5. **Portal Cliente** (`/portal`)
   - Dashboard con tickets de la distribuidora
   - Filtros y búsqueda
   - Adjuntar archivos
   - Ver estado en tiempo real

### Para Backoffice LAQQ (Admin/BackOffice)

1. **Dashboard** (`/admin/dashboard`)
   - Estadísticas generales
   - Métricas de ventas
   - Tickets pendientes
   - Contactos nuevos

2. **Productos** (`/admin/productos`)
   - Lista completa de productos
   - CRUD de productos
   - Gestión de stock
   - Marcas y categorías

3. **Contactos/CRM** (`/admin/contactos`)
   - Lista de distribuidoras
   - Estados de contactos
   - Asignación a vendedores
   - Historial de cotizaciones

4. **Cotizaciones** (`/admin/cotizaciones`)
   - Crear nueva cotización
   - Ver/editar cotizaciones
   - Enviar por email
   - Agregar/quitar productos

5. **Tickets** (`/admin/tickets`)
   - Ver todos los tickets
   - Asignar a técnicos
   - Cambiar estados
   - Resolver/cerrar tickets

---

## 🔐 Manejo de Autenticación

### Guard/Middleware para rutas protegidas

```javascript
// auth.js
export const isAuthenticated = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return false;

  // Verificar si el token expiró
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.location.href = '/login';
};
```

### Interceptor para renovar token automáticamente

```javascript
// api.js
const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// Request interceptor - agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - renovar token si expiró
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es 401 y no hemos intentado renovar
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh = localStorage.getItem('refresh_token');
        const { data } = await axios.post('http://localhost:8000/users/token/refresh/', {
          refresh
        });

        localStorage.setItem('access_token', data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;

        return api(originalRequest);
      } catch {
        logout();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## ✅ Checklist de Integración

### Backend (Ya listo ✅)
- [x] API REST completa funcionando
- [x] CORS configurado
- [x] JWT implementado
- [x] Todos los módulos documentados
- [x] Paginación en todos los listados
- [x] Filtros y búsqueda
- [x] Sistema de permisos por rol
- [x] Creación automática de usuarios (tickets)
- [x] Envío de emails (tickets y cotizaciones)

### Frontend - Módulo Autenticación
- [ ] Configurar `REACT_APP_API_URL=http://localhost:8000`
- [ ] Implementar login con JWT
- [ ] Guardar tokens en localStorage
- [ ] Implementar refresh token automático con interceptor
- [ ] Manejo de logout
- [ ] Guards para rutas protegidas

### Frontend - Módulo Productos (Público)
- [ ] Listar productos con paginación
- [ ] Filtros por marca/categoría
- [ ] Búsqueda de productos
- [ ] Ver detalle de producto
- [ ] Mostrar stock disponible

### Frontend - Módulo Contactos (Admin/BackOffice)
- [ ] Listar contactos/distribuidoras
- [ ] Crear nuevo contacto
- [ ] Editar contacto
- [ ] Filtros por estado
- [ ] Asignar a vendedor

### Frontend - Módulo Cotizaciones (Admin/BackOffice)
- [ ] Listar cotizaciones
- [ ] Crear nueva cotización
- [ ] Agregar productos a cotización
- [ ] Calcular totales con descuentos
- [ ] Enviar cotización por email
- [ ] Filtros por estado

### Frontend - Módulo Tickets
- [ ] Página pública de crear ticket (sin login)
- [ ] Portal cliente: login con credenciales
- [ ] Portal cliente: listar tickets propios
- [ ] Portal cliente: ver detalle de ticket
- [ ] Portal cliente: adjuntar archivos
- [ ] Backoffice: ver todos los tickets
- [ ] Backoffice: asignar técnico
- [ ] Backoffice: cambiar estados
- [ ] Badges de colores para estados/prioridades

### Frontend - Dashboard (Admin/BackOffice)
- [ ] Estadísticas generales
- [ ] Gráficos de métricas
- [ ] Resumen de productos/contactos/cotizaciones/tickets

### Frontend - General
- [ ] Manejo de errores (401, 403, 404)
- [ ] Loading states en todos los módulos
- [ ] Mensajes de éxito/error (toast notifications)
- [ ] Paginación en todos los listados
- [ ] Responsive design
- [ ] Validación de formularios

---

## 💡 Ejemplos de Integración

### Ejemplo 1: Catálogo de Productos (React)

```jsx
import { useState, useEffect } from 'react';

function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    brand: '',
    category: ''
  });

  useEffect(() => {
    loadProducts();
  }, [page, filters]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        page_size: 20,
        ...filters
      });

      const response = await fetch(
        `http://localhost:8000/products/list/?${params}`
      );
      const data = await response.json();

      setProducts(data.results);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Catálogo de Productos</h1>

      {/* Filtros */}
      <input
        type="text"
        placeholder="Buscar productos..."
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
      />

      {/* Grid de productos */}
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <div className="product-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p className="price">${product.price}</p>
              <p className="stock">Stock: {product.stock}</p>
              <button>Ver Detalle</button>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      <div>
        <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
          Anterior
        </button>
        <span>Página {page}</span>
        <button onClick={() => setPage(p => p + 1)}>
          Siguiente
        </button>
      </div>
    </div>
  );
}
```

### Ejemplo 2: Crear Cotización (Admin)

```jsx
function CreateQuote() {
  const [quote, setQuote] = useState({
    contact: '',
    notes: '',
    valid_until: ''
  });
  const [items, setItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const createQuote = async () => {
    const token = localStorage.getItem('access_token');

    // 1. Crear cotización
    const quoteResponse = await fetch('http://localhost:8000/quotes/list/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(quote)
    });

    const createdQuote = await quoteResponse.json();

    // 2. Agregar items
    for (const item of items) {
      await fetch('http://localhost:8000/quotes/items/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quote: createdQuote.id,
          product: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
          discount_percent: item.discount
        })
      });
    }

    // 3. Enviar por email
    await fetch(`http://localhost:8000/quotes/${createdQuote.id}/send_email/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    alert('Cotización creada y enviada!');
  };

  return (
    <div>
      <h1>Nueva Cotización</h1>

      {/* Formulario básico */}
      <select
        value={quote.contact}
        onChange={(e) => setQuote({ ...quote, contact: e.target.value })}
      >
        <option value="">Seleccionar Distribuidora...</option>
        {/* Cargar contactos aquí */}
      </select>

      <textarea
        placeholder="Notas..."
        value={quote.notes}
        onChange={(e) => setQuote({ ...quote, notes: e.target.value })}
      />

      <input
        type="date"
        value={quote.valid_until}
        onChange={(e) => setQuote({ ...quote, valid_until: e.target.value })}
      />

      {/* Lista de items */}
      <h3>Productos</h3>
      {items.map((item, index) => (
        <div key={index}>
          <span>{item.product.name}</span>
          <span>x{item.quantity}</span>
          <span>${item.product.price * item.quantity}</span>
        </div>
      ))}

      {/* Agregar producto */}
      <button onClick={() => {
        setItems([...items, {
          product: selectedProduct,
          quantity,
          discount: 0
        }]);
      }}>
        Agregar Producto
      </button>

      <button onClick={createQuote}>Crear y Enviar Cotización</button>
    </div>
  );
}
```

### Ejemplo 3: Portal Cliente - Ver Tickets

```jsx
function ClientPortal() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch('http://localhost:8000/tickets/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setTickets(data.results);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (stateId) => {
    const colors = {
      'new': '#3498db',
      'in_progress': '#9b59b6',
      'resolved': '#1abc9c',
      'closed': '#27ae60'
    };
    return colors[stateId] || '#95a5a6';
  };

  return (
    <div>
      <h1>Mis Tickets</h1>

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <div>
          {tickets.map(ticket => (
            <div key={ticket.id} className="ticket-card">
              <div className="ticket-header">
                <h3>{ticket.ticket_number}</h3>
                <span
                  className="badge"
                  style={{ backgroundColor: getStatusColor(ticket.state.id) }}
                >
                  {ticket.state.name}
                </span>
              </div>

              <div className="ticket-body">
                <p><strong>Producto:</strong> {ticket.product_name}</p>
                <p><strong>Descripción:</strong> {ticket.description}</p>
                <p><strong>Prioridad:</strong> {ticket.priority.name}</p>
                <p><strong>Creado:</strong> {new Date(ticket.created_at).toLocaleDateString()}</p>
              </div>

              <button onClick={() => window.location.href = `/portal/ticket/${ticket.id}`}>
                Ver Detalle
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Ejemplo 4: Upload de Archivo

```jsx
function TicketFileUpload({ ticketId }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadFile = async () => {
    if (!file) return;

    setUploading(true);

    // Convertir a base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];
      const token = localStorage.getItem('access_token');

      try {
        const response = await fetch(
          `http://localhost:8000/tickets/${ticketId}/attach_file/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              file_name: file.name,
              content_type: file.type,
              data: base64
            })
          }
        );

        const result = await response.json();
        alert('Archivo adjuntado correctamente!');
      } catch (error) {
        console.error('Error:', error);
        alert('Error al subir archivo');
      } finally {
        setUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={uploadFile} disabled={!file || uploading}>
        {uploading ? 'Subiendo...' : 'Adjuntar Archivo'}
      </button>
    </div>
  );
}
```

---

## 🚨 Errores Comunes

### 1. CORS Error

**Error:**
```
Access to fetch at 'http://localhost:8000/tickets/' from origin 'http://localhost:3000'
has been blocked by CORS policy
```

**Solución:**
Verificá que tu puerto esté en la lista de `CORS_ALLOWED_ORIGINS` del backend. Si usás otro puerto, avisame.

---

### 2. 401 Unauthorized

**Causa:** Token expirado o inválido.

**Solución:** Implementar el interceptor de refresh token (ver arriba).

---

### 3. 403 Forbidden

**Causa:** Intentando acceder a un recurso sin permisos (ej: ticket de otra distribuidora).

**Solución:** El backend ya filtra automáticamente. Si ves este error, es que algo está mal en el request.

---

### 4. 404 Not Found

**Causa:** El ticket no existe o no pertenece a la distribuidora logueada.

**Solución:** Verificar que el ID sea correcto.

---

## 📞 Contacto

Si tenés dudas o problemas con la integración:

1. Revisá esta documentación
2. Probá los endpoints en Swagger: `http://localhost:8000/swagger/`
3. Revisá la consola del backend para ver logs
4. Contactame con el error específico

---

## 🔗 Links Útiles

- **Swagger UI:** http://localhost:8000/swagger/
- **Admin Django:** http://localhost:8000/admin/
- **Documentación API completa:** [docs/API.md](API.md)
- **Documentación Portal Cliente:** [docs/TICKETS_CLIENT_PORTAL.md](TICKETS_CLIENT_PORTAL.md)

---

**Autor:** Claude Code
**Última actualización:** 2026-02-04
**Estado:** ✅ Backend listo para integración
