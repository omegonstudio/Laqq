// utils/productConverters.ts
import type {
  Product,
  ProductFormState,
  ProductCreateRequest,
  ProductUpdateRequest,
  Brand,
  Category,
} from "@/types/types";
import { EMPTY_SPEC_TABLE } from "@/types/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Prefiere UUID; si el API mandó solo el nombre, no lo uses como value del Select. */
export const asSelectId = (idOrName?: string | null) => {
  const value = (idOrName ?? "").trim();
  if (!value) return "";
  return UUID_RE.test(value) ? value : "";
};

const namesMatch = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

/** Resuelve marca a UUID: brand_id, o nombre contra el catálogo. */
export const resolveBrandSelectId = (
  product: Pick<Product, "brand" | "brand_id">,
  brands: readonly Pick<Brand, "id" | "name">[] = []
): string => {
  const fromId = asSelectId(product.brand_id);
  if (fromId) return fromId;
  const fromBrandField = asSelectId(product.brand);
  if (fromBrandField) return fromBrandField;
  const name = (product.brand ?? "").trim();
  if (!name || !brands.length) return "";
  return brands.find((b) => namesMatch(b.name, name))?.id ?? "";
};

/** Resuelve categoría a UUID: category_id, o nombre contra el catálogo. */
export const resolveCategorySelectId = (
  product: Pick<Product, "category" | "category_id">,
  categories: readonly Pick<Category, "id" | "name">[] = []
): string => {
  const fromId = asSelectId(product.category_id);
  if (fromId) return fromId;
  const fromCategoryField = asSelectId(product.category);
  if (fromCategoryField) return fromCategoryField;
  const name = (product.category ?? "").trim();
  if (!name || !categories.length) return "";
  // Si hay homónimos, preferir la hoja más específica (mayor level si existe).
  const matches = categories.filter((c) => namesMatch(c.name, name));
  if (!matches.length) return "";
  if (matches.length === 1) return matches[0].id;
  const withLevel = matches as Array<Pick<Category, "id" | "name"> & { level?: number }>;
  return [...withLevel].sort((a, b) => (b.level ?? 0) - (a.level ?? 0))[0].id;
};

export type ProductFormLookups = {
  brands?: readonly Pick<Brand, "id" | "name">[];
  categories?: readonly Pick<Category, "id" | "name" | "level">[];
};

/**
 * Convierte un Product (del backend) a ProductFormState (para el formulario)
 */
export const productToFormState = (
  product: Product,
  lookups: ProductFormLookups = {}
): ProductFormState => {
  return {
    attachments: (product.attachments ?? []).map((att) => {
      return att.id;
    }),
    attachments_files: null,
    attachments_existing: null,
    id: product.id,
    name: product.name,
    // Los Select del BO usan UUID. Resolver nombre→id si el API solo mandó el label.
    brand: resolveBrandSelectId(product, lookups.brands),
    category: resolveCategorySelectId(product, lookups.categories),
    description: product.description || "",
    product_code: product.product_code || "",
    image_file: null,
    image_attachment_id: product.image_attachment,
    is_featured: product.is_featured || false,
    is_active: product.is_active,
    variants: product.variants || [],
    related: product.related || product.related_products || [],
    articulo: product.articulo ?? "",
    cas: product.cas ?? "",
    sedronar: product.sedronar ?? "-",
    esp_attachment_id: product.esp_attachment_id ?? null,
    hds_attachment_id: product.hds_attachment_id ?? null,
    esp_file: null,
    hds_file: null,
    spec_table: product.spec_table ?? { ...EMPTY_SPEC_TABLE },
  };
};

/**
 * Convierte ProductFormState a ProductCreateRequest (para crear)
 */
export const formStateToCreateRequest = (
  formState: ProductFormState,
  attachmentId?: string | null
): ProductCreateRequest => {
  return {
    name: formState.name,
    brand_id: formState.brand,
    category_id: formState.category,
    description: formState.description,
    product_code: formState.product_code,
    image_attachment: attachmentId ?? null,
    is_active: formState.is_active,
    related_product_ids: formState.related?.map((rel) => rel.id) || [],
    articulo: formState.articulo,
    cas: formState.cas,
    sedronar: formState.sedronar,
    esp_attachment_id: formState.esp_attachment_id,
    hds_attachment_id: formState.hds_attachment_id,
    spec_table: formState.spec_table ?? EMPTY_SPEC_TABLE,
  };
};

