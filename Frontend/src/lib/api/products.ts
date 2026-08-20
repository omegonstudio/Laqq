import {
  Brand,
  BrandFormState,
  BulkUploadResponse,
  Category,
  PaginatedResponse,
  Product,
  ProductCreateRequest,
  ProductUpdateRequest,
  Variants,
} from "@/types/types";
import { api } from "./client";
import { cleanParams, QueryParams } from "./utils";

const BASE = "/products";

export interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  name?: string; // 👈 agregar esto
}

export interface ProductListParams extends PaginationParams {
  brand?: string;
  category?: string; // Filtrado exacto (solo productos de esta categoría)
  category_recursive?: string; // Filtrado recursivo (incluye subcategorías)
  is_active?: boolean;
}

export const productsApi = {
  list: (params?: ProductListParams) =>
    api.get<PaginatedResponse<Product>>(
      `${BASE}/list/`,
      cleanParams(params as QueryParams)
    ),
  get: (id: string) => api.get<Product>(`${BASE}/list/${id}/`),
  create: (data: Partial<ProductCreateRequest>) =>
    api.post<Product>(`${BASE}/list/`, data),
  update: (id: string, data: Partial<ProductUpdateRequest>) =>
    api.put<Product>(`${BASE}/list/${id}/`, data),
  patch: (id: string, data: Partial<Product>) =>
    api.patch<Product>(`${BASE}/list/${id}/`, data),
  remove: (id: string) => api.delete<void>(`${BASE}/list/${id}/`),

  // Aliases para compatibilidad previa
  retrieve: (id: string) => api.get<Product>(`${BASE}/list/${id}/`),
  delete: (id: string) => api.delete<void>(`${BASE}/list/${id}/`),
  listProducts: (params?: ProductListParams) =>
    api.get<PaginatedResponse<Product>>(
      `${BASE}/list/`,
      cleanParams(params as QueryParams)
    ),
  retrieveProduct: (id: string) => api.get<Product>(`${BASE}/list/${id}/`),
  createProduct: (data: Partial<Product>) =>
    api.post<Product>(`${BASE}/list/`, data),
  updateProduct: (id: string, data: Partial<Product>) =>
    api.put<Product>(`${BASE}/list/${id}/`, data),
  deleteProduct: (id: string) => api.delete<void>(`${BASE}/list/${id}/`),

  buildProductUploadFormData: (data: ProductUpdateRequest): FormData => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value == null) return;

      if (key === "files" && Array.isArray(value)) {
        value.forEach((file) => {
          formData.append("files", file);
        });
      } else if (key === "spec_table" && typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else if (Array.isArray(value)) {
        value.forEach((v) => formData.append(key, String(v)));
      } else {
        formData.append(key, String(value));
      }
    });

    return formData;
  },
  uploadAttachments: (id: string, formData: FormData) =>
    api.post<Product>(`${BASE}/list/${id}/upload_attachments/`, formData),
  // Brands
  listBrands: (params?: PaginationParams) =>
    api.get<PaginatedResponse<Brand>>(
      `${BASE}/brands/`,
      cleanParams(params as QueryParams)
    ),
  getBrand: (id: string) => api.get<Brand>(`${BASE}/brands/${id}/`),
  retrieveBrand: (id: string) => api.get<Brand>(`${BASE}/brands/${id}/`),
  createBrand: (data: Partial<BrandFormState>) =>
    api.post<Brand>(`${BASE}/brands/`, data),
  updateBrand: (id: string, data: Partial<BrandFormState>) =>
    api.put<Brand>(`${BASE}/brands/${id}/`, data),
  patchBrand: (id: string, data: Partial<Brand>) =>
    api.patch<Brand>(`${BASE}/brands/${id}/`, data),
  removeBrand: (id: string) => api.delete<void>(`${BASE}/brands/${id}/`),
  deleteBrand: (id: string) => api.delete<void>(`${BASE}/brands/${id}/`),

  // Categories
  listCategories: (params?: PaginationParams) =>
    api.get<PaginatedResponse<Category>>(
      `${BASE}/categories/`,
      cleanParams(params as QueryParams)
    ),
  getCategory: (id: string) => api.get<Category>(`${BASE}/categories/${id}/`),
  retrieveCategory: (id: string) =>
    api.get<Category>(`${BASE}/categories/${id}/`),
  createCategory: (data: Partial<Category>) =>
    api.post<Category>(`${BASE}/categories/`, data),
  updateCategory: (id: string, data: Partial<Category>) =>
    api.put<Category>(`${BASE}/categories/${id}/`, data),
  patchCategory: (id: string, data: Partial<Category>) =>
    api.patch<Category>(`${BASE}/categories/${id}/`, data),
  removeCategory: (id: string) => api.delete<void>(`${BASE}/categories/${id}/`),
  deleteCategory: (id: string) => api.delete<void>(`${BASE}/categories/${id}/`),
  //VARIANTES

  // Specs
  listVariants: (params?: PaginationParams) =>
    api.get<PaginatedResponse<Variants>>(
      `${BASE}/variants/`,
      cleanParams(params as QueryParams)
    ),
  getVariants: (id: string) => api.get<Variants>(`${BASE}/variants/${id}/`),
  retrieveVariants: (id: string) =>
    api.get<Variants>(`${BASE}/variants/${id}/`),
  createVariants: (data: Partial<Variants>) =>
    api.post<Variants>(`${BASE}/variants/`, data),
  updateVariants: (id: string, data: Partial<Variants>) =>
    api.put<Variants>(`${BASE}/variants/${id}/`, data),
  patchVariants: (id: string, data: Partial<Variants>) =>
    api.patch<Variants>(`${BASE}/variants/${id}/`, data),
  removeVariants: (id: string) => api.delete<void>(`${BASE}/variants/${id}/`),
  deleteVariants: (id: string) => api.delete<void>(`${BASE}/variants/${id}/`),

  // Bulk upload (multipart)
  bulkUploadProducts: (formData: FormData) =>
    api.post<BulkUploadResponse>(`${BASE}/bulk-upload/`, formData),
  exportExcel: (params?: ProductListParams) =>
    api.getBlob(`${BASE}/list/export/`, cleanParams(params as QueryParams)),
};
