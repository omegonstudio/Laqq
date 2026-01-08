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
import {
  Product,
  ProductFixedSpec,
  ProductFormState,
  ProductSpec,
} from "@/types/types";
import {
  createFixedSpec,
  deleteFixedSpec,
  updateFixedSpec,
} from "@/store/fixedSpecsSlice";

export const fixedSpecInitialData: ProductFixedSpec = {
  id: undefined,
  product: "",
  code: "",
  volume: "",
  dimensions: "",
  cap: "",
  outlet: "",
  accuracy: "",
  precision: "",
  additional_specs: null,
};
export const normalizeSpecs = (specs: ProductSpec[] = []): ProductSpec[] =>
  sanitizeSpecs(
    specs.map((spec, index) => ({
      ...spec,
      display_order: spec.display_order ?? index,
    }))
  );

export const normalizeFixedSpecs = (
  specs: ProductFixedSpec[] = []
): ProductFixedSpec[] => {
  return specs
    .map((spec) => ({
      id: spec.id,
      product: spec.product,
      code: spec.code?.trim() || null,
      volume: spec.volume?.trim() || null,
      dimensions: spec.dimensions?.trim() || null,
      cap: spec.cap?.trim() || null,
      outlet: spec.outlet?.trim() || null,
      accuracy: spec.accuracy?.trim() || null,
      precision: spec.precision?.trim() || null,
    }))
    .filter(
      (spec) =>
        spec.id ||
        spec.code ||
        spec.volume ||
        spec.dimensions ||
        spec.cap ||
        spec.outlet ||
        spec.accuracy ||
        spec.precision
    );
};

const hasSpecChanged = (next: ProductSpec, prev: ProductSpec) => {
  return (
    next.key !== prev.key ||
    next.value !== prev.value ||
    next.unit !== prev.unit ||
    next.is_visible !== prev.is_visible ||
    next.display_order !== prev.display_order
  );
};
const hasSpecFixedChanged = (
  next: ProductFixedSpec,
  prev: ProductFixedSpec
) => {
  const changed =
    next.code !== prev.code ||
    next.product !== prev.product ||
    next.id !== prev.id ||
    next.volume !== prev.volume ||
    next.dimensions !== prev.dimensions ||
    next.cap !== prev.cap ||
    next.outlet !== prev.outlet ||
    next.accuracy !== prev.accuracy ||
    next.precision !== prev.precision ||
    next.additional_specs !== prev.additional_specs;
  console.log("EJECUTA HAS");
  if (changed) {
    console.log("Fixed spec changed:", { next, prev });
  }

  return changed;
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
const diffFixedSpecs = (
  productId: string,
  nextSpecs: ProductFixedSpec[],
  initialSpecs: ProductFixedSpec[] = []
) => {
  const normalizedNext = normalizeFixedSpecs(nextSpecs);
  const normalizedInitial = normalizeFixedSpecs(initialSpecs);
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
    .filter((spec) => {
      const hasId = !!spec.id;
      const existsInInitial = initialById.has(spec.id);
      const hasChanged =
        existsInInitial && hasSpecFixedChanged(spec, initialById.get(spec.id)!);

      return hasId && existsInInitial && hasChanged;
    })
    .map((spec) => ({
      id: spec.id as string,
      data: {
        id: spec.id,
        product: spec.product,
        code: spec.code || null,
        volume: spec.volume || null,
        dimensions: spec.dimensions,
        cap: spec.cap,
        outlet: spec.outlet,
        accuracy: spec.accuracy,
        precision: spec.precision,
        additional_specs: spec.additional_specs,
        created_at: spec.created_at || "",
      } as Partial<ProductFixedSpec>,
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

export const cleanFixedSpecsForSync = (specs: ProductFixedSpec[] = []) =>
  normalizeFixedSpecs(specs);

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

export const syncProductFixedSpecifications = async ({
  dispatch,
  productId,
  nextSpecs,
  initialSpecs = [],
}: {
  dispatch: AppDispatch;
  productId: string;
  nextSpecs: ProductFixedSpec[];
  initialSpecs?: ProductFixedSpec[];
}) => {
  console.log("EJECUTA SYNC");

  const { toCreate, toUpdate, toDelete } = diffFixedSpecs(
    productId,
    nextSpecs,
    initialSpecs
  );
  for (const spec of toCreate) {
    await dispatch(createFixedSpec(spec)).unwrap();
  }

  for (const spec of toUpdate) {
    await dispatch(
      updateFixedSpec({
        id: spec.id,
        data: spec.data,
      })
    ).unwrap();
  }

  for (const specId of toDelete) {
    await dispatch(deleteFixedSpec(specId)).unwrap();
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
