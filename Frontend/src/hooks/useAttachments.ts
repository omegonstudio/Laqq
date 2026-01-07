import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  attachmentsApi,
  AttachmentListParams,
} from "@/lib/api/attachments";
import { Attachment, PaginatedResponse } from "@/types/api";
import { NormalizedApiError } from "@/lib/api/client";

const listKey = (params?: AttachmentListParams) => ["attachments", "list", params];
const detailKey = (id?: string) => ["attachments", "detail", id];

export const useAttachments = (params?: AttachmentListParams) =>
  useQuery<PaginatedResponse<Attachment>, NormalizedApiError>({
    queryKey: listKey(params),
    queryFn: () => attachmentsApi.list(params),
    placeholderData: (prev) => prev,
  });

export const useAttachment = (id?: string) =>
  useQuery<Attachment, NormalizedApiError>({
    queryKey: detailKey(id),
    queryFn: () => attachmentsApi.get(id as string),
    enabled: Boolean(id),
  });

export const useCreateAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation<Attachment, NormalizedApiError, FormData | Partial<Attachment>>({
    mutationFn: (payload) => attachmentsApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
      queryClient.setQueryData(detailKey(data.id), data);
    },
  });
};

export const useUpdateAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Attachment,
    NormalizedApiError,
    { id: string; payload: FormData | Partial<Attachment> }
  >({
    mutationFn: ({ id, payload }) => attachmentsApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
      queryClient.setQueryData(detailKey(data.id), data);
    },
  });
};

export const usePatchAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Attachment,
    NormalizedApiError,
    { id: string; payload: Partial<Attachment> }
  >({
    mutationFn: ({ id, payload }) => attachmentsApi.patch(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
      queryClient.setQueryData(detailKey(data.id), data);
    },
  });
};

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => attachmentsApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
      queryClient.removeQueries({ queryKey: detailKey(id) });
    },
  });
};

