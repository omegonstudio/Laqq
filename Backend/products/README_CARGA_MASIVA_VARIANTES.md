# 📦 Carga Masiva de Productos con Variantes

## Resumen

El sistema de carga masiva ahora soporta la creación de **variantes de productos** usando la columna `is_variant` en el archivo Excel.

## 🎯 Conceptos Clave

- **Product**: El producto principal (ej: "Matraz Aforado Clase A")
- **ProductSpec (Variante)**: Las especificaciones/variantes de un producto (ej: 25ml, 50ml, 100ml)
- **product_code**: Código único que identifica un producto (debe ser único por producto)
- **spec_code**: Código único que identifica una variante dentro de un producto

## 📋 Estructura del Archivo Excel

### Columnas Requeridas

| Columna | Descripción | Obligatorio |
|---------|-------------|-------------|
| `product_code` | Código único del producto | ✅ Sí |
| `name` | Nombre del producto | ✅ Solo para productos (`is_variant=false`) |
| `brand` | Marca del producto | ✅ Solo para productos activos |
| `category_level_0` | Categoría raíz (consumibles/procesos/equipos/mobiliario) | ✅ Solo para productos activos |
| `category_level_1` | Subcategoría nivel 1 | ❌ Opcional |
| `category_level_2` | Subcategoría nivel 2 | ❌ Opcional |
| `description` | Descripción del producto | ❌ Opcional |
| `image_name` | Nombre de la imagen en librería | ❌ Opcional |
| `is_active` | Producto activo (true/false) | ❌ Default: true |
| **`is_variant`** | **Si es variante (true/false)** | ✅ **Sí** |
| **`spec_code`** | **Código único de la variante** | ✅ **Solo para variantes** |
| `volume` | Volumen de la variante | ❌ Opcional |
| `dimensions` | Dimensiones de la variante | ❌ Opcional |
| `cap` | Tapa/Cierre de la variante | ❌ Opcional |
| `outlet` | Salida de la variante | ❌ Opcional |
| `accuracy` | Exactitud de la variante | ❌ Opcional |
| `precision` | Precisión de la variante | ❌ Opcional |
| `additional_specs` | Especificaciones adicionales (JSON) | ❌ Opcional |

## 📝 Ejemplos de Uso

## 📂 Archivo de Ejemplo

El archivo de ejemplo se encuentra en: `Backend/TablaCargaMasiva.xlsx`

Puedes regenerarlo ejecutando:
```bash
python Backend/products/examples/generar_tabla_ejemplo_variantes.py
```

### Ejemplo 1: Crear un Producto con Múltiples Variantes

```excel
| product_code | name              | brand    | category_level_0 | is_variant | spec_code | volume | dimensions | cap      |
|--------------|-------------------|----------|------------------|------------|-----------|--------|------------|----------|
| MAT-001      | Matraz Aforado    | LabEquip | equipos          | false      | 25ML      | 25ml   | 70x40mm    | NS 10/19 |
| MAT-001      |                   |          |                  | true       | 50ML      | 50ml   | 90x45mm    | NS 12/21 |
| MAT-001      |                   |          |                  | true       | 100ML     | 100ml  | 110x50mm   | NS 12/21 |
| MAT-001      |                   |          |                  | true       | 250ML     | 250ml  | 140x60mm   | NS 14/23 |
```

**Resultado:**
- ✅ Se crea 1 producto: "Matraz Aforado" con `product_code=MAT-001`
- ✅ Se crean 4 variantes (ProductSpec) asociadas al producto:
  - 25ML (25ml)
  - 50ML (50ml)
  - 100ML (100ml)
  - 250ML (250ml)

### Ejemplo 2: Agregar Variantes a un Producto Existente

Si ya existe un producto con `product_code=VAS-200`, puedes agregar nuevas variantes:

```excel
| product_code | name | brand | category_level_0 | is_variant | spec_code | volume | dimensions |
|--------------|------|-------|------------------|------------|-----------|--------|------------|
| VAS-200      |      |       |                  | true       | 500ML     | 500ml  | 15x7x7cm   |
| VAS-200      |      |       |                  | true       | 1L        | 1000ml | 20x10x10cm |
```

**Resultado:**
- ✅ NO se crea un nuevo producto (porque `is_variant=true`)
- ✅ Se agregan 2 variantes al producto existente VAS-200

## ⚠️ Validaciones y Errores

### Error 1: Variante sin Producto Padre

```excel
| product_code | is_variant | spec_code |
|--------------|------------|-----------|
| PROD-999     | true       | 50ML      |
```

**❌ ERROR:** "Producto padre con product_code 'PROD-999' no encontrado. Las variantes requieren un producto existente con is_variant=false."

