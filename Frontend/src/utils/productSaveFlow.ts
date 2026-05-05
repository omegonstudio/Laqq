import { formStateToUpdateRequest } from "@/utils/productConverters";
import { createProduct, updateProduct } from "@/store/productSlice";
import { createSpec, updateSpec, deleteSpec } from "@/store/specsSlice";
import { AppDispatch } from "@/store";
import {
  Product,
  ProductCreateRequest,
  ProductFormState,
  ProductUpdateRequest,
  Variants,
} from "@/types/types";

export const variantsInitialData: Variants = {
  id: undefined,
  product: "",
  code: "",
  dimensions: "",
  name: "",
  tecnical_specs: [],
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

    if (!formState.brand) {
      return {
        isValid: false,
        errorMessage: "Debes seleccionar una marca",
      };
    }
  }

  return { isValid: true };
};
