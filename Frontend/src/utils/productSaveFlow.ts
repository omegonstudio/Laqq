import { formStateToUpdateRequest } from "@/utils/productConverters";
import { createProduct, updateProduct } from "@/store/productSlice";
import { AppDispatch } from "@/store";
import {
  Product,
  ProductCreateRequest,
  ProductFormState,
  ProductUpdateRequest,
  Variants,
} from "@/types/types";
import { productsApi } from "@/lib/api/products";

export const variantsInitialData: Variants = {
  id: undefined,
  product: "",
  code: "",
  dimensions: "",
  name: "",
  technical_specs: [],
};

export const CreateProduct = async ({
  dispatch,
  formState,
  attachmentId,
}: {
  dispatch: AppDispatch;
  formState: ProductFormState;
  attachmentId?: string | null;
}): Promise<Product> => {
  const payload: ProductCreateRequest = {
    image_attachment: attachmentId,
    attachments: formState.attachments,
    name: formState.name,
    description: formState.description,
    product_code: formState.product_code,
    is_active: formState.is_active,
    related_product_ids: formState.related.map((r) => r.id),
    is_featured: formState.is_featured,
    // Solo incluir brand y category si el producto está activo
    ...(formState.is_active && {
      brand_id: formState.brand,
      category_id: formState.category,
    }),
  };
  return await dispatch(createProduct(payload)).unwrap();
};
export const syncVariants = async (
  productId: string,
  current: Variants[],
  initial: Variants[]
) => {
  const initialMap = new Map(initial.map((v) => [v.id, v]));

  const toDelete = initial.filter(
    (init) => !current.some((v) => v.id === init.id)
  );

  const toCreate = current.filter((v) => !v.id);

  const toUpdate = current.filter((v) => v.id && initialMap.has(v.id));

  // DELETE
  await Promise.all(toDelete.map((v) => productsApi.deleteVariants(v.id!)));

  // CREATE
  await Promise.all(
    toCreate.map((v) =>
      productsApi.createVariants({
        ...v,
        product: productId,
      })
    )
  );

  // UPDATE
  await Promise.all(
    toUpdate.map((v) =>
      productsApi.updateVariants(v.id!, {
        ...v,
        product: productId,
      })
    )
  );
};
export const saveProductEntity = async ({
  dispatch,
  formState,
  initialData,
  attachmentId,
}: {
  dispatch: AppDispatch;
  formState: ProductFormState;
  initialData?: Product | null;
  attachmentId?: string | null;
}): Promise<Product> => {
  // ===== UPDATE =====
  const updateRequest: ProductUpdateRequest = formStateToUpdateRequest(
    formState,
    initialData,
    attachmentId
  );

  return dispatch(
    updateProduct({
      id: initialData.id,
      data: { name: formState.name, ...updateRequest },
    })
  ).unwrap();
};
export const buildProductUploadFormData = (
  data: Partial<ProductCreateRequest> & { files?: File[] }
): FormData => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value == null) return;

    if (key === "files" && Array.isArray(value)) {
      value.forEach((file) => formData.append("files", file));
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((v) => formData.append(key, String(v)));
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
};
export const normalizeVariants = (vars: Variants[]) =>
  vars
    .map((v) => ({
      id: v.id,
      code: v.code.trim(),
      name: v.name?.trim() || "",
      dimensions: v.dimensions?.trim() || "",
      technical_specs: (v.technical_specs || [])
        .map((s) => ({
          key: s.key,
          value: s.value.trim(),
        }))
        .filter((s) => s.value)
        .sort((a, b) => a.key.localeCompare(b.key)),
    }))
    .sort((a, b) => (a.id || "").localeCompare(b.id || ""));
export const validateProductForm = (
  formState: ProductFormState,
  options?: { skipBrandAndCategory?: boolean }
): {
  isValid: boolean;
  errorMessage?: string;
} => {
  if (!formState.name.trim()) {
    return {
      isValid: false,
      errorMessage: "El nombre del producto es obligatorio",
    };
  }
  if (!options?.skipBrandAndCategory) {
    if (!formState.category) {
      return {
        isValid: false,
        errorMessage: "Debes seleccionar una categoría",
      };
    }
    if (formState.variants) {
      const invalid = formState.variants.some((v) => !v.code || !v.code.trim());

      if (invalid) {
        return {
          isValid: false,
          errorMessage: "Todas las variantes deben tener modelo",
        };
      }
    }
    if (!formState.brand) {
      return {
        isValid: false,
        errorMessage: "Debes seleccionar una marca",
      };
    }
  }

  return { isValid: true };
};