**Solución:** Primero crea el producto con `is_variant=false`:

```excel
| product_code | name        | brand | category_level_0 | is_variant | spec_code |
|--------------|-------------|-------|------------------|------------|-----------|
| PROD-999     | Producto X  | Marca | equipos          | false      | BASE      |
| PROD-999     |             |       |                  | true       | 50ML      |
```

### Error 2: Product_code Duplicado

```excel
| product_code | name        | is_variant |
|--------------|-------------|------------|
| MAT-001      | Matraz A    | false      |
| MAT-001      | Matraz B    | false      |
```

**❌ ERROR:** "Product con product_code 'MAT-001' duplicado. Solo puede haber un producto con is_variant=false por product_code."

**Solución:** Solo puede haber un producto (con `is_variant=false`) por `product_code`. Las demás filas con el mismo `product_code` deben tener `is_variant=true`.

### Error 3: Variante sin spec_code

```excel
| product_code | is_variant | spec_code | volume |
|--------------|------------|-----------|--------|
| MAT-001      | true       |           | 50ml   |
```

**❌ ERROR:** "Variante requiere spec_code para identificarla"

**Solución:** Todas las variantes deben tener un `spec_code` único:

```excel
| product_code | is_variant | spec_code | volume |
|--------------|------------|--------------|--------|
| MAT-001      | true       | MAT-001-50ML | 50ml   |
```

## 🔍 Casos de Uso Comunes

### Caso 1: Producto Simple (Sin Variantes)

Si tu producto no tiene variantes, puedes omitir la columna `is_variant` o ponerla en `false`:

```excel
| product_code | name      | brand | category_level_0 | is_variant |
|--------------|-----------|-------|------------------|------------|
| PROD-001     | Producto1 | Marca | equipos          | false      |
```

### Caso 2: Producto con 1 Variante Principal + Variantes Adicionales

```excel
| product_code | name    | brand | category_level_0 | is_variant | spec_code | volume |
|--------------|---------|-------|------------------|------------|-----------|--------|
| VAR-001      | Vaso X  | Marca | consumibles      | false      | BASE      | 100ml  |
| VAR-001      |         |       |                  | true       | 250       | 250ml  |
| VAR-001      |         |       |                  | true       | 500       | 500ml  |
```

### Caso 3: Actualizar Datos de un Producto y Agregar Variantes

Si el producto ya existe en la base de datos, puedes actualizar sus datos y agregar nuevas variantes en una sola carga:

```excel
| product_code | name            | brand      | is_variant | spec_code | volume |
|--------------|-----------------|------------|------------|--------------|--------|
| EXIST-001    | Nombre Nuevo    | Nueva Brand| false      | A         | 50ml   |
| EXIST-001    |                 |            | true       | B         | 100ml  |
```

**Resultado:**
- ✅ Se actualiza el producto EXIST-001 con el nuevo nombre y marca
- ✅ Se crea/actualiza la variante A
- ✅ Se crea la variante B

## 📊 Resumen de Importación

Al finalizar la importación, recibirás un resumen con:

```json
{
  "created_products": 5,
  "updated_products": 2,
  "created_specs": 3,
  "created_variants": 15,
  "errors": [
    {
      "row": 10,
      "error": "Producto padre con product_code 'XXX' no encontrado..."
    }
  ]
}
```

- **created_products**: Productos nuevos creados (`is_variant=false`)
- **updated_products**: Productos existentes actualizados
- **created_specs**: Variantes creadas junto con el producto principal
- **created_variants**: Variantes creadas con `is_variant=true`
- **errors**: Lista de errores encontrados con número de fila

## 🚀 Flujo de Trabajo Recomendado

1. **Usar el archivo de plantilla:**
   - Abrir `Backend/TablaCargaMasiva.xlsx`
   - Ver la hoja "Instrucciones" para guía rápida
   - Usar la hoja "Productos y Variantes" como referencia

2. **Preparar tus datos:**
   - Primera fila: Headers (columnas)
   - Siguientes filas: Datos de productos y variantes

3. **Ordenar los datos:**
   - Primero las filas de productos (`is_variant=false`)
   - Luego las variantes de ese producto (`is_variant=true`)

4. **Validar datos:**
   - Verificar que `product_code` sea único por producto
   - Verificar que `spec_code` sea único por variante
   - Asegurar que las categorías nivel 0 existan (consumibles/procesos/equipos/mobiliario)

5. **Cargar el archivo:**
   - Usar la interfaz de carga masiva o API
   - Revisar el resumen de importación
   - Verificar errores si los hay

6. **Verificar resultados:**
   - Revisar los productos creados
   - Verificar que las variantes estén correctamente asociadas

