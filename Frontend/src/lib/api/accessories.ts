import { api } from "./client";
import { cleanParams, QueryParams } from "./utils";
import {
  Accessory,
  PaginatedResponse,
  ProductAccessory,
} from "@/types/api";

const BASE = "/accessories";

export interface AccessoriesListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  brand?: string;
  category?: string;
  is_active?: boolean;
}

export interface ProductAccessoriesParams {
  page?: number;
  page_size?: number;
  product?: string;
  accessory?: string;
}

export const accessoriesApi = {
  list: (params?: AccessoriesListParams) =>
    api.get<PaginatedResponse<Accessory>>(
      `${BASE}/list/`,
      cleanParams(params as QueryParams)
    ),
  get: (id: string) => api.get<Accessory>(`${BASE}/list/${id}/`),
  create: (payload: Partial<Accessory>) =>
    api.post<Accessory>(`${BASE}/list/`, payload),
  update: (id: string, payload: Partial<Accessory>) =>
    api.put<Accessory>(`${BASE}/list/${id}/`, payload),
  patch: (id: string, payload: Partial<Accessory>) =>
    api.patch<Accessory>(`${BASE}/list/${id}/`, payload),
  remove: (id: string) => api.delete<void>(`${BASE}/list/${id}/`),

  listProductAccessories: (params?: ProductAccessoriesParams) =>
    api.get<PaginatedResponse<ProductAccessory>>(
      `${BASE}/product-accessories/`,
      cleanParams(params as QueryParams)
    ),
  getProductAccessory: (id: number | string) =>
    api.get<ProductAccessory>(`${BASE}/product-accessories/${id}/`),
  createProductAccessory: (payload: Partial<ProductAccessory>) =>
    api.post<ProductAccessory>(`${BASE}/product-accessories/`, payload),
  updateProductAccessory: (id: number | string, payload: Partial<ProductAccessory>) =>
    api.put<ProductAccessory>(`${BASE}/product-accessories/${id}/`, payload),
  patchProductAccessory: (id: number | string, payload: Partial<ProductAccessory>) =>
    api.patch<ProductAccessory>(`${BASE}/product-accessories/${id}/`, payload),
  removeProductAccessory: (id: number | string) =>
    api.delete<void>(`${BASE}/product-accessories/${id}/`),
};

