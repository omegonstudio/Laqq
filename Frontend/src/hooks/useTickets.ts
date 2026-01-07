import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ticketsApi,
  TicketListParams,
  AssignTicketPayload,
  ResolveTicketPayload,
  AttachTicketFilePayload,
  TicketStatistics,
} from "@/lib/api/tickets";
import {
  PaginatedResponse,
  ServiceTicket,
  TicketPriority,
  TicketState,
} from "@/types/api";
import { NormalizedApiError } from "@/lib/api/client";

const ticketsListKey = (params?: TicketListParams) => ["tickets", "list", params];
const ticketDetailKey = (id?: string) => ["tickets", "detail", id];
const ticketStatesKey = ["tickets", "states"];
const ticketStateDetailKey = (id?: string) => ["tickets", "states", "detail", id];
const ticketPrioritiesKey = ["tickets", "priorities"];
const ticketPriorityDetailKey = (id?: string) => ["tickets", "priorities", "detail", id];
const ticketStatsKey = ["tickets", "statistics"];

export const useTicketsList = (params?: TicketListParams) =>
  useQuery<PaginatedResponse<ServiceTicket>, NormalizedApiError>({
    queryKey: ticketsListKey(params),
    queryFn: () => ticketsApi.list(params),
    placeholderData: (prev) => prev,
  });

export const useTicket = (id?: string) =>
  useQuery<ServiceTicket, NormalizedApiError>({
    queryKey: ticketDetailKey(id),
    queryFn: () => ticketsApi.get(id as string),
    enabled: Boolean(id),
  });

export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation<ServiceTicket, NormalizedApiError, Partial<ServiceTicket>>({
    mutationFn: (payload) => ticketsApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ticketStatsKey });
      queryClient.setQueryData(ticketDetailKey(data.id), data);
    },
  });
};

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ServiceTicket,
    NormalizedApiError,
    { id: string; payload: Partial<ServiceTicket> }
  >({
    mutationFn: ({ id, payload }) => ticketsApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ticketStatsKey });
      queryClient.setQueryData(ticketDetailKey(data.id), data);
    },
  });
};

export const usePatchTicket = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ServiceTicket,
    NormalizedApiError,
    { id: string; payload: Partial<ServiceTicket> }
  >({
    mutationFn: ({ id, payload }) => ticketsApi.patch(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ticketStatsKey });
      queryClient.setQueryData(ticketDetailKey(data.id), data);
    },
  });
};

export const useDeleteTicket = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => ticketsApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ticketStatsKey });
      queryClient.removeQueries({ queryKey: ticketDetailKey(id) });
    },
  });
};

// States
export const useTicketStates = () =>
  useQuery<PaginatedResponse<TicketState>, NormalizedApiError>({
    queryKey: ticketStatesKey,
    queryFn: () => ticketsApi.listStates(),
    placeholderData: (prev) => prev,
  });

export const useTicketState = (id?: string) =>
  useQuery<TicketState, NormalizedApiError>({
    queryKey: ticketStateDetailKey(id),
    queryFn: () => ticketsApi.getState(id as string),
    enabled: Boolean(id),
  });

export const useCreateTicketState = () => {
  const queryClient = useQueryClient();

  return useMutation<TicketState, NormalizedApiError, Partial<TicketState>>({
    mutationFn: (payload) => ticketsApi.createState(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets", "states"] });
      queryClient.setQueryData(ticketStateDetailKey(data.id), data);
    },
  });
};

export const useUpdateTicketState = () => {
  const queryClient = useQueryClient();

  return useMutation<
    TicketState,
    NormalizedApiError,
    { id: string; payload: Partial<TicketState> }
  >({
    mutationFn: ({ id, payload }) => ticketsApi.updateState(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets", "states"] });
      queryClient.setQueryData(ticketStateDetailKey(data.id), data);
    },
  });
};

export const usePatchTicketState = () => {
  const queryClient = useQueryClient();

  return useMutation<
    TicketState,
    NormalizedApiError,
    { id: string; payload: Partial<TicketState> }
  >({
    mutationFn: ({ id, payload }) => ticketsApi.patchState(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets", "states"] });
      queryClient.setQueryData(ticketStateDetailKey(data.id), data);
    },
  });
};