export const formStateToUpdateRequest = (
  formState: ProductFormState,
  initialData: Product,
  attachmentId?: string | null,
  espAttachmentId?: string | null,
  hdsAttachmentId?: string | null
): ProductUpdateRequest => {
  const updateRequest: Partial<ProductUpdateRequest> = {};
  let hasRealChanges = false;

  // Comparar name
  if (formState.name !== initialData.name) {
    hasRealChanges = true;
  }

  // Detectar activacion: inactivo -> activo.
  // En ese caso hay que mandar brand/category aunque el valor no haya cambiado,
  // porque mientras estaba inactivo no se incluian en el request.

  const activationChange = !initialData.is_active && formState.is_active;
  const productIsOrWillBeActive = formState.is_active;

  const initialBrand = asSelectId(initialData.brand_id) || initialData.brand_id || "";
  const initialCategory =
    asSelectId(initialData.category_id) || initialData.category_id || "";

  if (formState.brand !== initialBrand || activationChange) {
    hasRealChanges = true;
  }

  if (formState.category !== initialCategory || activationChange) {
    hasRealChanges = true;
  }

  // Siempre enviar brand_id y category_id si el producto está activo
  if (productIsOrWillBeActive) {
    if (formState.brand) updateRequest.brand_id = formState.brand;
    if (formState.category) updateRequest.category_id = formState.category;
  } else {
    // Inactivo: solo enviar si cambió
    if (formState.brand && formState.brand !== initialBrand) {
      updateRequest.brand_id = formState.brand;
    }
    if (formState.category && formState.category !== initialCategory) {
      updateRequest.category_id = formState.category;
    }
  }
  const initialAttachmentIds =
    initialData.attachments?.map((att) => att.id) || [];
  const currentAttachmentIds = formState.attachments || [];

  const attachmentsChanged =
    JSON.stringify([...initialAttachmentIds].sort()) !==
    JSON.stringify([...currentAttachmentIds].sort());

  if (attachmentsChanged) {
    updateRequest.attachments = currentAttachmentIds;
    hasRealChanges = true;
  }

  if (formState.description !== initialData.description) {
    updateRequest.description = formState.description;
    hasRealChanges = true;
  }
  if (formState.product_code !== initialData.product_code) {
    updateRequest.product_code = formState.product_code;
    hasRealChanges = true;
  }

  if (formState.is_active !== initialData.is_active) {
    updateRequest.is_active = formState.is_active;
    hasRealChanges = true;
  }
  if (formState.is_featured !== initialData.is_featured) {
    updateRequest.is_featured = formState.is_featured;
    hasRealChanges = true;
  }

  if (attachmentId !== undefined) {
    updateRequest.image_attachment = attachmentId;
    hasRealChanges = true;
  }

  if (formState.articulo !== (initialData.articulo ?? "")) {
    updateRequest.articulo = formState.articulo;
    hasRealChanges = true;
  }
  if (formState.cas !== (initialData.cas ?? "")) {
    updateRequest.cas = formState.cas;
    hasRealChanges = true;
  }
  if (formState.sedronar !== (initialData.sedronar ?? "-")) {
    updateRequest.sedronar = formState.sedronar;
    hasRealChanges = true;
  }
  if (
    espAttachmentId !== undefined &&
    espAttachmentId !== (initialData.esp_attachment_id ?? null)
  ) {
    updateRequest.esp_attachment_id = espAttachmentId;
    hasRealChanges = true;
  }
  if (
    hdsAttachmentId !== undefined &&
    hdsAttachmentId !== (initialData.hds_attachment_id ?? null)
  ) {
    updateRequest.hds_attachment_id = hdsAttachmentId;
    hasRealChanges = true;
  }

  const currentSpecTable = JSON.stringify(
    formState.spec_table ?? EMPTY_SPEC_TABLE
  );
  const initialSpecTable = JSON.stringify(
    initialData.spec_table ?? EMPTY_SPEC_TABLE
  );
  if (currentSpecTable !== initialSpecTable) {
    updateRequest.spec_table = formState.spec_table ?? EMPTY_SPEC_TABLE;
    hasRealChanges = true;
  }

  const currentRelatedIds =
    formState.related?.map((rel) => rel.id).sort() || [];
  const initialRelatedIds =
    initialData.related?.map((rel) => rel.id).sort() || [];

  if (JSON.stringify(currentRelatedIds) !== JSON.stringify(initialRelatedIds)) {
    updateRequest.related_product_ids = currentRelatedIds;
    hasRealChanges = true;
  }

  updateRequest.name = formState.name;

  if (!hasRealChanges) {
    return {} as ProductUpdateRequest;
  }

  return updateRequest as ProductUpdateRequest;
};

export const hasProductChanges = (updateRequest: ProductUpdateRequest) =>
  Object.keys(updateRequest).length > 0;

export const getEmptyProductFormState = (): ProductFormState => ({
  name: "",
  attachments: [],
  brand: "",
  category: "",
  description: "",
  product_code: "",
  image_attachment_id: "",
  image_file: null,
  is_active: true,
  variants: [],
  related: [],
  is_featured: false,
  attachments_existing: [],
  attachments_files: [],
  articulo: "",
  cas: "",
  sedronar: "-",
  esp_attachment_id: null,
  hds_attachment_id: null,
  esp_file: null,
  hds_file: null,
  spec_table: { ...EMPTY_SPEC_TABLE },
});
