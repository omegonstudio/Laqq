import { api } from "./client";
import { cleanParams, QueryParams } from "./utils";
import {
  PaginatedResponse,
  Quote,
  QuoteCreatePayload,
  QuoteFormState,
  QuoteItem,
  QuoteItemBulkCreate,
  QuoteItemRender,
  QuoteRender,
  QuoteSendClient,
  QuoteState,
  QuoteType,
  QuoteUpdatePayload,
} from "@/types/api";

const BASE = "/quotes";

export interface QuoteListParams {
  page?: number;
  page_size?: number;
  search?: string;
  state?: string;
  quote_type?: string;
}

export interface QuoteItemListParams {
  page?: number;
  page_size?: number;
  quote?: string;
}

export const quotesApi = {
  // =================== QUOTES ===================
  list: (params?: QuoteListParams) =>
    api.get<PaginatedResponse<QuoteRender>>(
      `${BASE}/list/`,
      cleanParams(params as QueryParams)
    ),

  get: (id: string) => api.get<QuoteRender>(`${BASE}/list/${id}/`),

  create: (payload: QuoteCreatePayload) =>
    api.post<QuoteRender>(`${BASE}/list/`, payload),

  update: (id: string, payload: QuoteUpdatePayload) =>
    api.put<QuoteRender>(`${BASE}/list/${id}/`, payload),

  patch: (id: string, payload: Partial<QuoteUpdatePayload>) =>
    api.patch<QuoteRender>(`${BASE}/list/${id}/`, payload),

  remove: (id: string) => api.delete<void>(`${BASE}/list/${id}/`),

  sendClient: (id: string, payload: QuoteSendClient) =>
    api.post<QuoteRender>(`${BASE}/list/${id}/send-updated/`, payload),
  // Crear cotización desde formulario (incluye contacto + items)
  createFromForm: (payload: QuoteFormState) =>
    api.post<QuoteRender>(`${BASE}/list/from-package/`, payload),

  // =================== ITEMS ===================
  listItems: (params?: QuoteItemListParams) =>
    api.get<PaginatedResponse<QuoteItemRender>>(
      `${BASE}/items/`,
      cleanParams(params as QueryParams)
    ),

  getItem: (id: string) => api.get<QuoteItemRender>(`${BASE}/items/${id}/`),

  createItem: (payload: Omit<QuoteItem, "id">) =>
    api.post<QuoteItemRender>(`${BASE}/items/`, payload),

  updateItem: (id: string, payload: Partial<QuoteItem>) =>
    api.put<QuoteItemRender>(`${BASE}/items/${id}/`, payload),

  patchItem: (id: string, payload: Partial<QuoteItem>) =>
    api.patch<QuoteItemRender>(`${BASE}/items/${id}/`, payload),

  removeItem: (id: string) => api.delete<void>(`${BASE}/items/${id}/`),

  // Crear items en bulk
  createItemsBulk: (payload: QuoteItemBulkCreate[]) =>
    api.post<QuoteItemRender[]>(`${BASE}/items/bulk/`, payload),

  // =================== TYPES ===================
  listTypes: (params?: { search?: string }) =>
    api.get<PaginatedResponse<QuoteType>>(
      `${BASE}/types/`,
      cleanParams(params as QueryParams)
    ),

  getType: (id: string) => api.get<QuoteType>(`${BASE}/types/${id}/`),

  createType: (payload: Omit<QuoteType, "id" | "created_at">) =>
    api.post<QuoteType>(`${BASE}/types/`, payload),

  updateType: (id: string, payload: Partial<QuoteType>) =>
    api.put<QuoteType>(`${BASE}/types/${id}/`, payload),

  patchType: (id: string, payload: Partial<QuoteType>) =>
    api.patch<QuoteType>(`${BASE}/types/${id}/`, payload),

  removeType: (id: string) => api.delete<void>(`${BASE}/types/${id}/`),

  // =================== STATES ===================
  listStates: (params?: { search?: string }) =>
    api.get<PaginatedResponse<QuoteState>>(
      `${BASE}/states/`,
      cleanParams(params as QueryParams)
    ),

  getState: (id: string) => api.get<QuoteState>(`${BASE}/states/${id}/`),

  createState: (payload: Omit<QuoteState, "id" | "created_at">) =>
    api.post<QuoteState>(`${BASE}/states/`, payload),

  updateState: (id: string, payload: Partial<QuoteState>) =>
    api.put<QuoteState>(`${BASE}/states/${id}/`, payload),

  patchState: (id: string, payload: Partial<QuoteState>) =>
    api.patch<QuoteState>(`${BASE}/states/${id}/`, payload),

  removeState: (id: string) => api.delete<void>(`${BASE}/states/${id}/`),
};
