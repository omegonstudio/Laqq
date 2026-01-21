# Endpoint Bulk para Gestión de Items de Cotización

## POST /quotes/items/bulk/

Este endpoint permite **crear y/o actualizar** múltiples items de cotización en una sola petición HTTP.

### Comportamiento Inteligente:
- **Items sin `id`**: Se crean como nuevos
- **Items con `id`**: Se actualizan los existentes
- **Operación mixta**: Puedes crear y actualizar en la misma petición

### URL
```
POST http://localhost:8000/quotes/items/bulk/
```

### Autenticación
Requiere autenticación mediante token JWT en el header:
```
Authorization: Bearer <tu-token-jwt>
```

### Request Body - Crear Items (sin `id`)

```json
{
  "data": [
    {
      "quote": "uuid-de-cotización",      // Requerido para crear
      "product": "uuid-de-producto",      // Requerido para crear
      "quantity": 2,                      // Requerido
      "unit_price": "100.50",             // Requerido
      "subtotal": "201.00"                // Opcional - se calcula automáticamente
    },
    {
      "quote": "uuid-de-cotización",
      "product": "uuid-de-producto-2",
      "quantity": 1,
      "unit_price": "50.00"
      // subtotal se calculará automáticamente como quantity * unit_price
    }
  ]
}
```

### Request Body - Actualizar Items (con `id`)

```json
{
  "data": [
    {
      "id": "uuid-del-item-existente",    // Con ID = actualiza
      "quantity": 5                        // Solo campos que quieres cambiar
      // No necesitas enviar quote, product si no cambian
    },
    {
      "id": "uuid-otro-item",
      "unit_price": "200.00"              // Solo actualiza el precio
    }
  ]
}
```

### Request Body - Operación Mixta (crear + actualizar)

```json
{
  "data": [
    {
      "id": "uuid-item-existente",        // Actualizar este
      "quantity": 3
    },
    {
      "quote": "uuid-de-cotización",      // Crear este nuevo
      "product": "uuid-producto-nuevo",
      "quantity": 1,
      "unit_price": "75.00"
    }
  ]
}
```

### Response - Solo Creación (201 Created)

```json
{
  "message": "2 item(s) processed: 2 created",
  "created": [
    {
      "id": "uuid-generado-1",
      "quote": "uuid-de-cotización",
      "product": "uuid-de-producto",
      "quantity": 2,
      "unit_price": "100.50",
      "subtotal": "201.00",
      "created_at": "2026-01-19T13:45:00Z"
    }
  ],
  "updated": [],
  "items": [ /* todos los items */ ]
}
```

### Response - Solo Actualización (200 OK)

```json
{
  "message": "2 item(s) processed: 2 updated",
  "created": [],
  "updated": [
    {
      "id": "uuid-del-item",
      "quote": "uuid-de-cotización",
      "product": "uuid-de-producto",
      "quantity": 5,                      // Actualizado
      "unit_price": "200.00",             // Actualizado
      "subtotal": "1000.00",              // Re-calculado
      "created_at": "2026-01-19T13:45:00Z"
    }
  ],
  "items": [ /* todos los items */ ]
}
```

### Response - Operación Mixta (201 Created)

```json
{
  "message": "3 item(s) processed: 1 created, 2 updated",
  "created": [ /* items creados */ ],
  "updated": [ /* items actualizados */ ],
  "items": [ /* todos los items */ ]
}
```

### Validaciones

- **quantity**: Debe ser mayor a 0
- **unit_price**: No puede ser negativo
- **subtotal**: No puede ser negativo (si se provee manualmente)
- **quote**: Debe ser un UUID válido de una cotización existente
- **product**: Debe ser un UUID válido de un producto existente

### Errores Comunes

#### 400 Bad Request - Validación fallida
```json
{
  "data": [
    {
      "quantity": ["Quantity must be greater than 0"]
    }
  ]
}
```

#### 401 Unauthorized - Sin autenticación
```json
{
  "detail": "Las credenciales de autenticación no se proveyeron."
}
```

### Ejemplos de Uso

#### JavaScript/Fetch
```javascript
const createQuoteItems = async (items) => {
  const response = await fetch('http://localhost:8000/quotes/items/bulk/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${yourToken}`
    },
    body: JSON.stringify({ data: items })
  });

  if (!response.ok) {
    throw new Error('Failed to create quote items');
  }

  return await response.json();
};

