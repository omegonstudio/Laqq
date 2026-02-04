import { api } from "./client";
import { cleanParams, QueryParams } from "./utils";
import {
  PaginatedResponse,
  ServiceTicket,
  TicketPriority,
  TicketState,
} from "@/types/api";

const BASE = "/tickets";

export interface TicketListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  contact?: string;
  product?: string;
  state?: string;
  priority?: string;
  assigned_user?: string;
  email?: string; // Agregar este campo
}

export interface TicketStatistics {
  total: number;
  by_state: Record<string, number>;
  by_priority: Record<string, number>;
  unassigned: number;
  created_last_7_days: number;
}

export interface AssignTicketPayload {
  assigned_user: string;
}

export interface ResolveTicketPayload {
  resolution_notes?: string;
}

export interface AttachTicketFilePayload {
  file_name: string;
  content_type?: string | null;
  data: string | ArrayBuffer;
}

export const ticketsApi = {
  list: (params?: TicketListParams) =>
    api.get<PaginatedResponse<ServiceTicket>>(
      `${BASE}/`,
      cleanParams(params as QueryParams)
    ),
  get: (id: string) => api.get<ServiceTicket>(`${BASE}/${id}/`),
  create: (payload: Partial<ServiceTicket>) =>
    api.post<ServiceTicket>(`${BASE}/`, payload),
  update: (id: string, payload: Partial<ServiceTicket>) =>
    api.put<ServiceTicket>(`${BASE}/${id}/`, payload),
  patch: (id: string, payload: Partial<ServiceTicket>) =>
    api.patch<ServiceTicket>(`${BASE}/${id}/`, payload),
  remove: (id: string) => api.delete<void>(`${BASE}/${id}/`),

  listStates: (params?: { search?: string }) =>
    api.get<PaginatedResponse<TicketState>>(
      `${BASE}/states/`,
      cleanParams(params as QueryParams)
    ),
  getState: (id: string) => api.get<TicketState>(`${BASE}/states/${id}/`),
  createState: (payload: Partial<TicketState>) =>
    api.post<TicketState>(`${BASE}/states/`, payload),
  updateState: (id: string, payload: Partial<TicketState>) =>
    api.put<TicketState>(`${BASE}/states/${id}/`, payload),
  patchState: (id: string, payload: Partial<TicketState>) =>
    api.patch<TicketState>(`${BASE}/states/${id}/`, payload),
  removeState: (id: string) => api.delete<void>(`${BASE}/states/${id}/`),

  listPriorities: (params?: { search?: string }) =>
    api.get<PaginatedResponse<TicketPriority>>(
      `${BASE}/priorities/`,
      cleanParams(params as QueryParams)
    ),
  getPriority: (id: string) =>
    api.get<TicketPriority>(`${BASE}/priorities/${id}/`),
  createPriority: (payload: Partial<TicketPriority>) =>
    api.post<TicketPriority>(`${BASE}/priorities/`, payload),
  updatePriority: (id: string, payload: Partial<TicketPriority>) =>
    api.put<TicketPriority>(`${BASE}/priorities/${id}/`, payload),
  patchPriority: (id: string, payload: Partial<TicketPriority>) =>
    api.patch<TicketPriority>(`${BASE}/priorities/${id}/`, payload),
  removePriority: (id: string) => api.delete<void>(`${BASE}/priorities/${id}/`),

  // Acciones
  attachFile: (id: string, payload: AttachTicketFilePayload) =>
    api.post<ServiceTicket>(`${BASE}/${id}/attach_file/`, payload),
  assign: (id: string, payload: AssignTicketPayload) =>
    api.post<ServiceTicket>(`${BASE}/${id}/assign/`, payload),
  start: (id: string) => api.post<ServiceTicket>(`${BASE}/${id}/start/`),
  resolve: (id: string, payload?: ResolveTicketPayload) =>
    api.post<ServiceTicket>(`${BASE}/${id}/resolve/`, payload || {}),
  close: (id: string) => api.post<ServiceTicket>(`${BASE}/${id}/close/`),

  statistics: () => api.get<TicketStatistics>(`${BASE}/statistics/`),
};
