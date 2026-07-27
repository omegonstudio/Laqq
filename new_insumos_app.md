# 📋 Análisis de Impacto y Factibilidad: Consumibles como Subtipo de Producto

## 1. Resumen Ejecutivo

**Feature:** Soportar "consumibles" (consumibles/supplies) dentro del modelo `Product` existente, usando la categoría raíz como discriminador natural, más campos específicos opcionales, y una experiencia de UI adaptada.

**Contexto de negocio:** Los "consumibles" no son una entidad diferente — son simplemente otro tipo de producto que se vende (equipos e consumibles para laboratorios químicos). Llamarlos "consumibles" es una nomenclatura comercial, no una distinción ontológica.

**Complejidad general:** ✅ **Media-baja** (~1 semana de desarrollo en paralelo Backend + Frontend)

---

## 2. Arquitectura Actual - Mapa de Impacto

### 2.1 Backend - Capa de Datos (Django Models)

**App `products`** es la más impactada:

| Archivo | Impacto |
|---------|---------|
| `Backend/products/models.py` | 🔴 **Alto** - Agregar ~7 campos al modelo `Product` + actualizar `save()` |
| `Backend/products/migrations/` | 🟡 1 nueva migración |
| `Backend/products/serializers.py` | 🟡 **Medio** - Agregar campos al `ProductSerializer` existente |
| `Backend/products/views.py` | 🟢 Sin cambios (mismo ViewSet) |
| `Backend/products/urls.py` | 🟢 Sin cambios (mismas rutas) |
| `Backend/products/filters.py` | 🟡 Agregar filtro `root_category` |
| `Backend/products/permissions.py` | 🟢 Sin cambios (mismas reglas) |
| `Backend/products/admin.py` | 🟡 Agregar campos al listado/filtros |
| `Backend/products/importer.py` | 🟡 Agregar columnas opcionales + lógica de PDFs por nombre |

**Apps relacionadas con `Product` via FK:**

| App | Archivo | Impacto |
|-----|---------|---------|
| **Quotes** | `QuoteItem.product = FK(Product)` | 🟢 **Nulo** — los consumibles **son** productos, no hay nada que cambiar |
| **Dashboard** | `config/dashboard.py` | 🟢 Bajo - Solo suma counts |
| **Tickets** | `models.py` | 🟢 Bajo - Referencia a producto es textual |
| **Attachments** | `models.py` (GenericFK) | 🟢 Bajo - Ya soporta cualquier modelo via ContentType |

### 2.2 Frontend - Capa de Presentacion (React/TypeScript)

> ✅ **Frontend ya implementado** por otro desarrollador. Solo se requiere que la API exponga los campos correctos.

| Archivo | Estado |
|---------|--------|
| `src/types/types.ts` | ✅ Ya incluye `articulo`, `cas`, `sedronar`, `esp_attachment_id`, `hds_attachment_id` |
| `src/utils/productConverters.ts` | ✅ Ya mapea los campos de API a form state |
| `src/utils/productSaveFlow.ts` | ✅ Ya envía los campos al backend |
| `src/components/molecules/Modals/EditProduct.tsx` | ✅ Ya renderiza los campos condicionalmente si es insumo |
| `src/components/organisms/ConsumiblesList.tsx` | ✅ Ya muestra la tabla con columnas Artículo, CAS, Sedronar, ESP, HDS |

---

## 3. Opciones de Diseño

> ⚠️ Las Opciones A, B y C fueron analizadas en el contexto original (crear un modelo separado).
> La **Opción D** es el enfoque refinado adoptado tras entender que los "consumibles" son, ontológicamente, productos.

### Opción A: Modelo separado (`Insumo`) en nueva app `supplies`
✅ Aislamiento total, migraciones independientes, sin riesgo de romper `Product`  
❌ Duplicación de lógica (CRUD, serializers, views, importers). Impacto alto en Quotes y Attachments.  
📐 **Descartada** — riesgo muy alto para el valor que aporta.

### Opción B: Modelo separado pero con clase base compartida (Abstract model / Mixin)
✅ Reutilización de campos comunes  
❌ Mayor complejidad inicial, mismo problema de FK en Quotes  
📐 **Descartada** — misma razón que Opción A.

### Opción C: Un solo modelo con `type` discriminator (tipo enum)
❌ Acoplamiento alto, tablas crecen con campos NULL, consultas más complejas  
📐 No recomendada

