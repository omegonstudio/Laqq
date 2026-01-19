# 📋 Sistema de Cotizaciones (Quotes)

## Índice
- [Visión General](#visión-general)
- [Modelo de Datos](#modelo-de-datos)
- [Endpoints API](#endpoints-api)
- [Flujo Completo](#flujo-completo)
- [Endpoint Bulk](#endpoint-bulk)
- [Ejemplos de Código](#ejemplos-de-código)
- [Validaciones](#validaciones)
- [Notificaciones Email](#notificaciones-email)

---

## Visión General

El sistema de cotizaciones maneja el ciclo completo desde la creación de una cotización hasta su aprobación, incluyendo:

- ✅ Creación y gestión de cotizaciones (Quote)
- ✅ Gestión de items/productos dentro de cada cotización (QuoteItem)
- ✅ Numeración automática de cotizaciones (formato: `Q-YYYY-NNNNN`)
- ✅ Cálculo automático de subtotales
- ✅ Operaciones bulk (crear/actualizar múltiples items en una petición)
- ✅ Notificaciones automáticas por email
- ✅ Estados y tipos configurables

---

## Modelo de Datos

### Quote (Cotización)

```python
Quote
├── id (UUID, PK)
├── quote_number (String, auto-generado, único)
├── contact (FK → Contact)
├── user (FK → User, opcional)
├── quote_type (FK → QuoteType)
├── state (FK → QuoteState)
├── message (Text, opcional)
├── total_amount (Decimal, opcional)
├── created_at (DateTime)
├── updated_at (DateTime)
└── items (Reverse FK → QuoteItem[])
```

### QuoteItem (Item de Cotización)

```python
QuoteItem
├── id (UUID, PK)
├── quote (FK → Quote)
├── product (FK → Product)
├── quantity (Integer, >0)
├── unit_price (Decimal, ≥0)
├── subtotal (Decimal, auto-calculado)
└── created_at (DateTime)
```

### QuoteType (Tipo de Cotización)

```python
QuoteType
├── id (String, PK)
├── name (String, único)
├── description (Text, opcional)
└── created_at (DateTime)
```

Ejemplos: `standard`, `express`, `custom`

### QuoteState (Estado de Cotización)

```python
QuoteState
├── id (String, PK)
├── name (String, único)
├── color (String, opcional)
├── description (Text, opcional)
└── created_at (DateTime)
```

Ejemplos: `draft`, `sent`, `approved`, `rejected`

---

## Endpoints API

### Cotizaciones (Quote)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/quotes/list/` | GET | Listar todas las cotizaciones |
| `/quotes/list/` | POST | Crear nueva cotización |
| `/quotes/list/{id}/` | GET | Obtener cotización con items |
| `/quotes/list/{id}/` | PUT/PATCH | Actualizar cotización |
| `/quotes/list/{id}/` | DELETE | Eliminar cotización |

**Filtros disponibles:**
- `?contact={uuid}` - Por contacto
- `?user={uuid}` - Por usuario asignado
- `?quote_type={id}` - Por tipo
- `?state={id}` - Por estado
- `?search={text}` - Buscar en quote_number o message

### Items de Cotización (QuoteItem)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/quotes/items/` | GET | Listar todos los items |
| `/quotes/items/` | POST | Crear item individual |
| `/quotes/items/{id}/` | GET | Obtener item |
| `/quotes/items/{id}/` | PUT/PATCH | Actualizar item |
| `/quotes/items/{id}/` | DELETE | Eliminar item |
| **`/quotes/items/bulk/`** | **POST** | **Crear/Actualizar múltiples items** |

**Filtros disponibles:**
- `?quote={uuid}` - Items de una cotización específica

### Tipos y Estados

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/quotes/types/` | GET | Listar tipos de cotización |
| `/quotes/types/` | POST | Crear tipo |
| `/quotes/states/` | GET | Listar estados |
| `/quotes/states/` | POST | Crear estado |

---

## Flujo Completo

### 📝 Paso 1: Crear la Cotización

```javascript
// POST /quotes/list/
const response = await fetch('http://localhost:8000/quotes/list/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    contact: "uuid-del-contacto",        // Requerido
    quote_type: "standard",              // Requerido
    state: "draft",                      // Requerido
    user: "uuid-del-usuario",            // Opcional
    message: "Cotización urgente"        // Opcional
  })
});

const quote = await response.json();
const quoteId = quote.id;  // Guardar este ID

console.log(quote);
```

**Response:**
```json
{
  "id": "abc12345-1234-1234-1234-123456789abc",
  "quote_number": "Q-2026-00001",
  "contact": "uuid-del-contacto",
  "quote_type": "standard",
  "state": "draft",
  "user": "uuid-del-usuario",
  "message": "Cotización urgente",
  "total_amount": "0.00",
  "items": [],
  "created_at": "2026-01-19T14:30:00Z",
  "updated_at": "2026-01-19T14:30:00Z"
}
```

---

### 🛒 Paso 2: Agregar Productos en Bulk

```javascript
// POST /quotes/items/bulk/
const response = await fetch('http://localhost:8000/quotes/items/bulk/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    data: [
      {
        quote: quoteId,
        product: "prod-uuid-1",
        quantity: 5,
        unit_price: "150.50"
      },
      {
        quote: quoteId,
        product: "prod-uuid-2",
        quantity: 2,
        unit_price: "99.99"
      },
      {
        quote: quoteId,
        product: "prod-uuid-3",
        quantity: 1,
        unit_price: "299.00"
      }
    ]
  })
});

const result = await response.json();
console.log(result);
```

**Response:**
```json
{
  "message": "3 item(s) processed: 3 created",
  "created": [
    {
      "id": "item-uuid-1",
      "quote": "abc12345-...",
      "product": "prod-uuid-1",
      "quantity": 5,
      "unit_price": "150.50",
      "subtotal": "752.50",
      "created_at": "2026-01-19T14:31:00Z"
    },
    // ... más items
  ],
  "updated": [],
  "items": [ /* todos los items */ ]
}
```

---

### 👁️ Paso 3: Consultar Cotización Completa

```javascript
// GET /quotes/list/{id}/
const response = await fetch(`http://localhost:8000/quotes/list/${quoteId}/`, {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const fullQuote = await response.json();
console.log(fullQuote.items);  // Todos los productos incluidos
```

**Response:**
```json
{
  "id": "abc12345-...",
  "quote_number": "Q-2026-00001",
  "contact": "uuid-del-contacto",
  "quote_type": "standard",
  "state": "draft",
  "total_amount": "1151.49",
  "items": [
    {
      "id": "item-uuid-1",
      "product": "prod-uuid-1",
      "quantity": 5,
      "unit_price": "150.50",
      "subtotal": "752.50"
    },
    {
      "id": "item-uuid-2",
      "product": "prod-uuid-2",
      "quantity": 2,
      "unit_price": "99.99",
      "subtotal": "199.98"
    },
    {
      "id": "item-uuid-3",
      "product": "prod-uuid-3",
      "quantity": 1,
      "unit_price": "299.00",
      "subtotal": "299.00"
    }
  ],
  "created_at": "2026-01-19T14:30:00Z",
  "updated_at": "2026-01-19T14:31:00Z"
}
```

---

### ✏️ Paso 4: Actualizar Items Existentes

```javascript
// POST /quotes/items/bulk/
const response = await fetch('http://localhost:8000/quotes/items/bulk/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    data: [
      {
        id: "item-uuid-1",     // Con ID = actualiza
        quantity: 10           // Solo cambiar cantidad
      },
      {
        id: "item-uuid-2",
        unit_price: "89.99"    // Solo cambiar precio
      }
    ]
  })
});

