import { api } from "./client";
import { cleanParams, QueryParams } from "./utils";
import {
  PaginatedResponse,
  Brand,
  Category,
  Product,
  ProductSpec,
} from "@/types/api";

const BASE = "/products";

export interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export interface ProductListParams extends PaginationParams {
  brand?: string;
  category?: string;
  is_active?: boolean;
}

export const productsApi = {
  list: (params?: ProductListParams) =>
    api.get<PaginatedResponse<Product>>(`${BASE}/list/`, cleanParams(params as QueryParams)),
  get: (id: string) => api.get<Product>(`${BASE}/list/${id}/`),
  create: (data: Partial<Product>) => api.post<Product>(`${BASE}/list/`, data),
  update: (id: string, data: Partial<Product>) =>
    api.put<Product>(`${BASE}/list/${id}/`, data),
  patch: (id: string, data: Partial<Product>) =>
    api.patch<Product>(`${BASE}/list/${id}/`, data),
  remove: (id: string) => api.delete<void>(`${BASE}/list/${id}/`),

  // Aliases para compatibilidad previa
  retrieve: (id: string) => api.get<Product>(`${BASE}/list/${id}/`),
  delete: (id: string) => api.delete<void>(`${BASE}/list/${id}/`),
  listProducts: (params?: ProductListParams) =>
    api.get<PaginatedResponse<Product>>(`${BASE}/list/`, cleanParams(params as QueryParams)),
  retrieveProduct: (id: string) => api.get<Product>(`${BASE}/list/${id}/`),
  createProduct: (data: Partial<Product>) => api.post<Product>(`${BASE}/list/`, data),
  updateProduct: (id: string, data: Partial<Product>) =>
    api.put<Product>(`${BASE}/list/${id}/`, data),
  deleteProduct: (id: string) => api.delete<void>(`${BASE}/list/${id}/`),

  // Brands
  listBrands: (params?: PaginationParams) =>
    api.get<PaginatedResponse<Brand>>(`${BASE}/brands/`, cleanParams(params as QueryParams)),
  getBrand: (id: string) => api.get<Brand>(`${BASE}/brands/${id}/`),
  retrieveBrand: (id: string) => api.get<Brand>(`${BASE}/brands/${id}/`),
  createBrand: (data: Partial<Brand>) =>
    api.post<Brand>(`${BASE}/brands/`, data),
  updateBrand: (id: string, data: Partial<Brand>) =>
    api.put<Brand>(`${BASE}/brands/${id}/`, data),
  patchBrand: (id: string, data: Partial<Brand>) =>
    api.patch<Brand>(`${BASE}/brands/${id}/`, data),
  removeBrand: (id: string) => api.delete<void>(`${BASE}/brands/${id}/`),
  deleteBrand: (id: string) => api.delete<void>(`${BASE}/brands/${id}/`),

  // Categories
  listCategories: (params?: PaginationParams) =>
    api.get<PaginatedResponse<Category>>(`${BASE}/categories/`, cleanParams(params as QueryParams)),
  getCategory: (id: string) =>
    api.get<Category>(`${BASE}/categories/${id}/`),
  retrieveCategory: (id: string) =>
    api.get<Category>(`${BASE}/categories/${id}/`),
  createCategory: (data: Partial<Category>) =>
    api.post<Category>(`${BASE}/categories/`, data),
  updateCategory: (id: string, data: Partial<Category>) =>
    api.put<Category>(`${BASE}/categories/${id}/`, data),
  patchCategory: (id: string, data: Partial<Category>) =>
    api.patch<Category>(`${BASE}/categories/${id}/`, data),
  removeCategory: (id: string) =>
    api.delete<void>(`${BASE}/categories/${id}/`),
  deleteCategory: (id: string) =>
    api.delete<void>(`${BASE}/categories/${id}/`),

  // Specs
  listSpecs: (params?: PaginationParams) =>
    api.get<PaginatedResponse<ProductSpec>>(`${BASE}/specs/`, cleanParams(params as QueryParams)),
  getSpec: (id: string) => api.get<ProductSpec>(`${BASE}/specs/${id}/`),
  retrieveSpec: (id: string) => api.get<ProductSpec>(`${BASE}/specs/${id}/`),
  createSpec: (data: Partial<ProductSpec>) =>
    api.post<ProductSpec>(`${BASE}/specs/`, data),
  updateSpec: (id: string, data: Partial<ProductSpec>) =>
    api.put<ProductSpec>(`${BASE}/specs/${id}/`, data),
  patchSpec: (id: string, data: Partial<ProductSpec>) =>
    api.patch<ProductSpec>(`${BASE}/specs/${id}/`, data),
  removeSpec: (id: string) => api.delete<void>(`${BASE}/specs/${id}/`),
  deleteSpec: (id: string) => api.delete<void>(`${BASE}/specs/${id}/`),

  // Bulk upload (multipart)
  bulkUploadProducts: (formData: FormData) =>
    api.post<Record<string, unknown>>(`${BASE}/bulk-upload/`, formData),
};

