// utils/productConverters.ts
import type {
  Product,
  ProductFormState,
  ProductCreateRequest,
  ProductUpdateRequest,
} from "@/types/types";

/**
 * Convierte un Product (del backend) a ProductFormState (para el formulario)
 */
export const productToFormState = (product: Product): ProductFormState => {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
    product_code: product.product_code,
    image_attachment: product.image_attachment, // Es un UUID string
    is_active: product.is_active,
    specs: product.specs || [],
    related: product.related || [],
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
    image_attachment: attachmentId || null,
    is_active: formState.is_active,
    related_product_ids: formState.related?.map((rel) => rel.id) || [],
    // specs no se envía en la creación, se crean después
  };
};

/**
 * Convierte ProductFormState a ProductUpdateRequest (para actualizar)
 */
export const formStateToUpdateRequest = (
  formState: ProductFormState,
  initialData: Product, // ← Agregar parámetro para comparar
  attachmentId?: string | null
): ProductUpdateRequest => {
  const updateRequest: Partial<ProductUpdateRequest> = {};

  // Solo incluir campos que cambiaron
  if (formState.name !== initialData.name) {
    updateRequest.name = formState.name;
  }

  if (formState.brand !== initialData.brand) {
    updateRequest.brand_id = formState.brand;
  }

  if (formState.category !== initialData.category) {
    updateRequest.category_id = formState.category;
  }

  if (formState.description !== initialData.description) {
    updateRequest.description = formState.description;
  }

  if (formState.product_code !== initialData.product_code) {
    updateRequest.product_code = formState.product_code;
  }

  if (formState.is_active !== initialData.is_active) {
    updateRequest.is_active = formState.is_active;
  }

  // Imagen: solo si se modificó
  if (attachmentId !== undefined) {
    updateRequest.image_attachment = attachmentId;
  }

  // Related: comparar arrays
  const currentRelatedIds =
    formState.related?.map((rel) => rel.id).sort() || [];
  const initialRelatedIds =
    initialData.related?.map((rel) => rel.id).sort() || [];

  if (JSON.stringify(currentRelatedIds) !== JSON.stringify(initialRelatedIds)) {
    updateRequest.related_product_ids = currentRelatedIds;
  }

  // Specs: comparar arrays
  const currentSpecIds =
    formState.specs
      ?.map((spec) => spec.id)
      .filter(Boolean)
      .sort() || [];
  const initialSpecIds = initialData.specs?.map((spec) => spec.id).sort() || [];

  if (JSON.stringify(currentSpecIds) !== JSON.stringify(initialSpecIds)) {
    updateRequest.specs = currentSpecIds;
  }

  return updateRequest as ProductUpdateRequest;
};
/**
 * Estado inicial vacío para formulario nuevo
 */
export const getEmptyProductFormState = (): ProductFormState => {
  return {
    name: "",
    brand: "",
    category: "",
    description: "",
    product_code: "",
    image_attachment: null,
    is_active: true,
    specs: [],
    related: [],
  };
};
