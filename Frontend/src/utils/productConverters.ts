// utils/productConverters.ts
import type {
  Product,
  ProductFormState,
  ProductCreateRequest,
  ProductUpdateRequest,
  TecnicalSpecs,
  Variants,
} from "@/types/types";

/**
 * Convierte un Product (del backend) a ProductFormState (para el formulario)
 */
export const productToFormState = (product: Product): ProductFormState => {
  return {
    attachments: product.attachments.map((att) => {
      return att.id;
    }),
    attachments_files: null,
    attachments_existing: null,
    id: product.id,
    name: product.name,
    brand: product.brand_id || product.brand || "",
    category: product.category_id || product.category || "",
    description: product.description || "",
    product_code: product.product_code || "",
    image_file: null,
    image_attachment_id: product.image_attachment,
    is_featured: product.is_featured || false,
    is_active: product.is_active,
    variants: product.variants || [],
    related: product.related || product.related_products || [],
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

  const initialBrand = initialData.brand_id || initialData.brand;
  const initialCategory = initialData.category_id || initialData.category;

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
});