### Opción D ✅ (RECOMENDADA): Un solo modelo `Product` con categoría raíz como discriminador
✅ Sin modelo nuevo — los consumibles **son** productos  
✅ Sin impacto en Quotes (`QuoteItem.product` sigue siendo FK a `Product`)  
✅ Sin impacto en Attachments (mismo `attachable_type='product'`)  
✅ Sin impacto en Dashboard, Tickets, búsquedas, filtros  
✅ Sin duplicación de lógica futura  
✅ Categoría raíz `"consumibles"` ya existe en el sistema de categorías y se valida en el importador  
✅ Solo se agregan campos opcionales (`articulo`, `cas`, `sedronar`, `esp_attachment`, `hds_attachment`) + una cache `root_category` para filtrado eficiente  
📐 **Recomendada por: menor riesgo, menor esfuerzo, máxima coherencia semántica**

---

## 4. Implementación Detallada (Opción D)

### Backend — Modelo (`models.py`)

**Campos a agregar al modelo `Product`:**

```python
# Cache de categoría raíz para filtrado eficiente
root_category = models.CharField(max_length=100, blank=True, default='')

# Campos específicos de consumibles (todos opcionales)
articulo = models.CharField(max_length=100, blank=True, default='')
cas = models.CharField(max_length=50, blank=True, default='')
sedronar = models.CharField(max_length=20, blank=True, default='-')
esp_attachment = models.ForeignKey(
    Attachment, on_delete=models.SET_NULL, blank=True, null=True,
    related_name='esp_products'
)
hds_attachment = models.ForeignKey(
    Attachment, on_delete=models.SET_NULL, blank=True, null=True,
    related_name='hds_products'
)
```

**Actualizar `save()`** para auto-asignar `root_category`:

```python
def save(self, *args, **kwargs):
    if not getattr(self, 'product_code', None):
        self.product_code = self._generate_product_code()
    
    # Auto-asignar root_category desde la jerarquía de categorías
    if self.category:
        cat = self.category
        while cat.parent:
            cat = cat.parent
        self.root_category = cat.name.lower()
    else:
        self.root_category = ''
    
    super().save(*args, **kwargs)
```

### Backend — Serializers (`serializers.py`)

Agregar al `ProductSerializer` existente (sin crear uno nuevo):

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `root_category` | `CharField(read_only=True)` | Cache de categoría raíz |
| `articulo` | `CharField(required=False, allow_blank=True)` | Código de artículo |
| `cas` | `CharField(required=False, allow_blank=True)` | Número CAS |
| `sedronar` | `CharField(required=False, allow_blank=True)` | Registro SEDRONAR |
| `esp_attachment_id` | `PrimaryKeyRelatedField(source='esp_attachment')` | UUID del PDF de especificaciones |
| `hds_attachment_id` | `PrimaryKeyRelatedField(source='hds_attachment')` | UUID del PDF de hoja de seguridad |
| `esp_url` | `SerializerMethodField(read_only=True)` | URL de descarga de ESP |
| `hds_url` | `SerializerMethodField(read_only=True)` | URL de descarga de HDS |

**Sin cambios en `views.py`, `urls.py`, `permissions.py`** — el mismo `ProductViewSet` maneja todo.

### Backend — Filtros (`filters.py`)

Agregar a `ProductFilter`:

```python
root_category = django_filters.CharFilter(
    field_name='root_category',
    lookup_expr='iexact',
    label='Tipo de producto (raíz de categoría)',
)
```

Endpoint: `GET /products/list/?root_category=consumibles`

### Backend — Admin (`admin.py`)

Agregar `root_category` a `list_display` y `list_filter` de `ProductAdmin`.

### Backend — Cotizaciones (Quotes)

**🟢 Sin impacto.** Los consumibles **son** productos. `QuoteItem.product` sigue siendo FK a `Product`.
No se requiere ningún cambio en Quotes, Attachments, Tickets ni Dashboard.

### Frontend

**✅ Ya implementado.** El frontend ya:
- Incluye los tipos `articulo`, `cas`, `sedronar`, `esp_attachment_id`, `hds_attachment_id`
- Renderiza los campos condicionales en el modal de edición (solo si la categoría es "Consumibles")
- Muestra la tabla con columnas Artículo, CAS, Sedronar, ESP, HDS
- Maneja la subida de archivos PDF y su referencia por UUID

---

## 5. Puntos Abiertos / Decisiones a Tomar (Opción D)

| Decision | Opciones | Recomendacion |
|----------|----------|---------------|
| **Campos fijos o JSONField?** | Campos concretos vs insumo_data JSONField | **Campos concretos** - solo 5 campos, dan integridad referencial |
| **SEDRONAR como opciones fijas?** | CharField libre vs choices | **CharField libre** - el frontend ya maneja el dropdown |
| **Validar campos obligatorios para consumibles?** | Backend vs Frontend | **Solo frontend** - el backend trata todo como opcional |
| **Variantes en consumibles?** | Si / No | Por ahora No. Si se necesita, ProductVariant ya existe |
| **Consumibles en front publico?** | Si / No | Depende del negocio |
| **Consumibles en cotizaciones?** | Si / No | **Ya funciona** (son productos) - zero cambios |

