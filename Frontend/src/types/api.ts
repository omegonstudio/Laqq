import { PaginatedResponse as BasePaginatedResponse } from "./types";

export type PaginatedResponse<T> = BasePaginatedResponse<T>;

export interface Accessory {
  id: string;
  code: string;
  brand: string | null;
  model: string | null;
  description: string | null;
  category: string | null;
  price: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductAccessory {
  id: number;
  product: string;
  accessory: string;
}

export interface ContactState {
  id: string;
  name: "CLOSED" | "IN_PROGRESS" | "NEW" | "RESPONDED";
  color: string | null;
  description: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  message: string | null;
  state: string;
  assigned_user: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  message: string;
  state: string;
  assigned_user: string | null;
  created_at: string;
  updated_at: string;
}
export interface MessageCreate {
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  message: string;
  state: string;
  email: string;
}

export interface NoteType {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface NoteState {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  note_type: string;
  state: string;
  author: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string | null;
  logo_attachment: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  parent: string | null;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductSpec {
  id?: string;
  product?: string;
  key: string;
  value: string;
  unit?: string | null;
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
  product_code: string;
  name: string;
  relation_type: string | null;
  brand?: string | null;
}

export interface Product {
  id: string;
  product_code: string;
  name: string;
  brand: string | null;
  brand_id?: string;
  category: string | null;
  category_id?: string;
  description: string | null;
  image_attachment: string | null;
  image?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  specs: ProductSpec[];
  specifications?: ProductSpec[]; // alias de backend
  fixed_specs: ProductFixedSpec[];
  related_product_ids?: string[];
  related_product_codes?: string[];
  related_products: RelatedProduct[];
  related?: RelatedProduct[];
}

// =================== QUOTE ENUMS ===================

export type QuoteStateType =
  | "CONFIRMED"
  | "EXPIRED"
  | "PENDING"
  | "REJECTED"
  | "SENT";
export type QuoteTypeEnum =
  | "EQUIPMENT"
  | "FURNITURE"
  | "PROCESSED"
  | "SUPPLIES";

// =================== QUOTE TYPES ===================

// Para ESCRIBIR (POST/PUT) - Lo que envías a la API
export interface Quote {
  id?: string;
  quote_number?: string;
  contact: string; // UUID del contacto
  user: string | null;
  quote_type: QuoteTypeEnum;
  state: QuoteStateType;
  message: string | null;
  total_amount: string | null;
  created_at?: string;
  updated_at?: string;
}

// Para LEER (GET) - Lo que recibes de la API
export interface QuoteRender {
  id: string;
  quote_number: string;
  contact: ContactInfo; // Objeto completo
  contact_id: string;
  user: string | null;
  quote_type: QuoteTypeEnum;
  state: QuoteStateType;
  message: string | null;
  total_amount: string | null;
  created_at: string;
  updated_at: string;
  items: QuoteItemRender[]; // Items con productos completos
}

// =================== CONTACT TYPES ===================

export interface ContactInfo {
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
  country: string;
  phone: string;
  message: string;
  state: string;
  assigned_user: string | null;
  id: string;
}

// =================== QUOTE ITEM TYPES ===================

// Para ESCRIBIR (POST/PUT)
export interface QuoteItem {
  id?: string;
  quote: string; // UUID
  product: string; // UUID
  quantity: number;
  unit_price: string; // Decimal como string
  subtotal: string; // Decimal como string
}

// Para LEER (GET)
export interface QuoteItemRender {
  id: string;
  quote: string;
  product: Product; // Objeto completo
  quantity: number;
  unit_price: string;
  subtotal: string;
}

// =================== PAYLOAD TYPES ===================

// Para crear una cotización completa con contacto
export interface QuoteCreatePayload {
  contact: ContactInfo;
  contact_id?: string;
  message?: string | null;
  total_amount?: string | null;
  user?: string | null;
  quote_type: QuoteTypeEnum;
  state: QuoteStateType;
}

// Para actualizar una cotización
export interface QuoteUpdatePayload {
  contact?: ContactInfo;
  contact_id?: string;
  message?: string | null;
  total_amount?: string | null;
  user?: string | null;
  quote_type?: QuoteTypeEnum;
  state?: QuoteStateType;
}

// Para crear items en bulk
export interface QuoteItemBulkCreate {
  quote: string; // UUID
  product: string; // UUID
  quantity: number;
}

// Para el formulario completo (desde UI)
export interface QuoteFormState {
  contact: ContactInfo;
  quote: {
    quote_type: QuoteTypeEnum;
    message: string;
    state: QuoteStateType;
    user?: string | null;
  };
  items: Array<{
    product: string; // UUID
    quantity: number;
    unit_price?: string;
  }>;
}

// =================== METADATA TYPES ===================

export interface QuoteState {
  id: string;
  name: QuoteStateType;
  color: string | null;
  description: string | null;
  created_at: string;
}

export interface QuoteType {
  id: string;
  name: QuoteTypeEnum;
  description: string | null;
  created_at: string;
}

// =================== TICKET PAYLOAD TYPES ===================

export interface TicketContactPayload {
  email: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  phone?: string;
  country?: string;
}

export interface CreateTicketPayload {
  contact: TicketContactPayload;
  ticket: {
    description: string;
    product?: string | null;
    product_name?: string;
    priority?: string;
  };
}

export interface CreateTicketResponse {
  contact: Contact;
  ticket: ServiceTicket;
}

export interface ServiceTicket {
  id: string;
  ticket_number: string;
  contact: Contact;
  product: string | null;
  product_name: string;
  description: string;
  attachment: string | null;
  state: string;
  priority: string;
  assigned_user: string | null;
  created_at: string;
  assigned_at: string | null;
  started_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  updated_at: string;
  resolution_notes: string | null;
}

export interface TicketPriority {
  id: string;
  name: string;
  level: number;
  color: string | null;
  description: string | null;
  created_at: string;
}

export interface TicketState {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  is_final: boolean;
  created_at: string;
}

export interface UserType {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, unknown> | null;
  created_at: string;
}

export interface UserState {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface UserData {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: UserType | null;
  user_type_id?: string | null;
  state: UserState | null;
  state_id?: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCreate
  extends Omit<
    UserData,
    | "id"
    | "user_type"
    | "state"
    | "created_at"
    | "updated_at"
    | "last_login"
    | "is_active"
    | "is_staff"
    | "is_superuser"
  > {
  password: string;
  user_type_id?: string | null;
  state_id?: string | null;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export interface TokenObtainPair {
  access: string;
  refresh: string;
}

export interface TokenRefresh {
  access: string;
  refresh?: string;
}

export interface DashboardStats {
  active_users: number;
  products: number;
  quotes: number;
  new_messages: number;
}

export interface DashboardActivityItem {
  type: "quote" | "message" | "product" | string;
  title: string;
  time_ago: string;
  quote_number?: string;
  contact?: string;
  state?: string;
  company?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  product_name?: string;
  brand?: string | null;
  category?: string | null;
}

export interface DashboardSummary {
  stats: DashboardStats;
  recent_activity: DashboardActivityItem[];
}