const result = await response.json();
```

**Response:**
```json
{
  "message": "2 item(s) processed: 2 updated",
  "created": [],
  "updated": [
    {
      "id": "item-uuid-1",
      "quantity": 10,
      "unit_price": "150.50",
      "subtotal": "1505.00"    // Re-calculado
    },
    {
      "id": "item-uuid-2",
      "quantity": 2,
      "unit_price": "89.99",
      "subtotal": "179.98"
    }
  ],
  "items": [ /* todos los items */ ]
}
```

---

### 🔄 Paso 5: Operación Mixta (Crear + Actualizar)

```javascript
// POST /quotes/items/bulk/
const response = await fetch('http://localhost:8000/quotes/items/bulk/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    data: [
      // Actualizar item existente
      {
        id: "item-uuid-1",
        quantity: 3
      },
      // Crear nuevo item
      {
        quote: quoteId,
        product: "prod-uuid-4",
        quantity: 1,
        unit_price: "45.00"
      }
    ]
  })
});
```

**Response:**
```json
{
  "message": "2 item(s) processed: 1 created, 1 updated",
  "created": [ /* items nuevos */ ],
  "updated": [ /* items actualizados */ ],
  "items": [ /* todos los items */ ]
}
```

---

## Endpoint Bulk

### Características

- **Inteligente**: Detecta automáticamente si crear o actualizar según presencia del campo `id`
- **Flexible**: Puede mezclar creación y actualización en la misma petición
- **Eficiente**: Una sola petición HTTP para múltiples operaciones
- **Validado**: Valida todos los items antes de ejecutar cambios

### Reglas de Negocio

| Campo `id` | Campos Requeridos | Acción |
|------------|-------------------|--------|
| ❌ No presente | `quote`, `product`, `quantity`, `unit_price` | **CREAR** nuevo item |
| ✅ Presente | Solo los que quieras cambiar | **ACTUALIZAR** item existente |

### Ejemplos

#### Crear Items
```json
{
  "data": [
    {
      "quote": "uuid",
      "product": "uuid",
      "quantity": 2,
      "unit_price": "100.00"
    }
  ]
}
```

#### Actualizar Items
```json
{
  "data": [
    {
      "id": "item-uuid",
      "quantity": 5
    }
  ]
}
```

#### Mixto
```json
{
  "data": [
    {
      "id": "item-uuid-1",
      "quantity": 3
    },
    {
      "quote": "quote-uuid",
      "product": "prod-uuid",
      "quantity": 1,
      "unit_price": "50.00"
    }
  ]
}
```

---

## Ejemplos de Código

### React/TypeScript

```typescript
interface QuoteItem {
  id?: string;
  quote?: string;
  product: string;
  quantity: number;
  unit_price: string;
  subtotal?: string;
}

