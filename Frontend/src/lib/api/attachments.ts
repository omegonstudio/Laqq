import { api } from "./client";
import { cleanParams, QueryParams } from "./utils";
import { Attachment, PaginatedResponse } from "@/types/api";

const BASE = "/attachments";

export interface AttachmentListParams {
  page?: number;
  page_size?: number;
  attachable_type?: string;
  attachable_id?: string;
  search?: string;
  ordering?: string;
}

export const attachmentsApi = {
  list: (params?: AttachmentListParams) =>
    api.get<PaginatedResponse<Attachment>>(
      `${BASE}/`,
      cleanParams(params as QueryParams)
    ),
  get: (id: string) => api.get<Attachment>(`${BASE}/${id}/`),
  create: (payload: FormData | Partial<Attachment>) =>
    api.post<Attachment>(`${BASE}/`, payload),
  update: (id: string, payload: FormData | Partial<Attachment>) =>
    api.put<Attachment>(`${BASE}/${id}/`, payload),
  patch: (id: string, payload: Partial<Attachment>) =>
    api.patch<Attachment>(`${BASE}/${id}/`, payload),
  remove: (id: string) => api.delete<void>(`${BASE}/${id}/`),
};

