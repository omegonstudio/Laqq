import {
  formStateToUpdateRequest,
  hasProductChanges,
  sanitizeSpecs,
} from "@/utils/productConverters";
import { createProduct, updateProduct } from "@/store/productSlice";
import { createSpec, updateSpec, deleteSpec } from "@/store/specsSlice";
import { AppDispatch } from "@/store";
import {
  Attachment,
  Product,
  ProductCreateRequest,
  ProductFixedSpec,
  ProductFormState,
  ProductSpec,
  ProductUpdateRequest,
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
export const normalizeSpecs = (specs: ProductSpec[] = []): ProductSpec[] => {
  return sanitizeSpecs(
    specs.map((spec, index) => ({
      key: spec.key.trim(),
      product: spec.product,
      value: spec.value.trim(),
      unit: spec.unit?.trim() || null,
      is_visible: spec.is_visible ?? true,
      id: spec.id,
      display_order: spec.display_order ?? index,
    }))
  );
};

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

const hasSpecChanged = (next: ProductSpec, prev: ProductSpec): boolean => {
  return (
    next.key !== prev.key ||
    next.value !== prev.value ||
    next.unit !== prev.unit ||
    next.display_order !== prev.display_order ||
    next.is_visible !== prev.is_visible
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
  return changed;
};

const diffSpecs = (nextSpecs: ProductSpec[], prevSpecs: ProductSpec[] = []) => {
  // Crear mapa de specs anteriores por ID para acceso rápido
  const prevById = new Map(
    prevSpecs.filter((s) => s.id).map((s) => [s.id!, s])
  );

  // Separar specs con y sin ID
  const toCreate = nextSpecs.filter((s) => !s.id);

  const toUpdate = nextSpecs
    .filter((s) => s.id) // Solo las que tienen ID
    .filter((s) => {
      const prev = prevById.get(s.id!);
      return prev && hasSpecChanged(s, prev); // Solo si cambió algo
    });

  // IDs que había antes pero ya no están
  const nextIds = new Set(nextSpecs.filter((s) => s.id).map((s) => s.id));
  const toDelete = prevSpecs
    .filter((s) => s.id && !nextIds.has(s.id))
    .map((s) => s.id!);

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

const haveAttachmentsChanged = (
  existing: Attachment[] = [],
  initial: Attachment[] = [],
  newFiles: File[] = []
): boolean => {
  // 1. IDs iniciales
  const initialIds = initial.map((a) => a.id).sort();

  // 2. IDs actuales (solo existentes)
  const currentIds = existing.map((a) => a.id).sort();

  // 3. Se eliminaron attachments
  const removed = JSON.stringify(initialIds) !== JSON.stringify(currentIds);

  // 4. Se agregaron archivos nuevos
  const added = newFiles.length > 0;

  return removed || added;
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
  // ===== CREATE =====
  const payload: ProductCreateRequest = {
    image_attachment: attachmentId,
    brand_id: formState.brand,
    category_id: formState.category,
    attachments: formState.attachments,
    name: formState.name,
    description: formState.description,
    product_code: formState.product_code,
    is_active: formState.is_active,
    related_product_ids: formState.related.map((r) => r.id),
    is_featured: formState.is_featured,
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
  console.log("saveProductEntity", { formState, initialData, attachmentId });
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
  const normalizedNext = normalizeSpecs(nextSpecs);
  const normalizedPrev = normalizeSpecs(initialSpecs);

  const { toCreate, toUpdate, toDelete } = diffSpecs(
    normalizedNext,
    normalizedPrev
  );

  for (const spec of toCreate) {
    await dispatch(
      createSpec({
        ...spec,
        product: productId, // ← Agregar productId aquí
      })
    ).unwrap();
  }

  for (const spec of toUpdate) {
    await dispatch(
      updateSpec({
        id: spec.id!,
        data: {
          key: spec.key,
          value: spec.value,
          unit: spec.unit,
          display_order: spec.display_order,
          is_visible: spec.is_visible,
        },
      })
    ).unwrap();
  }

  // Eliminar specs
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

// export const saveProductFlow = async ({
//   dispatch,
//   formState,
//   initialData,
// }: {
//   dispatch: AppDispatch;
//   formState: ProductFormState;
//   initialData?: Product | null;
// }) => {
//   const cleanedSpecs = cleanSpecsForSync(formState.specs);

//   const product = await saveProductEntity({
//     dispatch,
//     formState: { ...formState, specs: cleanedSpecs },
//     initialData,
//   });
//   console.log("DISPATCH REFRESH", product.id);
//   dispatch(refreshProductEverywhere(product.id));

//   return product;
// };

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
