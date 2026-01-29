import { api } from "./client";
import { cleanParams, QueryParams } from "./utils";
import {
  Contact,
  ContactState,
  Message,
  MessageCreate,
  PaginatedResponse,
} from "@/types/api";

const BASE = "/contacts";

export interface ContactListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  state?: string;
  assigned_user?: string;
}

export interface MessageListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  state?: string;
  assigned_user?: string;
}

export const contactsApi = {
  list: (params?: ContactListParams) =>
    api.get<PaginatedResponse<Contact>>(
      `${BASE}/list/`,
      cleanParams(params as QueryParams)
    ),
  get: (id: string) => api.get<Contact>(`${BASE}/list/${id}/`),
  create: (payload: Partial<Contact>) =>
    api.post<Contact>(`${BASE}/list/`, payload),
  update: (id: string, payload: Partial<Contact>) =>
    api.put<Contact>(`${BASE}/list/${id}/`, payload),
  patch: (id: string, payload: Partial<Contact>) =>
    api.patch<Contact>(`${BASE}/list/${id}/`, payload),
  remove: (id: string) => api.delete<void>(`${BASE}/list/${id}/`),

  listStates: (params?: { search?: string }) =>
    api.get<PaginatedResponse<ContactState>>(
      `${BASE}/states/`,
      cleanParams(params as QueryParams)
    ),
  getState: (id: string) => api.get<ContactState>(`${BASE}/states/${id}/`),
  createState: (payload: Partial<ContactState>) =>
    api.post<ContactState>(`${BASE}/states/`, payload),
  updateState: (id: string, payload: Partial<ContactState>) =>
    api.put<ContactState>(`${BASE}/states/${id}/`, payload),
  patchState: (id: string, payload: Partial<ContactState>) =>
    api.patch<ContactState>(`${BASE}/states/${id}/`, payload),
  removeState: (id: string) => api.delete<void>(`${BASE}/states/${id}/`),

  listMessages: (params?: MessageListParams) =>
    api.get<PaginatedResponse<Message>>(
      `${BASE}/messages/`,
      cleanParams(params as QueryParams)
    ),
  getMessage: (id: string) => api.get<Message>(`${BASE}/messages/${id}/`),
  createMessage: (payload: MessageCreate) =>
    api.post<Message>(`${BASE}/messages/`, payload),

  updateMessage: (id: string, payload: Partial<Message>) =>
    api.put<Message>(`${BASE}/messages/${id}/`, payload),
  patchMessage: (id: string, payload: Partial<Message>) =>
    api.patch<Message>(`${BASE}/messages/${id}/`, payload),
  removeMessage: (id: string) => api.delete<void>(`${BASE}/messages/${id}/`),
};
