import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { quotesApi, QuoteListParams, QuoteItemListParams } from "@/lib/api/quotes";
import { NormalizedApiError } from "@/lib/api/client";
import {
  PaginatedResponse,
  Quote,
  QuoteItem,
  QuoteState,
  QuoteType,
} from "@/types/api";

const quotesListKey = (params?: QuoteListParams) => ["quotes", "list", params];
const quoteDetailKey = (id?: string) => ["quotes", "detail", id];
const quoteStatesKey = ["quotes", "states"];
const quoteStateDetailKey = (id?: string) => ["quotes", "states", "detail", id];
const quoteTypesKey = ["quotes", "types"];
const quoteTypeDetailKey = (id?: string) => ["quotes", "types", "detail", id];
const quoteItemsKey = (params?: QuoteItemListParams) => ["quotes", "items", params];
const quoteItemDetailKey = (id?: string) => ["quotes", "items", "detail", id];

export const useQuotesList = (params?: QuoteListParams) =>
  useQuery<PaginatedResponse<Quote>, NormalizedApiError>({
    queryKey: quotesListKey(params),
    queryFn: () => quotesApi.list(params),
    placeholderData: (prev) => prev,
  });

export const useQuote = (id?: string) =>
  useQuery<Quote, NormalizedApiError>({
    queryKey: quoteDetailKey(id),
    queryFn: () => quotesApi.get(id as string),
    enabled: Boolean(id),
  });

export const useCreateQuote = () => {
  const queryClient = useQueryClient();

  return useMutation<Quote, NormalizedApiError, Partial<Quote>>({
    mutationFn: (payload) => quotesApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.setQueryData(quoteDetailKey(data.id), data);
    },
  });
};

export const useUpdateQuote = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Quote,
    NormalizedApiError,
    { id: string; payload: Partial<Quote> }
  >({
    mutationFn: ({ id, payload }) => quotesApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.setQueryData(quoteDetailKey(data.id), data);
    },
  });
};

export const usePatchQuote = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Quote,
    NormalizedApiError,
    { id: string; payload: Partial<Quote> }
  >({
    mutationFn: ({ id, payload }) => quotesApi.patch(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.setQueryData(quoteDetailKey(data.id), data);
    },
  });
};

export const useDeleteQuote = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => quotesApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.removeQueries({ queryKey: quoteDetailKey(id) });
    },
  });
};

// States
export const useQuoteStates = () =>
  useQuery<PaginatedResponse<QuoteState>, NormalizedApiError>({
    queryKey: quoteStatesKey,
    queryFn: () => quotesApi.listStates(),
    placeholderData: (prev) => prev,
  });

export const useQuoteState = (id?: string) =>
  useQuery<QuoteState, NormalizedApiError>({
    queryKey: quoteStateDetailKey(id),
    queryFn: () => quotesApi.getState(id as string),
    enabled: Boolean(id),
  });

export const useCreateQuoteState = () => {
  const queryClient = useQueryClient();

  return useMutation<QuoteState, NormalizedApiError, Partial<QuoteState>>({
    mutationFn: (payload) => quotesApi.createState(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes", "states"] });
      queryClient.setQueryData(quoteStateDetailKey(data.id), data);
    },
  });
};

export const useUpdateQuoteState = () => {
  const queryClient = useQueryClient();

  return useMutation<
    QuoteState,
    NormalizedApiError,
    { id: string; payload: Partial<QuoteState> }
  >({
    mutationFn: ({ id, payload }) => quotesApi.updateState(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes", "states"] });
      queryClient.setQueryData(quoteStateDetailKey(data.id), data);
    },
  });
};

export const usePatchQuoteState = () => {
  const queryClient = useQueryClient();

  return useMutation<
    QuoteState,
    NormalizedApiError,
    { id: string; payload: Partial<QuoteState> }
  >({
    mutationFn: ({ id, payload }) => quotesApi.patchState(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes", "states"] });
      queryClient.setQueryData(quoteStateDetailKey(data.id), data);
    },
  });
};

