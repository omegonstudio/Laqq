# Plan: Agregar archivo PDF a cada variante de producto

## Objetivo
Permitir adjuntar un archivo PDF (o cualquier documento) a cada `ProductVariant`, tanto desde la carga masiva por Excel como desde el formulario de edición de producto, y visualizarlo en el detalle del producto.

## Enfoque
Usar el sistema de **GenericForeignKey** que ya existe en el modelo `Attachment`. Es el mismo mecanismo que ya usa `Product` para sus archivos adjuntos (carrusel de imágenes, documentos, etc.). No requiere nuevos campos en el modelo `ProductVariant`.

---

## 1. BACKEND

### 1.1. `products/views.py` — ProductVariantViewSet
Agregar actions para manejo de attachments (mismo patrón que `ProductViewSet`):
- `upload_attachment` — subir un archivo a una variante específica
- `upload_attachments` — subir múltiples archivos
- `delete_attachment` — eliminar un attachment de una variante
- `list_attachments` — listar attachments de una variante

### 1.2. `products/serializers.py` — ProductVariantSerializer
Agregar campos:
- `attachments` (read-only) — lista de archivos adjuntos de la variante
- `attachments_files` (write-only) — archivos nuevos a subir
- `attachments_existing` (write-only) — IDs de attachments a mantener

### 1.3. `products/admin.py` — ProductVariantAdmin
Agregar `AttachmentInline` a los inlines de `ProductVariantAdmin`:
```python
@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    ...
    inlines = [VariantTechnicalSpecInline, AttachmentInline]  # <-- agregar AttachmentInline
```

### 1.4. `products/importer.py` — Importador de Excel
- Agregar columna `archivo_variante` al `COLUMN_NAME_MAP`
- En la sección de procesamiento de variantes (segunda pasada), buscar el Attachment por nombre de archivo en la librería
- Asociar el Attachment a la variante vía `content_type` y `object_id` (GenericForeignKey)
- Reportar en el summary los PDFs vinculados

### 1.5. `scripts/gen_excel_template.py` — Template de Excel
- Agregar columna `archivo_variante` a los headers
- Agregar columna `archivo_variante` a los ejemplos
- Actualizar las instrucciones en la hoja de Instrucciones

---

## 2. FRONTEND

### 2.1. `types/types.ts` — Tipos
En la interfaz `Variants`, agregar:
```typescript
export interface Variants {
  code: string;
  id?: string;
  product: string;
  technical_specs?: TecnicalSpecs[];
  attachments?: Attachment[];          // <-- nuevo
  attachments_files?: File[];           // <-- nuevo
  attachments_existing?: string[];      // <-- nuevo
}
```

### 2.2. `lib/api/products.ts` — API
Agregar métodos para variantes:
```typescript
uploadVariantAttachment: (id: string, formData: FormData) => ...,
deleteVariantAttachment: (variantId: string, attachmentId: string) => ...,
listVariantAttachments: (id: string) => ...,
```

### 2.3. `components/molecules/ProductVariantsTable.tsx` — Tabla dinámica de variantes
✅ **Punto clave 1: La tabla de variantes en el formulario de edición**
- Agregar una columna "Archivo" o "PDF" en la tabla dinámica
- Cada fila de variante debe tener un botón de upload de archivo
- Mostrar el nombre del archivo adjunto si existe
- Permitir eliminar el archivo adjunto

### 2.4. `components/molecules/Modals/EditProduct.tsx` — Modal de edición de producto
- En la tab "Tabla de Variedades", pasar los archivos al `ProductVariantsTable`
- En `syncVariants`, agregar la lógica para subir adjuntos de variantes (similar a como se manejan las imágenes de producto)
- Gestionar la subida de archivos de variantes durante el guardado

### 2.5. `utils/productSaveFlow.ts` — Flujo de guardado
- Actualizar `syncVariants` para manejar la subida de attachments de variantes
- Después de crear/actualizar cada variante, subir los archivos pendientes
- Actualizar `normalizeVariants` para incluir información de attachments

### 2.6. `utils/productConverters.ts` — Conversores
- Actualizar `productToFormState` para incluir `attachments` de variantes
- Actualizar `normalizeVariants` si es necesario

### 2.7. `pages/ProductDetailPage.tsx` — Detalle de producto
✅ **Punto clave 2: La tabla de variantes en el detalle público**
- Agregar una columna "Archivo" o "PDF" en la tabla de variantes del detalle de producto
- Si la variante tiene un archivo adjunto, mostrar un ícono de descarga 📄
- Al hacer clic, abrir el PDF en una nueva pestaña

### 2.8. `components/molecules/CargaMasiva.tsx` — Carga masiva
✅ **Punto clave 3: La carga masiva por Excel**
- El importador ya procesa variantes, solo agregar la columna `archivo_variante`
- No requiere cambios en este componente, los cambios son en el backend (importer.py)

---

## 3. FLUJO DE DATOS

### 3.1. Creación/Edición desde el formulario
```
Usuario adjunta PDF en ProductVariantsTable
  → EditProduct.handleSave()
    → syncVariants()
      → productsApi.createVariants(data)  // crea variante
      → productsApi.uploadVariantAttachment(id, formData)  // sube PDF
```

### 3.2. Carga masiva desde Excel
```
Excel con columna "archivo_variante" = "ficha_tecnica.pdf"
  → import_products_csv()
    → Busca Attachment por nombre en la librería
    → Crea/actualiza ProductVariant
    → Asocia Attachment vía GenericForeignKey (content_type + object_id)
```

### 3.3. Visualización en detalle de producto
```
ProductDetailPage
  → product.variants[].attachments[]
    → Muestra ícono de descarga por cada attachment
```

---

## 4. NOTAS

- **No se necesita migración de BD** porque el modelo `Attachment` ya soporta `GenericForeignKey`
- El mismo patrón de `upload_attachments` de `ProductViewSet` se replica en `ProductVariantViewSet`
- La columna `archivo_variante` en el Excel funciona igual que `archivo_esp` y `archivo_hds` de producto: busca el archivo por nombre en la librería de attachments
- Si se incluye en la rama `consumibles-back`, se puede hacer todo junto en el mismo merge