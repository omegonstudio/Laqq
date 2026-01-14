import { api } from "./client";
import { cleanParams, QueryParams } from "./utils";
import {
  PaginatedResponse,
  Attachment,
  AttachmentCreatePayload,
  AttachmentUpdatePayload,
} from "@/types/types";

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

  create: (payload: AttachmentCreatePayload) => {
    const formData = new FormData();
    formData.append("file", payload.file);

    if (payload.role) formData.append("role", payload.role);
    if (payload.attachable_type)
      formData.append("attachable_type", payload.attachable_type);
    if (payload.attachable_id)
      formData.append("attachable_id", payload.attachable_id);

    return api.post<Attachment>(`${BASE}/`, formData);
  },

  update: (id: string, payload: AttachmentUpdatePayload) => {
    const formData = new FormData();

    if (payload.file) formData.append("file", payload.file);
    if (payload.role) formData.append("role", payload.role);
    if (payload.attachable_type)
      formData.append("attachable_type", payload.attachable_type);
    if (payload.attachable_id)
      formData.append("attachable_id", payload.attachable_id);

    return api.put<Attachment>(`${BASE}/${id}/`, formData);
  },

  patch: (id: string, payload: Partial<AttachmentUpdatePayload>) =>
    api.patch<Attachment>(`${BASE}/${id}/`, payload),

  remove: (id: string) => api.delete<void>(`${BASE}/${id}/`),
};
