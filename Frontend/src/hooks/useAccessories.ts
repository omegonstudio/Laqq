import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  accessoriesApi,
  AccessoriesListParams,
  ProductAccessoriesParams,
} from "@/lib/api/accessories";
import {
  Accessory,
  PaginatedResponse,
  ProductAccessory,
} from "@/types/api";
import { NormalizedApiError } from "@/lib/api/client";

const accessoriesListKey = (params?: AccessoriesListParams) => [
  "accessories",
  "list",
  params,
];
const accessoryDetailKey = (id?: string) => ["accessories", "detail", id];
const productAccessoriesKey = (params?: ProductAccessoriesParams) => [
  "product-accessories",
  "list",
  params,
];
const productAccessoryDetailKey = (id?: number | string) => [
  "product-accessories",
  "detail",
  id,
];

export const useAccessoriesList = (params?: AccessoriesListParams) =>
  useQuery<PaginatedResponse<Accessory>, NormalizedApiError>({
    queryKey: accessoriesListKey(params),
    queryFn: () => accessoriesApi.list(params),
    placeholderData: (prev) => prev,
  });

export const useAccessory = (id?: string) =>
  useQuery<Accessory, NormalizedApiError>({
    queryKey: accessoryDetailKey(id),
    queryFn: () => accessoriesApi.get(id as string),
    enabled: Boolean(id),
  });

export const useCreateAccessory = () => {
  const queryClient = useQueryClient();

  return useMutation<Accessory, NormalizedApiError, Partial<Accessory>>({
    mutationFn: (payload) => accessoriesApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["accessories"] });
      queryClient.setQueryData(accessoryDetailKey(data.id), data);
    },
  });
};

export const useUpdateAccessory = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Accessory,
    NormalizedApiError,
    { id: string; payload: Partial<Accessory> }
  >({
    mutationFn: ({ id, payload }) => accessoriesApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["accessories"] });
      queryClient.setQueryData(accessoryDetailKey(data.id), data);
    },
  });
};

export const usePatchAccessory = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Accessory,
    NormalizedApiError,
    { id: string; payload: Partial<Accessory> }
  >({
    mutationFn: ({ id, payload }) => accessoriesApi.patch(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["accessories"] });
      queryClient.setQueryData(accessoryDetailKey(data.id), data);
    },
  });
};

export const useDeleteAccessory = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => accessoriesApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["accessories"] });
      queryClient.removeQueries({ queryKey: accessoryDetailKey(id) });
    },
  });
};

// Product accessories
export const useProductAccessories = (params?: ProductAccessoriesParams) =>
  useQuery<PaginatedResponse<ProductAccessory>, NormalizedApiError>({
    queryKey: productAccessoriesKey(params),
    queryFn: () => accessoriesApi.listProductAccessories(params),
    placeholderData: (prev) => prev,
  });

export const useProductAccessory = (id?: number | string) =>
  useQuery<ProductAccessory, NormalizedApiError>({
    queryKey: productAccessoryDetailKey(id),
    queryFn: () => accessoriesApi.getProductAccessory(id as string),
    enabled: Boolean(id),
  });

export const useCreateProductAccessory = () => {
  const queryClient = useQueryClient();

  return useMutation<ProductAccessory, NormalizedApiError, Partial<ProductAccessory>>({
    mutationFn: (payload) => accessoriesApi.createProductAccessory(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product-accessories"] });
      queryClient.setQueryData(productAccessoryDetailKey(data.id), data);
    },
  });
};

export const useUpdateProductAccessory = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ProductAccessory,
    NormalizedApiError,
    { id: number | string; payload: Partial<ProductAccessory> }
  >({
    mutationFn: ({ id, payload }) =>
      accessoriesApi.updateProductAccessory(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product-accessories"] });
      queryClient.setQueryData(productAccessoryDetailKey(data.id), data);
    },
  });
};

export const usePatchProductAccessory = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ProductAccessory,
    NormalizedApiError,
    { id: number | string; payload: Partial<ProductAccessory> }
  >({
    mutationFn: ({ id, payload }) =>
      accessoriesApi.patchProductAccessory(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product-accessories"] });
      queryClient.setQueryData(productAccessoryDetailKey(data.id), data);
    },
  });
};

export const useDeleteProductAccessory = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, number | string>({
    mutationFn: (id) => accessoriesApi.removeProductAccessory(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["product-accessories"] });
      queryClient.removeQueries({ queryKey: productAccessoryDetailKey(id) });
    },
  });
};