// Crear cotización con items
async function createQuoteWithItems(
  contactId: string,
  items: QuoteItem[]
) {
  // 1. Crear cotización
  const quote = await fetch('/quotes/list/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      contact: contactId,
      quote_type: 'standard',
      state: 'draft'
    })
  }).then(r => r.json());

  // 2. Agregar items
  const result = await fetch('/quotes/items/bulk/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      data: items.map(item => ({
        quote: quote.id,
        product: item.product,
        quantity: item.quantity,
        unit_price: item.unit_price
      }))
    })
  }).then(r => r.json());

  return { quote, items: result.items };
}

// Actualizar cantidades
async function updateItemQuantities(
  items: QuoteItem[],
  incrementBy: number
) {
  return await fetch('/quotes/items/bulk/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      data: items.map(item => ({
        id: item.id,
        quantity: item.quantity + incrementBy
      }))
    })
  }).then(r => r.json());
}
```

---

## Validaciones

### Quote

- ✅ `contact` es requerido
- ✅ `quote_type` es requerido
- ✅ `state` es requerido
- ✅ `quote_number` se auto-genera (formato: `Q-YYYY-NNNNN`)
- ✅ `total_amount` no puede ser negativo

### QuoteItem

- ✅ `quote` es requerido (para creación)
- ✅ `product` es requerido (para creación)
- ✅ `quantity` debe ser > 0
- ✅ `unit_price` debe ser ≥ 0
- ✅ `subtotal` se calcula automáticamente si no se provee
- ✅ Al actualizar, solo necesitas enviar los campos que quieras cambiar

---

## Notificaciones Email

### Eventos que Disparan Emails

1. **Creación de Cotización** (`POST /quotes/list/`)
   - Email al negocio (notificación interna)
   - Email al cliente (confirmación)

2. **Actualización de Estado**
   - Email al negocio
   - Email al cliente (si corresponde)

### Contenido de Emails

**Email al Negocio:**
- Número de cotización
- Datos del contacto
- Tipo y estado
- Usuario asignado
- Mensaje del cliente
- Enlace al admin

**Email al Cliente:**
- Número de cotización
- Confirmación de recepción
- Próximos pasos
- Datos de contacto del negocio

### Configuración

Los emails se envían automáticamente mediante señales de Django:
- Ver: `quotes/signals.py`
- Plantillas: `quotes/templates/emails/`

---

## Relación entre Entidades

```
Contact (Cliente)
    ↓ 1:N
Quote (Cotización)
    ↓ 1:N
QuoteItem (Producto)
    ↓ N:1
Product
```

**Clave:** El campo `quote` (FK) en `QuoteItem` conecta cada producto con su cotización padre.

---

## Tests

El sistema incluye tests completos:

```bash
# Ejecutar todos los tests de quotes
python manage.py test quotes

# Tests específicos del endpoint bulk
python manage.py test quotes.tests.QuoteItemAPITestCase
```

**Cobertura:**
- ✅ Creación de cotizaciones
- ✅ Auto-generación de quote_number
- ✅ Creación de items individuales
- ✅ Creación bulk de items
- ✅ Actualización bulk de items
- ✅ Operación mixta (crear + actualizar)
- ✅ Validaciones
- ✅ Cálculo de subtotales
- ✅ Notificaciones email

---

## Más Información

Para más detalles sobre el endpoint bulk:
- [QUOTES_BULK_ENDPOINT.md](./QUOTES_BULK_ENDPOINT.md)

Para integración con el frontend:
- [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)