## 💡 Tips y Buenas Prácticas

1. **Nomenclatura de códigos:**
   ```
   product_code: MAT-001
   spec_code:    25ML, 50ML, 100ML
   ```

2. **Reutilizar datos:**
   - Para variantes, puedes dejar vacíos los campos del producto (name, brand, category)
   - El sistema usa automáticamente los datos del producto padre

3. **Actualizar variantes:**
   - Si ya existe una variante con el mismo `product_code` + `spec_code`, se actualiza
   - Esto permite modificar datos de variantes existentes

4. **Specs adicionales:**
   - Usa `additional_specs` con formato JSON para datos personalizados:
   ```json
   {"material": "vidrio borosilicato", "temperatura_max": "500°C"}
   ```

## ❓ FAQ

**P: ¿Puedo crear un producto sin variantes?**
R: Sí, simplemente no agregues filas con `is_variant=true` para ese `product_code`.

**P: ¿Qué pasa si cargo dos veces el mismo producto?**
R: Si usas el mismo `product_code` con `is_variant=false` dos veces en el mismo archivo, obtendrás un error de duplicado.

**P: ¿Puedo actualizar solo variantes sin modificar el producto?**
R: Sí, simplemente carga solo las filas con `is_variant=true`. El producto padre debe existir previamente.

**P: ¿Es obligatorio el spec_code para el producto principal?**
R: No, pero es recomendable si quieres crear una variante "base" junto con el producto.

**P: ¿Cuántas variantes puedo tener por producto?**
R: No hay límite. Puedes tener tantas variantes como necesites.

## 🔗 Ver También

- [README_VARIANTES.md](./README_VARIANTES.md) - Documentación sobre el sistema de variantes
- [examples/create_product_variants.py](./examples/create_product_variants.py) - Ejemplos programáticos

---

## 🧪 Columnas específicas de Consumibles

Si el producto pertenece a la categoría raíz `consumibles`, podés completar estas columnas adicionales. Todas son **opcionales** y se aplican solo a la fila del producto (no a sus variantes).

| Columna | Descripción | Obligatorio |
|---------|-------------|-------------|
| `articulo` | Código de artículo interno del consumible | ❌ Opcional |
| `cas` | Número CAS (Chemical Abstracts Service) | ❌ Opcional |
| `sedronar` | Registro SEDRONAR (si aplica) | ❌ Opcional, default: `-` |
| `archivo_esp` | Nombre exacto del PDF de **especificaciones** ya subido a la librería de archivos (ej: `reactivo-x-esp.pdf`) | ❌ Opcional |
| `archivo_hds` | Nombre exacto del PDF de **hoja de seguridad (HDS/MSDS)** ya subido a la librería de archivos (ej: `reactivo-x-hds.pdf`) | ❌ Opcional |

### Reglas de comportamiento

- **PDFs por nombre**: las columnas `archivo_esp` y `archivo_hds` esperan el `file_name` exacto de un `Attachment` ya existente en la librería. El importador busca case-insensitive. Si el archivo no existe, se registra un warning en `summary['errors']` y el producto se crea igual sin ese PDF.
- **Celdas vacías = preservar**: si reimportás un producto y dejás las celdas de consumibles vacías, **no se pisan** los valores previos en BD. Esto vale tanto para textos (`articulo`, `cas`, `sedronar`) como para los PDFs (`archivo_esp`, `archivo_hds`).
- **No-consumibles**: si la categoría raíz no es `consumibles`, podés dejar todas estas columnas vacías sin problema — el producto se crea normal y los campos quedan en su valor por defecto.

### Ejemplo: fila de consumible completa

```excel
| codigo_producto | nombre      | marca    | categoria_nivel_0 | categoria_nivel_1 | activo | es_variante | articulo | cas        | sedronar | archivo_esp          | archivo_hds          |
|-----------------|-------------|----------|-------------------|-------------------|--------|-------------|----------|------------|----------|----------------------|----------------------|
| CON-001         | Reactivo X  | MarcaLab | consumibles       | Reactivos         | 1      | 0           | ART-123  | 7732-18-5  | SED-001  | reactivo-x-esp.pdf   | reactivo-x-hds.pdf   |
```

### Resumen de importación: contadores nuevos

El `summary` que devuelve la API ahora incluye dos contadores específicos:

| Campo | Significado |
|-------|-------------|
| `linked_esp_pdfs` | PDFs de especificaciones enlazados al producto durante la importación |
| `linked_hds_pdfs` | PDFs de hojas de seguridad enlazados al producto durante la importación |

Si un PDF no se encuentra en la librería, se incrementa `errors` (no rompe la importación).