// Uso
const items = [
  {
    quote: "123e4567-e89b-12d3-a456-426614174000",
    product: "223e4567-e89b-12d3-a456-426614174001",
    quantity: 5,
    unit_price: "75.50"
  },
  {
    quote: "123e4567-e89b-12d3-a456-426614174000",
    product: "323e4567-e89b-12d3-a456-426614174002",
    quantity: 3,
    unit_price: "120.00"
  }
];

createQuoteItems(items)
  .then(result => console.log('Created:', result))
  .catch(error => console.error('Error:', error));
```

#### cURL
```bash
curl -X POST http://localhost:8000/quotes/items/bulk/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "data": [
      {
        "quote": "123e4567-e89b-12d3-a456-426614174000",
        "product": "223e4567-e89b-12d3-a456-426614174001",
        "quantity": 5,
        "unit_price": "75.50"
      }
    ]
  }'
```

## Comparación con el Endpoint Individual

### Endpoint Individual (POST /quotes/items/)
- Crea **1 item** por petición
- Formato: objeto directo
```json
{
  "quote": "uuid",
  "product": "uuid",
  "quantity": 1,
  "unit_price": "100.00"
}
```

### Endpoint Bulk (POST /quotes/items/bulk/)
- Crea **múltiples items** en una petición
- Formato: array dentro de campo "data"
```json
{
  "data": [
    { "quote": "uuid", "product": "uuid", ... },
    { "quote": "uuid", "product": "uuid", ... }
  ]
}
```

## Ventajas del Endpoint Bulk

1. **Rendimiento**: Reduce la cantidad de peticiones HTTP
2. **Flexibilidad**: Crea, actualiza, o ambos en una sola petición
3. **Inteligente**: Detecta automáticamente si debe crear o actualizar según la presencia del campo `id`
4. **Eficiente**: Valida todo antes de ejecutar cambios

## Flujo Completo de Cotizaciones

### Paso 1: Crear la Cotización

```javascript
// POST /quotes/list/
const quote = await fetch('http://localhost:8000/quotes/list/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    contact: "uuid-del-contacto",
    quote_type: "standard",
    state: "draft",
    message: "Cotización urgente"
  })
}).then(r => r.json());

// Guardar el ID de la cotización
const quoteId = quote.id;  // "abc12345-..."
```

### Paso 2: Agregar Productos en Bulk

```javascript
// POST /quotes/items/bulk/
await fetch('http://localhost:8000/quotes/items/bulk/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    data: [
      {
        quote: quoteId,           // Usar el ID guardado
        product: "prod-uuid-1",
        quantity: 5,
        unit_price: "150.50"
      },
      {
        quote: quoteId,
        product: "prod-uuid-2",
        quantity: 2,
        unit_price: "99.99"
      }
    ]
  })
}).then(r => r.json());
```

### Paso 3: Consultar la Cotización Completa

```javascript
// GET /quotes/list/{id}/
const fullQuote = await fetch(`http://localhost:8000/quotes/list/${quoteId}/`, {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
}).then(r => r.json());

// fullQuote.items contiene todos los productos automáticamente
console.log(fullQuote.items);
```

### Paso 4: Actualizar Items Existentes

```javascript
// POST /quotes/items/bulk/
await fetch('http://localhost:8000/quotes/items/bulk/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    data: fullQuote.items.map(item => ({
      id: item.id,                // Con ID = actualiza
      quantity: item.quantity + 1  // Incrementar cantidad
    }))
  })
}).then(r => r.json());
```

### Paso 5: Operación Mixta (Crear + Actualizar)

```javascript
// POST /quotes/items/bulk/
await fetch('http://localhost:8000/quotes/items/bulk/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    data: [
      // Actualizar item existente
      {
        id: fullQuote.items[0].id,
        quantity: 10
      },
      // Crear nuevo item
      {
        quote: quoteId,
        product: "prod-uuid-3",
        quantity: 1,
        unit_price: "299.00"
      }
    ]
  })
}).then(r => r.json());
```

## Relación entre Endpoints

```
Quote (Cotización) ← POST /quotes/list/
    ↓ quote_id (FK)
QuoteItem 1 ←──┐
QuoteItem 2 ←──┼── POST /quotes/items/bulk/
QuoteItem 3 ←──┘
```

**La clave:** El campo `quote` en cada `QuoteItem` conecta el producto con su cotización padre.

## Notas Técnicas

- El cálculo de `subtotal` es automático si no se provee
- La validación se aplica a cada item individualmente
- Los errores de validación se reportan por item
- Items sin `id`: se crean nuevos (requieren `quote` y `product`)
- Items con `id`: se actualizan (solo envía campos a cambiar)
- Puedes mezclar creación y actualización en la misma petición
- Status code 201 si se creó algo, 200 si solo se actualizó
