import {
  Attachment,
  PaginatedResponse as BasePaginatedResponse,
  Product,
  Variants,
} from "./types";

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
  id?: string;
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  message: string | null;
  state: string;
  assigned_user: string | null;
}

export interface Message {
  id: string;
  company_name: string | null;
  first_name: string;
  last_name: string;
  country: string | null;
  message: string;
  state: string;
  assigned_user: string | null;
  created_at: string;
  updated_at: string;
  email: string;
  phone: string;
}
export interface MessageCreate {
  company_name: string | null;
  first_name: string;
  last_name: string;
  country: string | null;
  message: string;
  state: string;
  email: string;
  phone: string;
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

// =================== QUOTE ENUMS ===================

export type QuoteStateType =
  | "confirmed"
  | "expired"
  | "pending"
  | "rejected"
  | "sent";
export type QuoteTypeEnum =
  | "equipment"
  | "furniture"
  | "processed"
  | "supplies"
  | "standard"
  | "express";

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
export interface SpecificationsForm {
  precios: string;
  forma_pago: string;
  clausula_pago: string;
  validez_oferta: string;
  garantia: string;
  orden_compra: string;
  observaciones: string;
}
// Para LEER (GET) - Lo que recibes de la API
export interface QuoteRender {
  id: string;
  quote_number: string;
  contact: Contact; // Objeto completo
  contact_id: string;
  user: string | null;
  quote_type: QuoteTypeEnum;
  state: QuoteStateType;
  message: string | null;
  total_amount: string | null;
  created_at: string;
  updated_at: string;
  items: QuoteItemRender[]; // Items con productos completos
  observaciones: string;
  specs: SpecificationsForm;
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
  state?: string;
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
  variant?: string;
}

// Para LEER (GET)
export interface QuoteItemRender {
  id: string;
  quote: string;
  product: Product; // Objeto completo
  quantity: number;
  unit_price: string;
  subtotal: string;
  variant: Variants;
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
  contact?: Contact;
  contact_id?: string;
  message?: string | null;
  total_amount?: string | null;
  user?: string | null;
  quote_type?: QuoteTypeEnum;
  state?: QuoteStateType;
  observaciones: string;
  specs: SpecificationsForm;
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
    variant?: string;
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
  state: "open" | "closed" | "in_progress" | "resolved";
  priority: "urgent" | "high" | "medium" | "low";
  assigned_user: {
    id: string;
    userName: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at: string | null;
  assigned_at: string | null;
  started_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  updated_at: string;
  resolution_notes: string | null;
  attachments: Attachment[] | null;
  marca: string | null;
  modelo: string | null;
  numero_de_serie: string | null;
  producto_laqq: boolean;
}

export interface CreateTicketPayload {
  contact: {
    email: string;
    first_name: string;
    last_name: string;
    company_name?: string;
    phone?: string;
    country?: string;
    state: string;
  };
  ticket: {
    state: string;
    product?: string;
    product_name: string;
    description?: string;
    resolution_notes?: string | null;
    attachment?: string | null;
    priority: string | null;
    attachments?: string[] | null;
    producto_laqq: boolean;
    marca?: string | null;
    modelo?: string | null;
    numero_de_serie?: string | null;
  };
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
  id: string;
  contact_id: string;
  product_name: string;
  product?: string;
  description?: string;
  attachment?: string | null;
  assigned_at: string | null;
  started_at: string | null;
  resolved_at: string | null;
  created_at: string | null;
  closed_at: string | null;
  state?: string;
  priority?: string;
  assigned_user?: string | null;
  resolution_notes?: string | null;
  marca?: string;
  modelo?: string;
  numero_de_serie?: string;
  producto_laqq: boolean;
}
export interface TicketFormDataUpdate {
  product: string;
  description: string;
  file?: File;
  attachment: string | null;
  assigned_at: string | null;
  started_at: string | null;
  resolved_at: string | null;
  created_at: string | null;
  closed_at: string | null;
  state: string;
  priority: string;
  assigned_user: string | null;
  resolution_notes: string | null;

  contact_id: string;
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
  name:
    | "open"
    | "closed"
    | "in_progress"
    | "resolved"
    | "waiting_parts"
    | "new";
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
  username?: string;
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
