import { createAttachment } from "@/utils/fileConvert";
import {
  formStateToCreateRequest,
  formStateToUpdateRequest,
  hasProductChanges,
  sanitizeSpecs,
} from "@/utils/productConverters";
import { createProduct, updateProduct } from "@/store/productSlice";
import { createSpec, updateSpec, deleteSpec } from "@/store/specsSlice";
import { AppDispatch } from "@/store";
import { Product, ProductFormState, ProductSpec } from "@/types/types";

const normalizeSpecs = (specs: ProductSpec[] = []): ProductSpec[] =>
  sanitizeSpecs(
    specs.map((spec, index) => ({
      ...spec,
      display_order: spec.display_order ?? index,
    }))
  );

const hasSpecChanged = (next: ProductSpec, prev: ProductSpec) => {
  return (
    next.key !== prev.key ||
    next.value !== prev.value ||
    next.unit !== prev.unit ||
    next.is_visible !== prev.is_visible ||
    next.display_order !== prev.display_order
  );
};

const diffSpecs = (
  productId: string,
  nextSpecs: ProductSpec[],
  initialSpecs: ProductSpec[] = []
) => {
  const normalizedNext = normalizeSpecs(nextSpecs);
  const normalizedInitial = normalizeSpecs(initialSpecs);
  const initialById = new Map(
    normalizedInitial.filter((spec) => spec.id).map((spec) => [spec.id, spec])
  );

  const toCreate = normalizedNext
    .filter((spec) => !spec.id)
    .map((spec) => ({
      ...spec,
      product: productId,
    }));

  const toUpdate = normalizedNext
    .filter(
      (spec) =>
        spec.id &&
        initialById.has(spec.id) &&
        hasSpecChanged(spec, initialById.get(spec.id)!)
    )
    .map((spec) => ({
      id: spec.id as string,
      data: {
        key: spec.key,
        value: spec.value,
        unit: spec.unit,
        display_order: spec.display_order,
        is_visible: spec.is_visible,
      } as Partial<ProductSpec>,
    }));

  const nextIds = new Set(
    normalizedNext.map((spec) => spec.id).filter(Boolean)
  );
  const toDelete = normalizedInitial
    .filter((spec) => spec.id && !nextIds.has(spec.id))
    .map((spec) => spec.id as string);

  return { toCreate, toUpdate, toDelete };
};

export const cleanSpecsForSync = (specs: ProductSpec[] = []) =>
  normalizeSpecs(specs);

export const uploadProductImage = async (
  imageAttachment: ProductFormState["image_attachment"],
  currentAttachment?: string | null
): Promise<string | null | undefined> => {
  if (imageAttachment instanceof File) {
    const attachment = await createAttachment(imageAttachment);
    return attachment.id;
  }

  if (typeof imageAttachment === "string") {
    if (imageAttachment !== currentAttachment) {
      return imageAttachment;
    }
    return undefined;
  }

  if (imageAttachment === null && currentAttachment) {
    return null;
  }

  return undefined;
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
  if (initialData?.id) {
    const updateRequest = formStateToUpdateRequest(
      formState,
      initialData,
      attachmentId
    );
    if (!hasProductChanges(updateRequest)) {
      return initialData;
    }

    return dispatch(
      updateProduct({
        id: initialData.id,
        data: updateRequest,
      })
    ).unwrap();
  }

  const createRequest = formStateToCreateRequest(
    formState,
    attachmentId ?? null
  );

  return dispatch(createProduct(createRequest)).unwrap();
};

export const syncProductSpecifications = async ({
  dispatch,
  productId,
  nextSpecs,
  initialSpecs = [],
}: {
  dispatch: AppDispatch;
  productId: string;
  nextSpecs: ProductSpec[];
  initialSpecs?: ProductSpec[];
}) => {
  const { toCreate, toUpdate, toDelete } = diffSpecs(
    productId,
    nextSpecs,
    initialSpecs
  );

  for (const spec of toCreate) {
    await dispatch(createSpec(spec)).unwrap();
  }

  for (const spec of toUpdate) {
    await dispatch(
      updateSpec({
        id: spec.id,
        data: spec.data,
      })
    ).unwrap();
  }

  for (const specId of toDelete) {
    await dispatch(deleteSpec(specId)).unwrap();
  }

  return {
    created: toCreate.length,
    updated: toUpdate.length,
    deleted: toDelete.length,
  };
};

export const saveProductFlow = async ({
  dispatch,
  formState,
  initialData,
}: {
  dispatch: AppDispatch;
  formState: ProductFormState;
  initialData?: Product | null;
}) => {
  const cleanedSpecs = cleanSpecsForSync(formState.specs);
  const attachmentId = await uploadProductImage(
    formState.image_attachment,
    initialData?.image_attachment ?? null
  );

  const product = await saveProductEntity({
    dispatch,
    formState: { ...formState, specs: cleanedSpecs },
    initialData,
    attachmentId,
  });

  await syncProductSpecifications({
    dispatch,
    productId: product.id,
    nextSpecs: cleanedSpecs,
    initialSpecs: initialData?.specs || [],
  });

  return product;
};

export const validateProductForm = (
  formState: ProductFormState
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

  if (!formState.product_code.trim()) {
    return {
      isValid: false,
      errorMessage: "El código del producto es obligatorio",
    };
  }

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

  return { isValid: true };
};
