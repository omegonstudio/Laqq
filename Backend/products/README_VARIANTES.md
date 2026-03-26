# 📦 Sistema de Variantes de Productos (Multiple Fixed Specs)

## Resumen Ejecutivo

El backend **YA ESTÁ CONFIGURADO** para enviar múltiples `fixed_specs` (variantes) por producto. No se requieren cambios adicionales en el backend.

## ✅ Estado Actual

### Backend (COMPLETO)
- **Modelo**: `ProductSpec` con relación `ForeignKey` a `Product` (permite múltiples specs por producto)
- **Serializer**: Configurado con `many=True` para enviar array de specs
- **API Response**: El campo `fixed_specs` es un **ARRAY** con todas las variantes

### Lo que recibe el Frontend

```json
{
    "id": "producto-uuid",
    "name": "Matraz Aforado Clase A",
    "brand": "LabEquip",
    "category": "Material Volumétrico",
    "fixed_specs": [
        {
            "id": "spec-uuid-1",
            "product": "producto-uuid",
            "code": "MAT-001-25ML",
            "volume": "25 ml",
            "dimensions": "70 x 40 mm",
            "cap": "NS 10/19",
            "accuracy": "±0.03 ml",
            "precision": "0.01 ml"
        },
        {
            "id": "spec-uuid-2",
            "product": "producto-uuid",
            "code": "MAT-001-50ML",
            "volume": "50 ml",
            "dimensions": "90 x 45 mm",
            "cap": "NS 12/21",
            "accuracy": "±0.05 ml",
            "precision": "0.02 ml"
        },
        {
            "id": "spec-uuid-3",
            "product": "producto-uuid",
            "code": "MAT-001-100ML",
            "volume": "100 ml",
            "dimensions": "110 x 50 mm",
            "cap": "NS 12/21",
            "accuracy": "±0.08 ml",
            "precision": "0.02 ml"
        }
        // ... más variantes
    ],
    // ... otros campos del producto
}
```

## 📋 Endpoints Disponibles

### 1. Obtener Producto con Todas sus Variantes
```http
GET /api/products/list/{product-id}/
```

**Respuesta**: Incluye automáticamente todas las variantes en el campo `fixed_specs`

### 2. Listar Productos (con variantes)
```http
GET /api/products/list/
```

**Respuesta**: Cada producto incluye su array completo de `fixed_specs`

### 3. Filtrar Specs por Producto
```http
GET /api/products/specs/?product={product-id}
```

**Respuesta**: Lista solo las specs del producto especificado

### 4. Crear Múltiples Variantes (Bulk)
```http
POST /api/products/specs/bulk-create/
```

**Payload**:
```json
{
    "product": "producto-uuid",
    "specs": [
        {
            "code": "PROD-001-250ML",
            "volume": "250ml",
            "dimensions": "10x5x5cm",
            "cap": "Rosca"
        },
        {
            "code": "PROD-001-500ML",
            "volume": "500ml",
            "dimensions": "15x7x7cm",
            "cap": "Rosca"
        }
    ]
}
```

### 5. CRUD Individual de Specs

#### Crear una variante
```http
POST /api/products/specs/
```
```json
{
    "product": "producto-uuid",
    "code": "PROD-001-1L",
    "volume": "1000ml",
    "dimensions": "20x10x10cm"
}
```

#### Actualizar una variante
```http
PUT /api/products/specs/{spec-id}/
```

#### Eliminar una variante
```http
DELETE /api/products/specs/{spec-id}/
```

## 🎨 Implementación Sugerida para Frontend

### Opción 1: Tabs de Variantes
```tsx
// ProductDetail.tsx
const ProductDetail = ({ product }) => {
    const [selectedVariant, setSelectedVariant] = useState(0);

    return (
        <div>
            <h1>{product.name}</h1>

            {/* Tabs para cada variante */}
            <div className="variant-tabs">
                {product.fixed_specs.map((spec, index) => (
                    <button
                        key={spec.id}
                        onClick={() => setSelectedVariant(index)}
                        className={selectedVariant === index ? 'active' : ''}
                    >
                        {spec.volume || spec.code}
                    </button>
                ))}
            </div>

            {/* Mostrar detalles de la variante seleccionada */}
            {product.fixed_specs[selectedVariant] && (
                <div className="variant-details">
                    <p>Código: {product.fixed_specs[selectedVariant].code}</p>
                    <p>Volumen: {product.fixed_specs[selectedVariant].volume}</p>
                    <p>Dimensiones: {product.fixed_specs[selectedVariant].dimensions}</p>
                    {/* ... más detalles */}
                </div>
            )}
        </div>
    );
};
```

