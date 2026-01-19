# Endpoint Bulk para Creación de Items de Cotización

## POST /quotes/items/bulk/

Este endpoint permite crear múltiples items de cotización en una sola petición HTTP.

### URL
```
POST http://localhost:8000/quotes/items/bulk/
```

### Autenticación
Requiere autenticación mediante token JWT en el header:
```
Authorization: Bearer <tu-token-jwt>
```

### Request Body

```json
{
  "data": [
    {
      "quote": "uuid-de-cotización",
      "product": "uuid-de-producto",
      "quantity": 2,
      "unit_price": "100.50",
      "subtotal": "201.00"  // Opcional - se calcula automáticamente si no se provee
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

### Response (201 Created)

```json
{
  "message": "2 item(s) created successfully",
  "items": [
    {
      "id": "uuid-generado-1",
      "quote": "uuid-de-cotización",
      "product": "uuid-de-producto",
      "quantity": 2,
      "unit_price": "100.50",
      "subtotal": "201.00",
      "created_at": "2026-01-19T13:45:00Z"
    },
    {
      "id": "uuid-generado-2",
      "quote": "uuid-de-cotización",
      "product": "uuid-de-producto-2",
      "quantity": 1,
      "unit_price": "50.00",
      "subtotal": "50.00",
      "created_at": "2026-01-19T13:45:00Z"
    }
  ]
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
2. **Atomicidad**: Si un item falla la validación, todos los items fallan
3. **Simplicidad**: Un solo request para múltiples productos

## Notas Técnicas

- El cálculo de `subtotal` es automático si no se provee
- La validación se aplica a cada item individualmente
- Los errores de validación se reportan por item
- La operación es transaccional (all-or-nothing)
