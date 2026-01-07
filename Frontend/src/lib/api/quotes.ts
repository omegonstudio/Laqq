import { api } from "./client";
import { cleanParams, QueryParams } from "./utils";
import {
  PaginatedResponse,
  Quote,
  QuoteItem,
  QuoteState,
  QuoteType,
} from "@/types/api";

const BASE = "/quotes";

export interface QuoteListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  quote_type?: string;
  state?: string;
  contact?: string;
  user?: string;
}

export interface QuoteItemListParams {
  page?: number;
  page_size?: number;
  quote?: string;
  product?: string;
}

export const quotesApi = {
  list: (params?: QuoteListParams) =>
    api.get<PaginatedResponse<Quote>>(
      `${BASE}/list/`,
      cleanParams(params as QueryParams)
    ),
  get: (id: string) => api.get<Quote>(`${BASE}/list/${id}/`),
  create: (payload: Partial<Quote>) => api.post<Quote>(`${BASE}/list/`, payload),
  update: (id: string, payload: Partial<Quote>) =>
    api.put<Quote>(`${BASE}/list/${id}/`, payload),
  patch: (id: string, payload: Partial<Quote>) =>
    api.patch<Quote>(`${BASE}/list/${id}/`, payload),
  remove: (id: string) => api.delete<void>(`${BASE}/list/${id}/`),

  listTypes: (params?: { search?: string }) =>
    api.get<PaginatedResponse<QuoteType>>(
      `${BASE}/types/`,
      cleanParams(params as QueryParams)
    ),
  getType: (id: string) => api.get<QuoteType>(`${BASE}/types/${id}/`),
  createType: (payload: Partial<QuoteType>) =>
    api.post<QuoteType>(`${BASE}/types/`, payload),
  updateType: (id: string, payload: Partial<QuoteType>) =>
    api.put<QuoteType>(`${BASE}/types/${id}/`, payload),
  patchType: (id: string, payload: Partial<QuoteType>) =>
    api.patch<QuoteType>(`${BASE}/types/${id}/`, payload),
  removeType: (id: string) => api.delete<void>(`${BASE}/types/${id}/`),

  listStates: (params?: { search?: string }) =>
    api.get<PaginatedResponse<QuoteState>>(
      `${BASE}/states/`,
      cleanParams(params as QueryParams)
    ),
  getState: (id: string) => api.get<QuoteState>(`${BASE}/states/${id}/`),
  createState: (payload: Partial<QuoteState>) =>
    api.post<QuoteState>(`${BASE}/states/`, payload),
  updateState: (id: string, payload: Partial<QuoteState>) =>
    api.put<QuoteState>(`${BASE}/states/${id}/`, payload),
  patchState: (id: string, payload: Partial<QuoteState>) =>
    api.patch<QuoteState>(`${BASE}/states/${id}/`, payload),
  removeState: (id: string) => api.delete<void>(`${BASE}/states/${id}/`),

  listItems: (params?: QuoteItemListParams) =>
    api.get<PaginatedResponse<QuoteItem>>(
      `${BASE}/items/`,
      cleanParams(params as QueryParams)
    ),
  getItem: (id: string) => api.get<QuoteItem>(`${BASE}/items/${id}/`),
  createItem: (payload: Partial<QuoteItem>) =>
    api.post<QuoteItem>(`${BASE}/items/`, payload),
  updateItem: (id: string, payload: Partial<QuoteItem>) =>
    api.put<QuoteItem>(`${BASE}/items/${id}/`, payload),
  patchItem: (id: string, payload: Partial<QuoteItem>) =>
    api.patch<QuoteItem>(`${BASE}/items/${id}/`, payload),
  removeItem: (id: string) => api.delete<void>(`${BASE}/items/${id}/`),
};

