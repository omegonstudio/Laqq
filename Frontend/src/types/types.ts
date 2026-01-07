/* eslint-disable @typescript-eslint/no-empty-object-type */
// types/product.types.ts

// ============================================
// TIPOS BASE (lo que viene del backend)
// ============================================

export interface ProductSpec {
  id?: string;
  product?: string; // UUID del producto al que pertenece
  key: string;
  value: string;
  unit?: string;
  display_order?: number;
  is_visible?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFixedSpec {
  id?: string;
  product: string;
  code: string;
  volume?: string | null;
  dimensions?: string | null;
  cap?: string | null;
  outlet?: string | null;
  accuracy?: string | null;
  precision?: string | null;
  additional_specs?: Record<string, unknown> | string | null;
  created_at?: string;
}

export interface RelatedProduct {
  id: string;
  name: string;
  brand?: string | null;
  product_code: string;
  relation_type?: string | null;
}

export interface Attachment {
  id: string;
  file_name: string;
  content_type: string | null;
  size_bytes: number | null;
  data: string | null;
}

// ============================================
// PRODUCT - Respuesta del backend (GET)
// ============================================
export interface Product {
  id: string;
  name: string;
  brand: string; // Nombre para mostrar
  brand_id?: string; // UUID
  category: string; // Nombre para mostrar
  category_id?: string; // UUID
  description: string;
  product_code: string;
  image_attachment: string | null; // UUID del Attachment
  image?: string | null; // Solo para mocks/frontend
  is_active: boolean;
  specs: ProductSpec[]; // Especificaciones dinámicas
  specifications?: ProductSpec[]; // Alias de backend
  fixed_specs?: ProductFixedSpec[]; // Especificaciones fijas opcionales
  related?: RelatedProduct[]; // Alias de productos relacionados
  related_products?: RelatedProduct[]; // Campo original del backend
}

// ============================================
// PRODUCT - Para enviar al backend (POST/PUT/PATCH)
// ============================================
export interface ProductCreateRequest {
  name: string;
  brand_id: string; // UUID
  category_id: string; // UUID
  description?: string;
  product_code?: string;
  image_attachment?: string | null; // UUID del Attachment
  is_active: boolean;
  related_product_ids?: string[]; // Array de UUIDs
  related_product_codes?: string[];
}

export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {
  // Hereda todo de ProductCreateRequest pero hace todos los campos opcionales
}

// ============================================
// PRODUCT - Para el estado local del formulario
// ============================================
export interface ProductFormState {
  id?: string;
  name: string;
  brand: string; // UUID
  category: string; // UUID
  description: string;
  product_code: string;
  image_attachment: File | string | null; // File cuando seleccionas, string (UUID) cuando viene del backend
  is_active: boolean;
  specs: ProductSpec[]; // Objetos completos para editar
  related: RelatedProduct[]; // Objetos completos para mostrar
}

// ============================================
// SPEC - Para enviar al backend
// ============================================
export interface ProductSpecCreateRequest extends ProductSpec {}
export interface ProductSpecUpdateRequest
  extends Partial<ProductSpecCreateRequest> {}
export interface Category {
  id: string;
  name: string;
  parent?: string;
  description: string;
  display_order: number;
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  description?: string;
}

export interface QuoteItem {
  id: string;
  product: string;
  quantity: number;
}

export interface QuoteFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  items: QuoteItem[];
  message: string;
}

export interface TicketFormData {
  name: string;
  email: string;
  product: string;
  description: string;
  file?: File;
}
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
export interface ApiListResponse<T> {
  data: T[];
  meta?: Record<string, unknown>;
}

export interface ApiItemResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}
// types/attachment.types.ts
// types/attachment.types.ts

export interface AttachmentCreateRequest {
  file_name: string;
  content_type?: string | null;
  size_bytes?: number | null;
  data?: string; // Base64 string
  attachable_type?: string | null;
  attachable_id?: string | null;
}

export interface AttachmentResponse {
  id: string;
  file_name: string;
  content_type?: string | null;
  size_bytes?: number | null;
  data?: string | null;
  attachable_type?: string | null;
  attachable_id?: string | null;
  created_at: string;
  created_by?: string | null;
}

export type CategoryUI = {
  id: string;
  name: string;
  description: string;
  href: string;
  subcategories: CategoryUI[];
};
