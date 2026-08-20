# Consumibles

Doc interno de trabajo de la rama `new-consumibles`. No reemplaza el análisis de impacto de `new_insumos_app.md`.

**Modelo:** los consumibles son `Product`. El discriminador es la categoría raíz **Consumibles** (cacheada en `root_category`). No hay entidad aparte.

---

## Objetivos

| # | Objetivo | Estado |
|---|---|---|
| 1 | Página pública de Productos adaptada a Consumibles | Hecho |
| 2 | Alta y edición en Backoffice | Hecho |
| 3 | Carga masiva por Excel | Hecho |
| 4 | Campos nuevos en la base | Hecho |
| 5 | Descargar la base de productos publicados | Hecho |
| 6 | Specs técnicas como pestaña independiente (como Variantes) | Hecho |
| 7 | Breadcrumb en categorías y productos | Hecho |

---

### 1. Página pública de Productos

Si el filtro de categoría es **Consumibles** o una hija (cualquier nivel), [`ProductsPage.tsx`](Frontend/src/pages/ProductsPage.tsx) renderiza [`InsumosList.tsx`](Frontend/src/components/organisms/InsumosList.tsx) (tabla: Artículo, Detalle, CAS, Sedronar, ESP, HDS) en lugar de `ProductGrid`. El listado sigue filtrado por esa categoría (`category_recursive`). La misma regla de árbol se usa en el backoffice (`isCategoryUnderConsumibles`).

Matices:

- El detalle público (`ProductDetailPage`) sigue genérico: no muestra CAS / ESP / HDS.
- Sedronar con valor `"-"` es truthy; el icono puede aparecer siempre.
- El listado filtra por `category` de la URL (recursivo), no por `root_category` en la API.

### 2. Formularios de alta y edición (Backoffice)

En [`EditProduct.tsx`](Frontend/src/components/molecules/Modals/EditProduct.tsx), si la categoría cuelga de Consumibles: `articulo` y `cas` (obligatorios), `sedronar` (`-` / Lista 1–4), PDFs ESP/HDS → `esp_attachment_id` / `hds_attachment_id`. Persistencia en `productSaveFlow` / `productConverters` / `types`.

Los campos viven en la tab **General**, no en una tab propia.

### 3. Carga masiva Excel

Importer, README y ambos `TablaCargaMasiva.xlsx` mapean `articulo`, `cas`, `sedronar`, `archivo_esp`, `archivo_hds`. El importador lee **por nombre de columna**; celdas vacías no pisan valores ya cargados.

El template se mantiene **a mano**. Canónico: [`Frontend/src/assets/templates/TablaCargaMasiva.xlsx`](Frontend/src/assets/templates/TablaCargaMasiva.xlsx) (botón de descarga del backoffice). Copia de referencia: `Backend/TablaCargaMasiva.xlsx`.

[`Backend/scripts/gen_excel_template.py`](Backend/scripts/gen_excel_template.py) está etiquetado **NO USAR**: regenerar pisa el xlsx y pierde las columnas de consumibles.

No commitear `Frontend/src/assets/templates/.~lock.TablaCargaMasiva.xlsx#`.

### 4. Campos en la base

En `Product`: `root_category`, `articulo`, `cas`, `sedronar`, `esp_attachment`, `hds_attachment`. Migración [`0014_add_insumo_fields.py`](Backend/products/migrations/0014_add_insumo_fields.py) (depende del `0013` de main). Serializer expone ids/urls de ESP y HDS. Filtro admin `root_category`.

Confirmar `migrate` en cada entorno al levantar la rama.

---

## Pendientes abiertos

### 5. Export de productos (backoffice)

Solo staff (`admin` / `back`). Botón **Exportar productos** abajo a la derecha de la tabla de gestión. Excel en el **mismo formato** que [`TablaCargaMasiva.xlsx`](Frontend/src/assets/templates/TablaCargaMasiva.xlsx) (round-trip con carga masiva).

- Activos e inactivos. Respeta los filtros de la tabla (búsqueda y marca); no pagina.
- Endpoint `GET /products/list/export/`. No incluye `spec_table` ni las 100 columnas `spec_*` vacías: solo `spec_1…N` usadas.

### 6. Pestaña Especificaciones técnicas

Una tabla estructurada por producto, independiente de la descripción y de las variedades.

Forma: `{ "columns": ["string"], "rows": [["celda", "..."]] }`. Vacía o null = no se muestra card en la ficha. HTML en la descripción no se migra solo (demasiado frágil); hay que copiar a mano lo que haga falta.

- Campo `Product.spec_table` (JSONField). Migración `0015_product_spec_table`.
- Backoffice: tab **Especificaciones** entre General y Variedades (`ProductSpecTableEditor`).
- Ficha pública: card **antes** de variantes/archivos, mismo look que la tabla de variantes (sin columna de carrito).
- No entra en Excel ni en el PDF de cotización todavía.

### 7. Breadcrumb

Recorrido **Inicio → Catálogo → categoría(s) → producto**, con el componente shadcn.

- Listado: si hay `?category=`, se muestra la cadena de padres hasta esa categoría (la hoja es la página actual). Sin filtro: Inicio → Catálogo.
- Ficha: misma cadena según `category_id` del producto; el nombre del producto es la página actual. Reemplaza “Volver al Catálogo”.
- Clic en una categoría filtra el catálogo (`/products?category=…`). **Mobiliario** sigue yendo a `/furniture`, igual que el menú.
- Helper: `getCategoryAncestry` / `buildCatalogCrumbs` en [`categories.ts`](Frontend/src/utils/data/categories.ts). UI: [`CatalogBreadcrumb.tsx`](Frontend/src/components/molecules/CatalogBreadcrumb.tsx).
