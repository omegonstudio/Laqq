import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  productsApi,
  ProductListParams,
  PaginationParams,
} from "@/lib/api/products";

import { NormalizedApiError } from "@/lib/api/client";
import { Brand, Category, Product, ProductSpec } from "@/types/types";
import { PaginatedResponse } from "@/types/api";

const listKey = (params?: ProductListParams) => ["products", "list", params];
const detailKey = (id?: string) => ["products", "detail", id];
const brandsKey = (params?: PaginationParams) => ["brands", "list", params];
const brandDetailKey = (id?: string) => ["brands", "detail", id];
const categoriesKey = (params?: PaginationParams) => [
  "categories",
  "list",
  params,
];
const categoryDetailKey = (id?: string) => ["categories", "detail", id];
const specsKey = (params?: PaginationParams) => [
  "product-specs",
  "list",
  params,
];
const specDetailKey = (id?: string) => ["product-specs", "detail", id];

export const useProductsList = (params?: ProductListParams) =>
  useQuery<PaginatedResponse<Product>, NormalizedApiError>({
    queryKey: listKey(params),
    queryFn: () => productsApi.list(params),
    placeholderData: (prev) => prev,
  });

export const useProduct = (id?: string) =>
  useQuery<Product, NormalizedApiError>({
    queryKey: detailKey(id),
    queryFn: () => productsApi.get(id as string),
    enabled: Boolean(id),
  });

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<Product, NormalizedApiError, Partial<Product>>({
    mutationFn: (payload) => productsApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.setQueryData(detailKey(data.id), data);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Product,
    NormalizedApiError,
    { id: string; payload: Partial<Product> }
  >({
    mutationFn: ({ id, payload }) => productsApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.setQueryData(detailKey(data.id), data);
    },
  });
};

export const usePatchProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Product,
    NormalizedApiError,
    { id: string; payload: Partial<Product> }
  >({
    mutationFn: ({ id, payload }) => productsApi.patch(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.setQueryData(detailKey(data.id), data);
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => productsApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.removeQueries({ queryKey: detailKey(id) });
    },
  });
};

// Brands
export const useBrandsList = (params?: PaginationParams) =>
  useQuery<PaginatedResponse<Brand>, NormalizedApiError>({
    queryKey: brandsKey(params),
    queryFn: () => productsApi.listBrands(params),
    placeholderData: (prev) => prev,
  });

export const useBrand = (id?: string) =>
  useQuery<Brand, NormalizedApiError>({
    queryKey: brandDetailKey(id),
    queryFn: () => productsApi.getBrand(id as string),
    enabled: Boolean(id),
  });

export const useCreateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation<Brand, NormalizedApiError, Partial<Brand>>({
    mutationFn: (payload) => productsApi.createBrand(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      queryClient.setQueryData(brandDetailKey(data.id), data);
    },
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Brand,
    NormalizedApiError,
    { id: string; payload: Partial<Brand> }
  >({
    mutationFn: ({ id, payload }) => productsApi.updateBrand(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      queryClient.setQueryData(brandDetailKey(data.id), data);
    },
  });
};

export const usePatchBrand = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Brand,
    NormalizedApiError,
    { id: string; payload: Partial<Brand> }
  >({
    mutationFn: ({ id, payload }) => productsApi.patchBrand(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      queryClient.setQueryData(brandDetailKey(data.id), data);
    },
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => productsApi.removeBrand(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      queryClient.removeQueries({ queryKey: brandDetailKey(id) });
    },
  });
};

// Categories
export const useCategoriesList = (params?: PaginationParams) =>
  useQuery<PaginatedResponse<Category>, NormalizedApiError>({
    queryKey: categoriesKey(params),
    queryFn: () => productsApi.listCategories(params),
    placeholderData: (prev) => prev,
  });

export const useCategory = (id?: string) =>
  useQuery<Category, NormalizedApiError>({
    queryKey: categoryDetailKey(id),
    queryFn: () => productsApi.getCategory(id as string),
    enabled: Boolean(id),
  });

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<Category, NormalizedApiError, Partial<Category>>({
    mutationFn: (payload) => productsApi.createCategory(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.setQueryData(categoryDetailKey(data.id), data);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Category,
    NormalizedApiError,
    { id: string; payload: Partial<Category> }
  >({
    mutationFn: ({ id, payload }) => productsApi.updateCategory(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.setQueryData(categoryDetailKey(data.id), data);
    },
  });
};

export const usePatchCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Category,
    NormalizedApiError,
    { id: string; payload: Partial<Category> }
  >({
    mutationFn: ({ id, payload }) => productsApi.patchCategory(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.setQueryData(categoryDetailKey(data.id), data);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => productsApi.removeCategory(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.removeQueries({ queryKey: categoryDetailKey(id) });
    },
  });
};

// Specs
export const useProductSpecs = (params?: PaginationParams) =>
  useQuery<PaginatedResponse<ProductSpec>, NormalizedApiError>({
    queryKey: specsKey(params),
    queryFn: () => productsApi.listSpecs(params),
    placeholderData: (prev) => prev,
  });

export const useProductSpec = (id?: string) =>
  useQuery<ProductSpec, NormalizedApiError>({
    queryKey: specDetailKey(id),
    queryFn: () => productsApi.getSpec(id as string),
    enabled: Boolean(id),
  });

export const useCreateProductSpec = () => {
  const queryClient = useQueryClient();

  return useMutation<ProductSpec, NormalizedApiError, Partial<ProductSpec>>({
    mutationFn: (payload) => productsApi.createSpec(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product-specs"] });
      queryClient.setQueryData(specDetailKey(data.id), data);
    },
  });
};

export const useUpdateProductSpec = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ProductSpec,
    NormalizedApiError,
    { id: string; payload: Partial<ProductSpec> }
  >({
    mutationFn: ({ id, payload }) => productsApi.updateSpec(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product-specs"] });
      queryClient.setQueryData(specDetailKey(data.id), data);
    },
  });
};

export const usePatchProductSpec = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ProductSpec,
    NormalizedApiError,
    { id: string; payload: Partial<ProductSpec> }
  >({
    mutationFn: ({ id, payload }) => productsApi.patchSpec(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product-specs"] });
      queryClient.setQueryData(specDetailKey(data.id), data);
    },
  });
};

export const useDeleteProductSpec = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => productsApi.removeSpec(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["product-specs"] });
      queryClient.removeQueries({ queryKey: specDetailKey(id) });
    },
  });
};

export const useBulkUploadProducts = () => {
  const queryClient = useQueryClient();

  return useMutation<Record<string, unknown>, NormalizedApiError, FormData>({
    mutationFn: (formData) => productsApi.bulkUploadProducts(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

// Alias para compatibilidad previa
export const useProducts = useProductsList;
