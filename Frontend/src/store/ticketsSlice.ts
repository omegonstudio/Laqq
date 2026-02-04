import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  ServiceTicket,
  TicketPriority,
  TicketState,
  PaginatedResponse,
} from "@/types/api";
import {
  ticketsApi,
  TicketListParams,
  TicketStatistics,
  AssignTicketPayload,
  ResolveTicketPayload,
  AttachTicketFilePayload,
} from "@/lib/api/tickets";
import { PaginationInfo } from "@/types/types";

interface TicketsState {
  /* TICKETS */
  list: ServiceTicket[];
  count: number;
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;

  selected: ServiceTicket | null;
  selectedLoading: boolean;
  selectedError: string | null;

  /* STATES */
  states: TicketState[];
  statesLoading: boolean;
  statesError: string | null;

  /* PRIORITIES */
  priorities: TicketPriority[];
  prioritiesLoading: boolean;
  prioritiesError: string | null;

  /* STATISTICS */
  statistics: TicketStatistics | null;
  statisticsLoading: boolean;
  statisticsError: string | null;
}

const initialPagination: PaginationInfo = {
  count: 0,
  next: null,
  previous: null,
  page_size: 20,
  current_page: 1,
  total_pages: 1,
};

const initialState: TicketsState = {
  list: [],
  count: 0,
  loading: false,
  error: null,
  pagination: initialPagination,

  selected: null,
  selectedLoading: false,
  selectedError: null,

  states: [],
  statesLoading: false,
  statesError: null,

  priorities: [],
  prioritiesLoading: false,
  prioritiesError: null,

  statistics: null,
  statisticsLoading: false,
  statisticsError: null,
};

/* ---------- THUNKS ---------- */

/* TICKETS */
export const fetchTickets = createAsyncThunk(
  "tickets/fetchTickets",
  async (params?: TicketListParams) => {
    return ticketsApi.list(params);
  }
);

export const fetchTicket = createAsyncThunk(
  "tickets/fetchTicket",
  async (id: string) => {
    return ticketsApi.get(id);
  }
);

export const createTicket = createAsyncThunk(
  "tickets/createTicket",
  async (data: Partial<ServiceTicket>) => {
    return ticketsApi.create(data);
  }
);

export const updateTicket = createAsyncThunk(
  "tickets/updateTicket",
  async ({ id, data }: { id: string; data: Partial<ServiceTicket> }) => {
    return ticketsApi.update(id, data);
  }
);

export const patchTicket = createAsyncThunk(
  "tickets/patchTicket",
  async ({ id, data }: { id: string; data: Partial<ServiceTicket> }) => {
    return ticketsApi.patch(id, data);
  }
);

export const deleteTicket = createAsyncThunk(
  "tickets/deleteTicket",
  async (id: string) => {
    await ticketsApi.remove(id);
    return id;
  }
);

/* STATES */
export const fetchTicketStates = createAsyncThunk(
  "tickets/fetchTicketStates",
  async (params?: { search?: string }) => {
    return ticketsApi.listStates(params);
  }
);

/* PRIORITIES */
export const fetchTicketPriorities = createAsyncThunk(
  "tickets/fetchTicketPriorities",
  async (params?: { search?: string }) => {
    return ticketsApi.listPriorities(params);
  }
);

/* ACTIONS */
export const attachTicketFile = createAsyncThunk(
  "tickets/attachTicketFile",
  async ({ id, payload }: { id: string; payload: AttachTicketFilePayload }) => {
    return ticketsApi.attachFile(id, payload);
  }
);

export const assignTicket = createAsyncThunk(
  "tickets/assignTicket",
  async ({ id, payload }: { id: string; payload: AssignTicketPayload }) => {
    return ticketsApi.assign(id, payload);
  }
);

export const startTicket = createAsyncThunk(
  "tickets/startTicket",
  async (id: string) => {
    return ticketsApi.start(id);
  }
);

