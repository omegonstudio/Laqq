/* eslint-disable @typescript-eslint/no-empty-object-type */
// types/product.types.ts

import { Contact } from "./api";

// ============================================
// TIPOS BASE (lo que viene del backend)
// ============================================

export interface PaginationInfo {
  count: number;
  next: string | null;
  previous: string | null;
  page_size: number;
  current_page: number;
  total_pages: number;
}
export interface ProductSpec {
  id?: string;
  product: string; // UUID del producto al que pertenece
  key: string;
  value: string;
  unit?: string;
  display_order?: number;
  is_visible?: boolean;
}
export interface BulkUploadResponse {
  created_brands: number;
  created_categories: number;
  created_attachments: number;
  created_products: number;
  updated_products: number;
  created_specs: number;
  updated_specs: number;
  created_relations: number;
  errors: {
    image_url: string;
    error: string;
  }[];
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

// ============================================
// PRODUCT - Respuesta del backend (GET)
// ============================================
export interface Product {
  id: string;
  is_featured: boolean;
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
  fixed_specs: ProductFixedSpec[]; // Especificaciones fijas opcionales
  related?: RelatedProduct[]; // Alias de productos relacionados
  image_url: string | null; // URL de la imagen
  related_products?: RelatedProduct[]; // Campo original del backend
  attachments: Attachment[];
}

// ============================================
// PRODUCT - Para enviar al backend (POST/PUT/PATCH)
// ============================================
export interface ProductCreateRequest {
  attachments?: string[];
  name: string;
  brand_id: string; // UUID
  category_id: string; // UUID
  description?: string;
  product_code?: string;
  image_attachment?: string | null; // UUID del Attachment
  is_active: boolean;
  related_product_ids?: string[]; // Array de UUIDs
  related_product_codes?: string[];
  is_featured?: boolean;
}

export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {
  files?: File[];
  attachments?: string[]; // ← IDs que permanecen
}

// ============================================
// PRODUCT - Para el estado local del formulario
// ============================================
export interface ProductFormState {
  id?: string;
  is_featured: boolean;
  attachments: string[]; // IDs de attachments que permanecen
  name: string;
  brand: string; // UUID
  category: string; // UUID
  description: string;
  product_code: string;
  attachments_existing: Attachment[]; // lo que vino del backend
  attachments_files: File[];
  image_file: File | null;
  /** Attachment actual asociado (UUID) */
  image_attachment_id: string | null;
  is_active: boolean;
  specs: ProductSpec[]; // Objetos completos para editar
  related: RelatedProduct[]; // Objetos completos para mostrar
  fixed_specs: ProductFixedSpec[]; // Especificaciones fijas opcionales
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
  level: number;
}

export interface CategoryUI {
  id: string;
  name: string;
  description: string;
  href: string;
  subcategories: CategoryUI[];
}
export interface Brand {
  id: string;
  name: string;
  logo_attachment?: string;
  description?: string;
  logo_url: string;
}

export interface BrandFormState {
  id: string;
  name: string;
  logo_attachment?: string;
  description?: string;
}

export interface QuoteItem {
  id: string;
  quote: string;
  product: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}
export interface ServiceTicket {
  id: string;
  contact: Contact;
  product: string;
  product_name: string;
  description: string;
  attachment: string | null;

  state: string;
  priority: string;
  assigned_user: string | null;
  resolution_notes: string | null;

  created_at: string;
  updated_at: string;
}

export interface TicketFormData {
  email: string;
  product?: string;
  product_name?: string;
  description?: string;
  file?: File;
  attachment?: string | null;
}
export interface UpdateTicketPayload {
  contact_id: string;

  product?: string;
  description?: string;
  attachment?: string | null;

  state?: string;
  priority?: string;
  assigned_user?: string | null;
  resolution_notes?: string | null;
}
export interface TicketFormDataUpdate {
  product: string;
  description: string;
  file?: File;
  attachment: string | null;

  state: string;
  priority: string;
  assigned_user: string | null;
  resolution_notes: string | null;

  contact_id: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  page_size: number;
  total_pages: number;
  current_page: number;
}
export interface ApiListResponse<T> {
  data: T[];
  meta?: Record<string, unknown>;
}

export interface ApiItemResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface Attachment {
  id: string;
  file_name: string;
  content_type_str: string | null;
  size_bytes: number | null;
  file: string; // URL
  url: string;
  role: "image" | "manual" | "datasheet" | "other" | null;
  attachable_type: string | null;
  attachable_id: string | null;
  created_at: string;
}
export interface AttachmentCreatePayload {
  file: File;
  role?: Attachment["role"];
  attachable_type?: string;
  attachable_id?: string;
}

export interface AttachmentUpdatePayload {
  file?: File; // opcional en update
  role?: Attachment["role"];
  attachable_type?: string;
  attachable_id?: string;
}
