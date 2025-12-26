import {
  Brand,
  Category,
  PaginatedResponse,
  Product,
  ProductCreateRequest,
  ProductSpec,
  ProductUpdateRequest,
} from "@/types/types";
import { api } from "./client";

const BASE = "/products";

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export const productsApi = {
  // Products
  list: (params?: PaginationParams) =>
    api.get<PaginatedResponse<Product>>(`${BASE}/list/`, params),
  retrieve: (id: string) => api.get<Product>(`${BASE}/list/${id}/`),
  create: (data: ProductCreateRequest) =>
    api.post<Product>(`${BASE}/list/`, data),
  update: (id: string, data: ProductUpdateRequest) =>
    api.patch<Product>(`${BASE}/list/${id}/`, data),
  delete: (id: string) => api.delete<void>(`${BASE}/list/${id}/`),

  // Brands
  listBrands: (params?: PaginationParams) =>
    api.get<PaginatedResponse<Brand>>(`${BASE}/brands/`, params),
  retrieveBrand: (id: string) => api.get<Brand>(`${BASE}/brands/${id}/`),
  createBrand: (data: Partial<Brand>) =>
    api.post<Brand>(`${BASE}/brands/`, data),
  updateBrand: (id: string, data: Partial<Brand>) =>
    api.patch<Brand>(`${BASE}/brands/${id}/`, data),
  deleteBrand: (id: string) => api.delete<void>(`${BASE}/brands/${id}/`),

  // Categories
  listCategories: (params?: PaginationParams) =>
    api.get<PaginatedResponse<Category>>(`${BASE}/categories/`, params),
  retrieveCategory: (id: string) =>
    api.get<Category>(`${BASE}/categories/${id}/`),
  createCategory: (data: Partial<Category>) =>
    api.post<Category>(`${BASE}/categories/`, data),
  updateCategory: (id: string, data: Partial<Category>) =>
    api.patch<Category>(`${BASE}/categories/${id}/`, data),
  deleteCategory: (id: string) =>
    api.delete<void>(`${BASE}/categories/${id}/`),

  // Specs
  listSpecs: (params?: PaginationParams) =>
    api.get<PaginatedResponse<ProductSpec>>(`${BASE}/specs/`, params),
  retrieveSpec: (id: string) => api.get<ProductSpec>(`${BASE}/specs/${id}/`),
  createSpec: (data: Partial<ProductSpec>) =>
    api.post<ProductSpec>(`${BASE}/specs/`, data),
  updateSpec: (id: string, data: Partial<ProductSpec>) =>
    api.put<ProductSpec>(`${BASE}/specs/${id}/`, data),
  deleteSpec: (id: string) => api.delete<void>(`${BASE}/specs/${id}/`),
};