---

## 6. Plan de Trabajo - Backend (Dividido en 2 Etapas)

### Etapa 1: CRUD Backoffice (API REST + Admin Django)

Objetivo: Que el frontend ya implementado funcione correctamente con la API.

| Paso | Archivo | Cambio |
|------|---------|--------|
| 1 | models.py | +7 campos + save() |
| 2 | Migracion | makemigrations + migrate |
| 3 | serializers.py | +9 campos en ProductSerializer |
| 4 | filters.py | +1 filtro root_category |
| 5 | admin.py | + campos en list_display |
| 6 | tests.py | Tests CRUD |

**Sin cambios:** urls.py, views.py, permissions.py, quotes/

### Etapa 2: Carga Masiva (Excel)

Objetivo: Excel importa productos con campos de insumo y PDFs por nombre de archivo.

| Paso | Archivo | Cambio |
|------|---------|--------|
| 1 | importer.py | +3 columnas: articulo, cas, sedronar |
| 2 | importer.py | +2 columnas: archivo_esp, archivo_hds |
| 3 | importer.py | Logica: buscar attachment por nombre |
| 4 | tests.py | Tests importacion Excel |

**Mecanismo de PDFs:** Reutiliza _get_attachment_by_name().

---

## 7. Estimacion de Esfuerzo

| Componente | Etapa | Archivos | Dias Est. |
|------------|-------|----------|-----------|
| Backend - Modelo + Migracion | 1 | models.py, migrations/ | 0.5 |
| Backend - Serializer | 1 | serializers.py | 0.5 |
| Backend - Filtros | 1 | filters.py | 0.25 |
| Backend - Admin | 1 | admin.py | 0.25 |
| Backend - Tests CRUD | 1 | tests.py | 0.5 |
| **Total Etapa 1** | | **~5 archivos** | **~2 dias** |
| Backend - Importador | 2 | importer.py | 1 |
| Backend - Tests importacion | 2 | tests.py | 0.5 |
| **Total Etapa 2** | | **~2 archivos** | **~1.5 dias** |
| **Total General** | | **~5-7 archivos** | **~3-4 dias** |

---

## 8. Comparativa de Enfoques

| Dimensión | A) App separada | C) Flag + JSON | D) Categoría como discriminador ✅ |
|-----------|:---:|:---:|:---:|
| **Nuevo modelo** | ✅ Sí | ❌ No | ❌ No |
| **Impacto Quotes** | 🔴 Alto | ✅ Nulo | ✅ Nulo |
| **Impacto Attachments** | 🔴 Alto | 🟡 Bajo | ✅ Bajo |
| **Duplicación futura** | 🔴 Alta | ✅ Baja | ✅ Mínima |
| **Consistencia semántica** | ❌ | 🟡 | ✅✅ |
| **Esfuerzo** | **12-17 días** | **5-8 días** | **4-6 días** |
| **Riesgo** | Alto | Bajo | **Muy Bajo** |
| **Archivos a tocar** | ~25-34 | ~10-15 | ~12-13 |

---

## 9. Riesgos Identificados (Opción D)

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|:-----------:|:-------:|------------|
| **Integridad de `root_category`** si se mueven categorías | 🟡 Baja | 🟡 Medio | El campo se recalcula en cada `save()` |
| **Campos de insumo en productos que no son consumibles** | 🟢 Muy baja | 🟢 Bajo | Son NULL por defecto, no afectan nada |
| **Categoría "consumibles" renombrada en el futuro** | 🟡 Baja | 🟡 Medio | Se actualiza el nombre de la categoría y las queries que filtran por él |
| **Necesidad de feature muy distinta entre tipos** | 🟢 Baja | 🟢 Bajo | Siempre se puede agregar un campo más o un JSONField si es muy diferente |

**Riesgos eliminados respecto a la Opción A:**
- ❌ ~~Refactorizar `QuoteItem.product`~~ → ✅ No aplica
- ❌ ~~Duplicar lógica de mantenimiento~~ → ✅ No aplica
- ❌ ~~Nuevo `attachable_type` en Attachments~~ → ✅ No aplica

---

*Documento actualizado el 23 de julio de 2026 — Plan refinado con campos reales y etapas 1 (CRUD) + 2 (carga masiva)*
