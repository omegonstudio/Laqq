# Tests Manuales - Endpoints Públicos

**Fecha:** 2026-01-20

Este documento contiene comandos `curl` para probar manualmente los endpoints públicos de la API.

---

## ✅ Tests Automatizados

Primero, ejecuta los tests automatizados:

```bash
cd Backend
python manage.py test quotes.tests.PublicEndpointsTestCase quotes.tests.PublicProductEndpointsTestCase -v 2
```

Deberías ver:
```
Ran 10 tests in 0.1s
OK
*** TODOS LOS TESTS PASARON CORRECTAMENTE ***
```

---

## 🧪 Tests Manuales con cURL

### Prerequisitos

1. **Servidor corriendo:**
```bash
cd Backend
python manage.py runserver
```

2. **Datos de prueba creados:**
```bash
python manage.py loaddata fixtures/initial_data.json
# O crear manualmente via admin
```

---

## 📦 Productos (Públicos)

### ✅ GET /products/brands/ (Sin autenticación)

```bash
curl -X GET http://localhost:8000/products/brands/ \
  -H "Content-Type: application/json"
```

**Resultado esperado:** `200 OK` con lista de marcas

---

### ✅ GET /products/categories/ (Sin autenticación)

```bash
curl -X GET http://localhost:8000/products/categories/ \
  -H "Content-Type: application/json"
```

**Resultado esperado:** `200 OK` con lista de categorías

---

### ✅ GET /products/list/ (Sin autenticación)

```bash
curl -X GET http://localhost:8000/products/list/ \
  -H "Content-Type: application/json"
```

**Resultado esperado:** `200 OK` con lista paginada de productos

---

### 🔒 POST /products/list/ (Requiere autenticación - DEBE FALLAR)

```bash
curl -X POST http://localhost:8000/products/list/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "brand": "uuid-brand",
    "category": "uuid-category"
  }'
```

**Resultado esperado:** `401 Unauthorized` o `403 Forbidden`

```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## 💰 Cotizaciones (Públicas)

### ✅ POST /quotes/list/ (Sin autenticación - DEBE FUNCIONAR)

**Paso 1:** Obtener IDs necesarios

```bash
# Obtener contact_id
curl -X GET http://localhost:8000/contacts/list/ \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.results[0].id'

# Obtener quote_type_id
curl -X GET http://localhost:8000/quotes/types/ | jq '.results[0].id'

# Obtener quote_state_id
curl -X GET http://localhost:8000/quotes/states/ | jq '.results[0].id'
```

**Paso 2:** Crear cotización sin token

```bash
curl -X POST http://localhost:8000/quotes/list/ \
  -H "Content-Type: application/json" \
  -d '{
    "contact": "CONTACT_UUID_AQUI",
    "quote_type": "standard",
    "state": "draft",
    "total_amount": 1000.00,
    "message": "Cotización de prueba desde curl"
  }'
```

**Resultado esperado:** `201 Created`

```json
{
  "id": "uuid...",
  "quote_number": "Q-2026-00001",
  "contact": {...},
  "state": {...},
  "total_amount": "1000.00",
  "created_at": "2026-01-20T10:00:00Z"
}
```

---

### ✅ POST /quotes/items/ (Sin autenticación - DEBE FUNCIONAR)

```bash
curl -X POST http://localhost:8000/quotes/items/ \
  -H "Content-Type: application/json" \
  -d '{
    "quote": "QUOTE_UUID_AQUI",
    "product": "PRODUCT_UUID_AQUI",
    "quantity": 10,
    "unit_price": 100.00
  }'
```

**Resultado esperado:** `201 Created`

```json
{
  "id": "uuid...",
  "quote": "uuid...",
  "product": {
    "id": "uuid...",
    "name": "Test Product",
    "price": "100.00"
  },
  "quantity": 10,
  "unit_price": "100.00",
  "subtotal": "1000.00"
}
```

---

### 🔒 GET /quotes/list/ (Requiere autenticación - DEBE FALLAR)

```bash
curl -X GET http://localhost:8000/quotes/list/ \
  -H "Content-Type: application/json"
```

**Resultado esperado:** `401 Unauthorized`

```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

### 🔒 GET /quotes/items/ (Requiere autenticación - DEBE FALLAR)

```bash
curl -X GET http://localhost:8000/quotes/items/ \
  -H "Content-Type: application/json"
```

**Resultado esperado:** `401 Unauthorized`

---

### 🔒 PUT /quotes/list/{id}/ (Requiere autenticación - DEBE FALLAR)

```bash
curl -X PATCH http://localhost:8000/quotes/list/QUOTE_UUID/ \
  -H "Content-Type: application/json" \
  -d '{
    "total_amount": 2000.00
  }'
```

**Resultado esperado:** `401 Unauthorized`

---

### 🔒 DELETE /quotes/list/{id}/ (Requiere autenticación - DEBE FALLAR)

```bash
curl -X DELETE http://localhost:8000/quotes/list/QUOTE_UUID/ \
  -H "Content-Type: application/json"
```

**Resultado esperado:** `401 Unauthorized`

---

## 🔐 Autenticación (Público)

### ✅ POST /users/token/ (Login - Sin autenticación previa)