export const useDeleteQuoteState = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => quotesApi.removeState(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["quotes", "states"] });
      queryClient.removeQueries({ queryKey: quoteStateDetailKey(id) });
    },
  });
};

// Types
export const useQuoteTypes = () =>
  useQuery<PaginatedResponse<QuoteType>, NormalizedApiError>({
    queryKey: quoteTypesKey,
    queryFn: () => quotesApi.listTypes(),
    placeholderData: (prev) => prev,
  });

export const useQuoteType = (id?: string) =>
  useQuery<QuoteType, NormalizedApiError>({
    queryKey: quoteTypeDetailKey(id),
    queryFn: () => quotesApi.getType(id as string),
    enabled: Boolean(id),
  });

export const useCreateQuoteType = () => {
  const queryClient = useQueryClient();

  return useMutation<QuoteType, NormalizedApiError, Partial<QuoteType>>({
    mutationFn: (payload) => quotesApi.createType(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes", "types"] });
      queryClient.setQueryData(quoteTypeDetailKey(data.id), data);
    },
  });
};

export const useUpdateQuoteType = () => {
  const queryClient = useQueryClient();

  return useMutation<
    QuoteType,
    NormalizedApiError,
    { id: string; payload: Partial<QuoteType> }
  >({
    mutationFn: ({ id, payload }) => quotesApi.updateType(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes", "types"] });
      queryClient.setQueryData(quoteTypeDetailKey(data.id), data);
    },
  });
};

export const usePatchQuoteType = () => {
  const queryClient = useQueryClient();

  return useMutation<
    QuoteType,
    NormalizedApiError,
    { id: string; payload: Partial<QuoteType> }
  >({
    mutationFn: ({ id, payload }) => quotesApi.patchType(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes", "types"] });
      queryClient.setQueryData(quoteTypeDetailKey(data.id), data);
    },
  });
};

export const useDeleteQuoteType = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => quotesApi.removeType(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["quotes", "types"] });
      queryClient.removeQueries({ queryKey: quoteTypeDetailKey(id) });
    },
  });
};

// Items
export const useQuoteItems = (params?: QuoteItemListParams) =>
  useQuery<PaginatedResponse<QuoteItem>, NormalizedApiError>({
    queryKey: quoteItemsKey(params),
    queryFn: () => quotesApi.listItems(params),
    placeholderData: (prev) => prev,
  });

export const useQuoteItem = (id?: string) =>
  useQuery<QuoteItem, NormalizedApiError>({
    queryKey: quoteItemDetailKey(id),
    queryFn: () => quotesApi.getItem(id as string),
    enabled: Boolean(id),
  });

export const useCreateQuoteItem = () => {
  const queryClient = useQueryClient();

  return useMutation<QuoteItem, NormalizedApiError, Partial<QuoteItem>>({
    mutationFn: (payload) => quotesApi.createItem(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes", "items"] });
      queryClient.setQueryData(quoteItemDetailKey(data.id), data);
    },
  });
};

export const useUpdateQuoteItem = () => {
  const queryClient = useQueryClient();

  return useMutation<
    QuoteItem,
    NormalizedApiError,
    { id: string; payload: Partial<QuoteItem> }
  >({
    mutationFn: ({ id, payload }) => quotesApi.updateItem(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes", "items"] });
      queryClient.setQueryData(quoteItemDetailKey(data.id), data);
    },
  });
};

export const usePatchQuoteItem = () => {
  const queryClient = useQueryClient();

  return useMutation<
    QuoteItem,
    NormalizedApiError,
    { id: string; payload: Partial<QuoteItem> }
  >({
    mutationFn: ({ id, payload }) => quotesApi.patchItem(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotes", "items"] });
      queryClient.setQueryData(quoteItemDetailKey(data.id), data);
    },
  });
};

export const useDeleteQuoteItem = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => quotesApi.removeItem(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["quotes", "items"] });
      queryClient.removeQueries({ queryKey: quoteItemDetailKey(id) });
    },
  });
};

