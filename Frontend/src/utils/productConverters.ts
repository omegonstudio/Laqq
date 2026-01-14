// utils/productConverters.ts
import type {
  Product,
  ProductFormState,
  ProductCreateRequest,
  ProductUpdateRequest,
  ProductSpec,
  ProductFixedSpec,
} from "@/types/types";
import {
  fixedSpecInitialData,
  normalizeFixedSpecs,
  normalizeSpecs,
} from "./productSaveFlow";

export const sanitizeSpecs = (specs: ProductSpec[] = []): ProductSpec[] => {
  return specs
    .map((spec, index) => ({
      id: spec.id,
      product: spec.product,
      key: spec.key?.trim() || "",
      value: spec.value?.trim() || "",
      unit: spec.unit ?? "",
      display_order: spec.display_order ?? index,
      is_visible: spec.is_visible ?? true,
    }))
    .filter((spec) => spec.key || spec.value);
};
export const sanitizeFixedSpecs = (
  specs: ProductFixedSpec[] = []
): ProductFixedSpec[] => {
  return specs
    .map((spec) => ({
      id: spec.id,
      product: spec.product,
      code: spec.code?.trim() || null, // ✅ Consistente con los demás
      volume: spec.volume?.trim() || null, // ✅ Trim strings también
      dimensions: spec.dimensions?.trim() || null,
      cap: spec.cap?.trim() || null,
      outlet: spec.outlet?.trim() || null,
      accuracy: spec.accuracy?.trim() || null,
      precision: spec.precision?.trim() || null,
      // additional_specs: spec.additional_specs?.trim() || null,
      created_at: spec.created_at || "",
    }))
    .filter(
      (spec) =>
        // ✅ Filtrar solo si tiene ID o algún campo con valor real
        spec.id ||
        spec.code ||
        spec.volume ||
        spec.dimensions ||
        spec.cap ||
        spec.outlet ||
        spec.accuracy ||
        spec.precision
      // spec.additional_specs
    );
};
/**
 * Convierte un Product (del backend) a ProductFormState (para el formulario)
 */
export const productToFormState = (product: Product): ProductFormState => {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand_id || product.brand || "",
    category: product.category_id || product.category || "",
    description: product.description || "",
    product_code: product.product_code || "",
    image_file: null, // ← nunca viene del backend
    image_attachment_id: product.image_attachment, // UUID
    is_featured: product.is_featured || false,
    is_active: product.is_active,
    specs: sanitizeSpecs(product.specs || product.specifications || []),
    related: product.related || product.related_products || [],
    fixed_specs:
      product.fixed_specs.length > 0
        ? sanitizeFixedSpecs(product.fixed_specs)
        : [fixedSpecInitialData],
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
  };
};
export const formStateToUpdateRequest = (
  formState: ProductFormState,
  initialData: Product,
  attachmentId?: string | null
): ProductUpdateRequest => {
  const updateRequest: Partial<ProductUpdateRequest> = {};
  let hasRealChanges = false; // ← Bandera para rastrear cambios

  // Comparar name
  if (formState.name !== initialData.name) {
    hasRealChanges = true;
  }

  const initialBrand = initialData.brand_id || initialData.brand;
  if (formState.brand !== initialBrand) {
    updateRequest.brand_id = formState.brand;
    hasRealChanges = true;
  }

  const initialCategory = initialData.category_id || initialData.category;
  if (formState.category !== initialCategory) {
    updateRequest.category_id = formState.category;
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

  const currentRelatedIds =
    formState.related?.map((rel) => rel.id).sort() || [];
  const initialRelatedIds =
    initialData.related?.map((rel) => rel.id).sort() || [];

  if (JSON.stringify(currentRelatedIds) !== JSON.stringify(initialRelatedIds)) {
    updateRequest.related_product_ids = currentRelatedIds;
    hasRealChanges = true;
  }

  // ✅ SIEMPRE incluir name (requerido por backend)
  updateRequest.name = formState.name;

  // ✅ Si no hubo cambios reales, retornar objeto vacío para que hasProductChanges sea false
  if (!hasRealChanges) {
    return {} as ProductUpdateRequest;
  }

  return updateRequest as ProductUpdateRequest;
};

export const haveSpecsChanged = (
  currentSpecs: ProductSpec[],
  initialSpecs: ProductSpec[] = []
): boolean => {
  const normalizedCurrent = normalizeSpecs(currentSpecs);
  const normalizedInitial = normalizeSpecs(initialSpecs);

  return (
    JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedInitial)
  );
};

export const haveFixedSpecsChanged = (
  current: ProductFixedSpec[],
  initial: ProductFixedSpec[] = []
): boolean => {
  const normalizedCurrent = normalizeFixedSpecs(current);
  const normalizedInitial = normalizeFixedSpecs(initial);

  return (
    JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedInitial)
  );
};

export const hasProductChanges = (updateRequest: ProductUpdateRequest) =>
  Object.keys(updateRequest).length > 0;

export const getEmptyProductFormState = (): ProductFormState => {
  return {
    name: "",
    brand: "",
    category: "",
    description: "",
    product_code: "",
    image_attachment_id: "",
    image_file: null,
    is_active: true,
    specs: [],
    related: [],
    fixed_specs: [fixedSpecInitialData],
    is_featured: false,
  };
};
