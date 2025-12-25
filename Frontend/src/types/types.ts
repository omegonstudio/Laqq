/* eslint-disable @typescript-eslint/no-empty-object-type */
// types/product.types.ts

// ============================================
// TIPOS BASE (lo que viene del backend)
// ============================================

export interface ProductSpec {
  id: string;
  volume: string;
  code: string;
  dimensions: string;
  cap: string;
  outlet: string;
  accuracy: string;
  precision: string;
  additional_specs: string;
  product: string; // UUID del producto al que pertenece
}

export interface RelatedProduct {
  id: string;
  name: string;
  brand: string;
  product_code: string;
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
  brand: string; // UUID
  category: string; // UUID
  description: string;
  product_code: string;
  image_attachment: string | null; // UUID del Attachment
  is_active: boolean;
  specs: ProductSpec[]; // Array de objetos completos
  related: RelatedProduct[]; // Array de objetos completos
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
  specs?: string[]; // Array de UUIDs (si ya existen)
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
  brand: string;
  category: string;
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
export interface ProductSpecCreateRequest {
  volume: string;
  code: string;
  dimensions: string;
  cap: string;
  outlet: string;
  accuracy: string;
  additional_specs?: string;
  product: string; // UUID del producto
}

export interface ProductSpecUpdateRequest
  extends Partial<ProductSpecCreateRequest> {}
export interface Category {
  id: string;
  name: string;
  parent?: string;
  subcategories?: Category[];
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  description?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  href?: string;
  subcategories?: Category[];
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