export const useDeleteTicketState = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => ticketsApi.removeState(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["tickets", "states"] });
      queryClient.removeQueries({ queryKey: ticketStateDetailKey(id) });
    },
  });
};

// Priorities
export const useTicketPriorities = () =>
  useQuery<PaginatedResponse<TicketPriority>, NormalizedApiError>({
    queryKey: ticketPrioritiesKey,
    queryFn: () => ticketsApi.listPriorities(),
    placeholderData: (prev) => prev,
  });

export const useTicketPriority = (id?: string) =>
  useQuery<TicketPriority, NormalizedApiError>({
    queryKey: ticketPriorityDetailKey(id),
    queryFn: () => ticketsApi.getPriority(id as string),
    enabled: Boolean(id),
  });

export const useCreateTicketPriority = () => {
  const queryClient = useQueryClient();

  return useMutation<TicketPriority, NormalizedApiError, Partial<TicketPriority>>({
    mutationFn: (payload) => ticketsApi.createPriority(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets", "priorities"] });
      queryClient.setQueryData(ticketPriorityDetailKey(data.id), data);
    },
  });
};

export const useUpdateTicketPriority = () => {
  const queryClient = useQueryClient();

  return useMutation<
    TicketPriority,
    NormalizedApiError,
    { id: string; payload: Partial<TicketPriority> }
  >({
    mutationFn: ({ id, payload }) => ticketsApi.updatePriority(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets", "priorities"] });
      queryClient.setQueryData(ticketPriorityDetailKey(data.id), data);
    },
  });
};

export const usePatchTicketPriority = () => {
  const queryClient = useQueryClient();

  return useMutation<
    TicketPriority,
    NormalizedApiError,
    { id: string; payload: Partial<TicketPriority> }
  >({
    mutationFn: ({ id, payload }) => ticketsApi.patchPriority(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets", "priorities"] });
      queryClient.setQueryData(ticketPriorityDetailKey(data.id), data);
    },
  });
};

export const useDeleteTicketPriority = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => ticketsApi.removePriority(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["tickets", "priorities"] });
      queryClient.removeQueries({ queryKey: ticketPriorityDetailKey(id) });
    },
  });
};

// Estadísticas
export const useTicketStatistics = () =>
  useQuery<TicketStatistics, NormalizedApiError>({
    queryKey: ticketStatsKey,
    queryFn: () => ticketsApi.statistics(),
  });

// Acciones
export const useAssignTicket = () => {
  const queryClient = useQueryClient();

  return useMutation<ServiceTicket, NormalizedApiError, { id: string; payload: AssignTicketPayload }>({
    mutationFn: ({ id, payload }) => ticketsApi.assign(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ticketStatsKey });
      queryClient.setQueryData(ticketDetailKey(data.id), data);
    },
  });
};

export const useStartTicket = () => {
  const queryClient = useQueryClient();

  return useMutation<ServiceTicket, NormalizedApiError, { id: string }>({
    mutationFn: ({ id }) => ticketsApi.start(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.setQueryData(ticketDetailKey(data.id), data);
    },
  });
};

export const useResolveTicket = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ServiceTicket,
    NormalizedApiError,
    { id: string; payload?: ResolveTicketPayload }
  >({
    mutationFn: ({ id, payload }) => ticketsApi.resolve(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.setQueryData(ticketDetailKey(data.id), data);
    },
  });
};

export const useCloseTicket = () => {
  const queryClient = useQueryClient();

  return useMutation<ServiceTicket, NormalizedApiError, { id: string }>({
    mutationFn: ({ id }) => ticketsApi.close(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.setQueryData(ticketDetailKey(data.id), data);
    },
  });
};

export const useAttachFileToTicket = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ServiceTicket,
    NormalizedApiError,
    { id: string; payload: AttachTicketFilePayload }
  >({
    mutationFn: ({ id, payload }) => ticketsApi.attachFile(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.setQueryData(ticketDetailKey(data.id), data);
    },
  });
};