export const resolveTicket = createAsyncThunk(
  "tickets/resolveTicket",
  async ({ id, payload }: { id: string; payload?: ResolveTicketPayload }) => {
    return ticketsApi.resolve(id, payload);
  }
);

export const closeTicket = createAsyncThunk(
  "tickets/closeTicket",
  async (id: string) => {
    return ticketsApi.close(id);
  }
);

/* STATISTICS */
export const fetchTicketStatistics = createAsyncThunk(
  "tickets/fetchTicketStatistics",
  async () => {
    return ticketsApi.statistics();
  }
);

/* ---------- SLICE ---------- */

export const ticketsSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    /* TICKETS LIST */
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.results; // Esto reemplaza completamente la lista
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
          page_size: action.payload.page_size,
          current_page: action.payload.current_page,
          total_pages: action.payload.total_pages,
        };
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error cargando tickets";
      });

    /* TICKET GET ONE */
    builder
      .addCase(fetchTicket.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchTicket.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchTicket.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError = action.error.message || "Error cargando ticket";
      });

    /* CREATE TICKET */
    builder.addCase(createTicket.fulfilled, (state, action) => {
      state.list.unshift(action.payload);
      state.pagination.count += 1;
    });

    /* DELETE TICKET */
    builder.addCase(deleteTicket.fulfilled, (state, action) => {
      state.list = state.list.filter((ticket) => ticket.id !== action.payload);
      state.pagination.count -= 1;
    });

    /* STATES */
    builder
      .addCase(fetchTicketStates.pending, (state) => {
        state.statesLoading = true;
        state.statesError = null;
      })
      .addCase(fetchTicketStates.fulfilled, (state, action) => {
        state.statesLoading = false;
        state.states = action.payload.results;
      })
      .addCase(fetchTicketStates.rejected, (state, action) => {
        state.statesLoading = false;
        state.statesError = action.error.message || "Error cargando estados";
      });

    /* PRIORITIES */
    builder
      .addCase(fetchTicketPriorities.pending, (state) => {
        state.prioritiesLoading = true;
        state.prioritiesError = null;
      })
      .addCase(fetchTicketPriorities.fulfilled, (state, action) => {
        state.prioritiesLoading = false;
        state.priorities = action.payload.results;
      })
      .addCase(fetchTicketPriorities.rejected, (state, action) => {
        state.prioritiesLoading = false;
        state.prioritiesError =
          action.error.message || "Error cargando prioridades";
      });

    /* ACTIONS */
    builder
      .addCase(attachTicketFile.fulfilled, (state, action) => {
        if (state.selected?.id === action.payload.id) {
          state.selected = action.payload;
        }
        const index = state.list.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(assignTicket.fulfilled, (state, action) => {
        if (state.selected?.id === action.payload.id) {
          state.selected = action.payload;
        }
        const index = state.list.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(startTicket.fulfilled, (state, action) => {
        if (state.selected?.id === action.payload.id) {
          state.selected = action.payload;
        }
        const index = state.list.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(resolveTicket.fulfilled, (state, action) => {
        if (state.selected?.id === action.payload.id) {
          state.selected = action.payload;
        }
        const index = state.list.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(closeTicket.fulfilled, (state, action) => {
        if (state.selected?.id === action.payload.id) {
          state.selected = action.payload;
        }
        const index = state.list.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      });

    /* STATISTICS */
    builder
      .addCase(fetchTicketStatistics.pending, (state) => {
        state.statisticsLoading = true;
        state.statisticsError = null;
      })
      .addCase(fetchTicketStatistics.fulfilled, (state, action) => {
        state.statisticsLoading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchTicketStatistics.rejected, (state, action) => {
        state.statisticsLoading = false;
        state.statisticsError =
          action.error.message || "Error cargando estadísticas";
      });
  },
});

export default ticketsSlice.reducer;
