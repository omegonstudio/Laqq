import { api } from "./client";
import { cleanParams, QueryParams } from "./utils";
import { Note, NoteState, NoteType, PaginatedResponse } from "@/types/api";

const BASE = "/notes";

export interface NoteListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  note_type?: string;
  state?: string;
  author?: string;
}

export const notesApi = {
  list: (params?: NoteListParams) =>
    api.get<PaginatedResponse<Note>>(
      `${BASE}/list/`,
      cleanParams(params as QueryParams)
    ),
  get: (id: string) => api.get<Note>(`${BASE}/list/${id}/`),
  create: (payload: Partial<Note>) => api.post<Note>(`${BASE}/list/`, payload),
  update: (id: string, payload: Partial<Note>) =>
    api.put<Note>(`${BASE}/list/${id}/`, payload),
  patch: (id: string, payload: Partial<Note>) =>
    api.patch<Note>(`${BASE}/list/${id}/`, payload),
  remove: (id: string) => api.delete<void>(`${BASE}/list/${id}/`),

  listStates: (params?: { search?: string }) =>
    api.get<PaginatedResponse<NoteState>>(
      `${BASE}/states/`,
      cleanParams(params as QueryParams)
    ),
  getState: (id: string) => api.get<NoteState>(`${BASE}/states/${id}/`),
  createState: (payload: Partial<NoteState>) =>
    api.post<NoteState>(`${BASE}/states/`, payload),
  updateState: (id: string, payload: Partial<NoteState>) =>
    api.put<NoteState>(`${BASE}/states/${id}/`, payload),
  patchState: (id: string, payload: Partial<NoteState>) =>
    api.patch<NoteState>(`${BASE}/states/${id}/`, payload),
  removeState: (id: string) => api.delete<void>(`${BASE}/states/${id}/`),

  listTypes: (params?: { search?: string }) =>
    api.get<PaginatedResponse<NoteType>>(
      `${BASE}/types/`,
      cleanParams(params as QueryParams)
    ),
  getType: (id: string) => api.get<NoteType>(`${BASE}/types/${id}/`),
  createType: (payload: Partial<NoteType>) =>
    api.post<NoteType>(`${BASE}/types/`, payload),
  updateType: (id: string, payload: Partial<NoteType>) =>
    api.put<NoteType>(`${BASE}/types/${id}/`, payload),
  patchType: (id: string, payload: Partial<NoteType>) =>
    api.patch<NoteType>(`${BASE}/types/${id}/`, payload),
  removeType: (id: string) => api.delete<void>(`${BASE}/types/${id}/`),
};