```bash
curl -X POST http://localhost:8000/users/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Resultado esperado:** `200 OK` con tokens

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

## 📋 Checklist de Verificación

### Endpoints Públicos (Deben funcionar SIN token)

- [ ] `GET /products/brands/` → 200 OK
- [ ] `GET /products/categories/` → 200 OK
- [ ] `GET /products/list/` → 200 OK
- [ ] `GET /attachments/` → 200 OK
- [ ] `GET /notes/list/` → 200 OK
- [ ] `POST /quotes/list/` → 201 Created
- [ ] `POST /quotes/items/` → 201 Created
- [ ] `POST /users/token/` → 200 OK

### Endpoints Protegidos (Deben fallar SIN token)

- [ ] `POST /products/list/` → 401/403
- [ ] `GET /quotes/list/` → 401
- [ ] `GET /quotes/items/` → 401
- [ ] `PUT /quotes/list/{id}/` → 401
- [ ] `DELETE /quotes/list/{id}/` → 401

---

## 🎯 Test Completo de Flujo de Cotización

Este test simula el flujo completo de un usuario web creando una cotización:

```bash
#!/bin/bash

BASE_URL="http://localhost:8000"

echo "=== Test: Flujo Completo de Cotización Pública ==="

# 1. Ver productos disponibles (público)
echo "\n1. Listando productos..."
curl -s -X GET $BASE_URL/products/list/ | jq '.count'

# 2. Ver marcas (público)
echo "\n2. Listando marcas..."
curl -s -X GET $BASE_URL/products/brands/ | jq '.count'

# 3. Crear cotización (público)
echo "\n3. Creando cotización..."
QUOTE_RESPONSE=$(curl -s -X POST $BASE_URL/quotes/list/ \
  -H "Content-Type: application/json" \
  -d '{
    "contact": "CONTACT_UUID",
    "quote_type": "standard",
    "state": "draft",
    "total_amount": 1000.00,
    "message": "Cotización de prueba automatizada"
  }')

QUOTE_ID=$(echo $QUOTE_RESPONSE | jq -r '.id')
QUOTE_NUMBER=$(echo $QUOTE_RESPONSE | jq -r '.quote_number')

echo "Cotización creada: $QUOTE_NUMBER (ID: $QUOTE_ID)"

# 4. Agregar items a la cotización (público)
echo "\n4. Agregando items a la cotización..."
curl -s -X POST $BASE_URL/quotes/items/ \
  -H "Content-Type: application/json" \
  -d "{
    \"quote\": \"$QUOTE_ID\",
    \"product\": \"PRODUCT_UUID\",
    \"quantity\": 5,
    \"unit_price\": 100.00
  }" | jq '.subtotal'

echo "\n5. Intentando ver cotizaciones sin token (debe fallar)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $BASE_URL/quotes/list/)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "401" ]; then
  echo "✅ Acceso denegado correctamente (401)"
else
  echo "❌ ERROR: Debería retornar 401, retornó $HTTP_CODE"
fi

echo "\n=== Test Completado ==="
```

**Guarda este script como `test_public_endpoints.sh` y ejecútalo:**

```bash
chmod +x test_public_endpoints.sh
./test_public_endpoints.sh
```

---

## 🔍 Verificación con Postman/Insomnia

### Colección de Tests

Importa esta colección en Postman:

```json
{
  "info": {
    "name": "LAQQ - Public Endpoints Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "✅ GET Products (Public)",
      "request": {
        "method": "GET",
        "header": [],
        "url": "{{base_url}}/products/list/"
      }
    },
    {
      "name": "✅ POST Quote (Public)",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"contact\": \"{{contact_id}}\",\n  \"quote_type\": \"standard\",\n  \"state\": \"draft\",\n  \"total_amount\": 1000.00\n}"
        },
        "url": "{{base_url}}/quotes/list/"
      }
    },
    {
      "name": "🔒 GET Quotes (Protected)",
      "request": {
        "method": "GET",
        "header": [],
        "url": "{{base_url}}/quotes/list/"
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8000"
    }
  ]
}
```

---

## 📊 Resultados Esperados

### Tests Exitosos
```
✅ 10 tests de endpoints públicos: PASSED
✅ Crear cotización sin token: 201 Created
✅ Agregar items sin token: 201 Created
✅ Ver productos sin token: 200 OK
```

### Tests de Seguridad
```
✅ Ver cotizaciones sin token: 401 Unauthorized
✅ Modificar cotización sin token: 401 Unauthorized
✅ Crear productos sin token: 401/403 Forbidden
```

---

## 🐛 Troubleshooting

### Error: `500 Internal Server Error`

**Causa:** Posible bug en el código de permisos

**Solución:**
```bash
cd Backend
python manage.py test quotes.tests.PublicEndpointsTestCase -v 2
```

Revisa el traceback para identificar el error.

---

### Error: `404 Not Found`

**Causa:** URL incorrecta o servidor no corriendo

**Solución:**
1. Verifica que el servidor esté corriendo: `python manage.py runserver`
2. Verifica la URL: `http://localhost:8000` (no `http://127.0.0.1:8000`)
3. Verifica que las rutas estén configuradas correctamente

---

### Error: `CSRF Failed`

**Causa:** Django CSRF protection en POST requests

**Solución:** Agrega header `X-CSRFToken` o usa API client en lugar de browser form

---

## 📞 Soporte

Si los tests fallan:

1. **Ejecuta tests automatizados primero:**
   ```bash
   python manage.py test quotes.tests.PublicEndpointsTestCase -v 2
   ```

2. **Revisa los logs del servidor:**
   ```bash
   python manage.py runserver
   # Observa la consola mientras haces requests
   ```

3. **Verifica permisos en archivos:**
   - [quotes/permissions.py](../quotes/permissions.py)
   - [products/permissions.py](../products/permissions.py)

---

**Autor:** Claude Code
**Última actualización:** 2026-01-20
