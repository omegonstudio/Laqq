import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  contactsApi,
  ContactListParams,
  MessageListParams,
} from "@/lib/api/contacts";
import {
  Contact,
  ContactState,
  Message,
  PaginatedResponse,
} from "@/types/api";
import { NormalizedApiError } from "@/lib/api/client";

const contactsListKey = (params?: ContactListParams) => ["contacts", "list", params];
const contactDetailKey = (id?: string) => ["contacts", "detail", id];
const contactStatesKey = ["contacts", "states"];
const contactStateDetailKey = (id?: string) => ["contacts", "states", "detail", id];
const messagesListKey = (params?: MessageListParams) => ["messages", "list", params];
const messageDetailKey = (id?: string) => ["messages", "detail", id];

export const useContactsList = (params?: ContactListParams) =>
  useQuery<PaginatedResponse<Contact>, NormalizedApiError>({
    queryKey: contactsListKey(params),
    queryFn: () => contactsApi.list(params),
    placeholderData: (prev) => prev,
  });

export const useContact = (id?: string) =>
  useQuery<Contact, NormalizedApiError>({
    queryKey: contactDetailKey(id),
    queryFn: () => contactsApi.get(id as string),
    enabled: Boolean(id),
  });

export const useCreateContact = () => {
  const queryClient = useQueryClient();

  return useMutation<Contact, NormalizedApiError, Partial<Contact>>({
    mutationFn: (payload) => contactsApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.setQueryData(contactDetailKey(data.id), data);
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Contact,
    NormalizedApiError,
    { id: string; payload: Partial<Contact> }
  >({
    mutationFn: ({ id, payload }) => contactsApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.setQueryData(contactDetailKey(data.id), data);
    },
  });
};

export const usePatchContact = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Contact,
    NormalizedApiError,
    { id: string; payload: Partial<Contact> }
  >({
    mutationFn: ({ id, payload }) => contactsApi.patch(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.setQueryData(contactDetailKey(data.id), data);
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => contactsApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.removeQueries({ queryKey: contactDetailKey(id) });
    },
  });
};

// States
export const useContactStates = () =>
  useQuery<PaginatedResponse<ContactState>, NormalizedApiError>({
    queryKey: contactStatesKey,
    queryFn: () => contactsApi.listStates(),
    placeholderData: (prev) => prev,
  });

export const useContactState = (id?: string) =>
  useQuery<ContactState, NormalizedApiError>({
    queryKey: contactStateDetailKey(id),
    queryFn: () => contactsApi.getState(id as string),
    enabled: Boolean(id),
  });

export const useCreateContactState = () => {
  const queryClient = useQueryClient();

  return useMutation<ContactState, NormalizedApiError, Partial<ContactState>>({
    mutationFn: (payload) => contactsApi.createState(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contacts", "states"] });
      queryClient.setQueryData(contactStateDetailKey(data.id), data);
    },
  });
};

export const useUpdateContactState = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ContactState,
    NormalizedApiError,
    { id: string; payload: Partial<ContactState> }
  >({
    mutationFn: ({ id, payload }) => contactsApi.updateState(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contacts", "states"] });
      queryClient.setQueryData(contactStateDetailKey(data.id), data);
    },
  });
};

export const usePatchContactState = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ContactState,
    NormalizedApiError,
    { id: string; payload: Partial<ContactState> }
  >({
    mutationFn: ({ id, payload }) => contactsApi.patchState(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contacts", "states"] });
      queryClient.setQueryData(contactStateDetailKey(data.id), data);
    },
  });
};

export const useDeleteContactState = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => contactsApi.removeState(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["contacts", "states"] });
      queryClient.removeQueries({ queryKey: contactStateDetailKey(id) });
    },
  });
};

// Messages
export const useMessages = (params?: MessageListParams) =>
  useQuery<PaginatedResponse<Message>, NormalizedApiError>({
    queryKey: messagesListKey(params),
    queryFn: () => contactsApi.listMessages(params),
    placeholderData: (prev) => prev,
  });

export const useMessage = (id?: string) =>
  useQuery<Message, NormalizedApiError>({
    queryKey: messageDetailKey(id),
    queryFn: () => contactsApi.getMessage(id as string),
    enabled: Boolean(id),
  });

export const useCreateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation<Message, NormalizedApiError, Partial<Message>>({
    mutationFn: (payload) => contactsApi.createMessage(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.setQueryData(messageDetailKey(data.id), data);
    },
  });
};

export const useUpdateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Message,
    NormalizedApiError,
    { id: string; payload: Partial<Message> }
  >({
    mutationFn: ({ id, payload }) => contactsApi.updateMessage(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.setQueryData(messageDetailKey(data.id), data);
    },
  });
};

export const usePatchMessage = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Message,
    NormalizedApiError,
    { id: string; payload: Partial<Message> }
  >({
    mutationFn: ({ id, payload }) => contactsApi.patchMessage(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.setQueryData(messageDetailKey(data.id), data);
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => contactsApi.removeMessage(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.removeQueries({ queryKey: messageDetailKey(id) });
    },
  });
};