### Opción 2: Selector Dropdown
```tsx
// ProductDetail.tsx
const ProductDetail = ({ product }) => {
    const [selectedSpec, setSelectedSpec] = useState(product.fixed_specs[0]);

    return (
        <div>
            <h1>{product.name}</h1>

            {/* Dropdown de variantes */}
            <select
                value={selectedSpec?.id}
                onChange={(e) => {
                    const spec = product.fixed_specs.find(s => s.id === e.target.value);
                    setSelectedSpec(spec);
                }}
            >
                {product.fixed_specs.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                        {spec.volume} - {spec.code}
                    </option>
                ))}
            </select>

            {/* Detalles de la variante seleccionada */}
            {selectedSpec && (
                <div className="spec-details">
                    <h3>Especificaciones</h3>
                    <ul>
                        <li>Código: {selectedSpec.code}</li>
                        <li>Volumen: {selectedSpec.volume}</li>
                        <li>Dimensiones: {selectedSpec.dimensions}</li>
                        <li>Tapa: {selectedSpec.cap}</li>
                        <li>Precisión: {selectedSpec.precision}</li>
                        <li>Exactitud: {selectedSpec.accuracy}</li>
                    </ul>
                </div>
            )}
        </div>
    );
};
```

### Opción 3: Cards de Variantes
```tsx
// ProductVariants.tsx
const ProductVariants = ({ product }) => {
    return (
        <div className="variants-grid">
            {product.fixed_specs.map((spec) => (
                <div key={spec.id} className="variant-card">
                    <h3>{spec.volume || spec.code}</h3>
                    <p>Código: {spec.code}</p>
                    <p>Dimensiones: {spec.dimensions}</p>
                    <button onClick={() => addToQuote(product, spec)}>
                        Agregar a cotización
                    </button>
                </div>
            ))}
        </div>
    );
};
```

## 🔍 Verificación

### Cómo verificar que un producto tiene múltiples variantes:

1. **Via API (GET request)**:
```bash
curl http://localhost:8000/api/products/list/{product-id}/
```

2. **Via Django Admin**:
   - Ir a Admin > Products > [Seleccionar producto]
   - Ver sección "Fixed specs"

3. **Via Django Shell**:
```python
from products.models import Product
product = Product.objects.get(id='product-uuid')
print(f"Variantes: {product.fixed_specs.count()}")
for spec in product.fixed_specs.all():
    print(f"- {spec.code}: {spec.volume}")
```

## 📝 Notas Importantes

1. **No hay límite** en la cantidad de variantes por producto
2. Cada variante puede tener **diferentes campos** llenos (algunos pueden tener volumen, otros no)
3. El campo `additional_specs` permite agregar **especificaciones JSON personalizadas** por variante
4. La **constraint única** es por `(product, code)`, evitando códigos duplicados para el mismo producto

## 🚀 Próximos Pasos para Frontend

1. **Actualizar tipos TypeScript** para reflejar que `fixed_specs` es un array
2. **Implementar UI** para mostrar/seleccionar variantes (tabs, dropdown, cards, etc.)
3. **Manejar el caso** cuando un producto no tiene variantes (array vacío)
4. **Considerar agregar** un indicador visual cuando hay múltiples variantes disponibles

## ❓ FAQ

**P: ¿Por qué algunos productos solo tienen un fixed_spec?**
R: Porque hasta ahora solo se había creado una variante por producto. El sistema soporta múltiples, pero hay que crearlas.

**P: ¿Puedo tener productos sin ningún fixed_spec?**
R: Sí, el campo es opcional. Un producto puede existir sin variantes.

**P: ¿Cómo agrego más variantes a un producto existente?**
R: Usa el endpoint POST `/api/products/specs/` o el bulk-create para agregar múltiples de una vez.

**P: ¿El frontend necesita cambios para soportar esto?**
R: Solo necesita actualizar la UI para manejar el array de specs. El backend ya envía todo correctamente.