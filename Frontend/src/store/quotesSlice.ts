import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { quotesApi } from "@/lib/api/quotes";
import {
  Quote,
  QuoteItem,
  QuoteType,
  QuoteState,
  QuoteFormState,
} from "@/types/api";
import { PaginationInfo } from "@/types/types";

interface FetchQuotesParams {
  page?: number;
  page_size?: number;
}
// types/quote-api.types.ts
export interface QuoteItemBulkCreate {
  quote: string; // quoteId (UUID)
  product: string; // productId (UUID)
  quantity: number; // > 0
}

export const createQuoteItemsBulk = createAsyncThunk(
  "quotes/bulk",
  async (payload: Partial<QuoteItemBulkCreate>) => {
    return quotesApi.bulk(payload);
  }
);
export const createQuoteFormState = createAsyncThunk(
  "quotes/bulk",
  async (payload: Partial<QuoteFormState>) => {
    return quotesApi.from(payload);
  }
);
// =================== TYPES ===================

export const fetchQuoteTypes = createAsyncThunk(
  "quotes/fetchTypes",
  async (params?: { search?: string }) => {
    return quotesApi.listTypes(params);
  }
);

export const fetchQuoteType = createAsyncThunk(
  "quotes/fetchType",
  async (id: string) => {
    return quotesApi.getType(id);
  }
);

export const createQuoteType = createAsyncThunk(
  "quotes/createType",
  async (payload: Partial<QuoteType>) => {
    return quotesApi.createType(payload);
  }
);

export const updateQuoteType = createAsyncThunk(
  "quotes/updateType",
  async ({ id, data }: { id: string; data: Partial<QuoteType> }) => {
    return quotesApi.updateType(id, data);
  }
);

export const deleteQuoteType = createAsyncThunk(
  "quotes/deleteType",
  async (id: string) => {
    await quotesApi.removeType(id);
    return id;
  }
);

// =================== STATES ===================

export const fetchQuoteStates = createAsyncThunk(
  "quotes/fetchStates",
  async (params?: { search?: string }) => {
    return quotesApi.listStates(params);
  }
);

export const fetchQuoteState = createAsyncThunk(
  "quotes/fetchState",
  async (id: string) => {
    return quotesApi.getState(id);
  }
);

export const createQuoteState = createAsyncThunk(
  "quotes/createState",
  async (payload: Partial<QuoteState>) => {
    return quotesApi.createState(payload);
  }
);

export const updateQuoteState = createAsyncThunk(
  "quotes/updateState",
  async ({ id, data }: { id: string; data: Partial<QuoteState> }) => {
    return quotesApi.updateState(id, data);
  }
);

export const deleteQuoteState = createAsyncThunk(
  "quotes/deleteState",
  async (id: string) => {
    await quotesApi.removeState(id);
    return id;
  }
);

export const fetchQuotes = createAsyncThunk(
  "quotes/fetchAll",
  async (params?: FetchQuotesParams) => {
    return quotesApi.list(params);
  }
);
export const fetchQuote = createAsyncThunk(
  "quotes/fetchOne",
  async (id: string) => {
    return quotesApi.get(id);
  }
);
export const createQuote = createAsyncThunk(
  "quotes/create",
  async (payload: Partial<Quote>) => {
    return quotesApi.create(payload);
  }
);

export const updateQuote = createAsyncThunk(
  "quotes/update",
  async ({ id, data }: { id: string; data: Partial<Quote> }) => {
    return quotesApi.update(id, data);
  }
);

export const deleteQuote = createAsyncThunk(
  "quotes/delete",
  async (id: string) => {
    await quotesApi.remove(id);
    return id;
  }
);
export const fetchQuoteItems = createAsyncThunk(
  "quotes/fetchItems",
  async (params?: FetchQuotesParams) => {
    return quotesApi.listItems(params);
  }
);

export const createQuoteItem = createAsyncThunk(
  "quotes/createItem",
  async (payload: Partial<QuoteItem>) => {
    return quotesApi.createItem(payload);
  }
);

export const updateQuoteItem = createAsyncThunk(
  "quotes/updateItem",
  async ({ id, data }: { id: string; data: Partial<QuoteItem> }) => {
    return quotesApi.updateItem(id, data);
  }
);

export const deleteQuoteItem = createAsyncThunk(
  "quotes/deleteItem",
  async (id: string) => {
    await quotesApi.removeItem(id);
    return id;
  }
);
interface QuotesState {
  // Quotes
  list: Quote[];
  pagination: PaginationInfo;
  loading: boolean;
  error: string | null;

  selected: Quote | null;
  selectedLoading: boolean;
  selectedError: string | null;

  // Items
  items: QuoteItem[];
  itemsLoading: boolean;
  itemsError: string | null;

  // Types
  types: QuoteType[];
  typesLoading: boolean;
  typesError: string | null;

  // States
  states: QuoteState[];
  statesLoading: boolean;
  statesError: string | null;

  creating: boolean;
  updating: boolean;
  deleting: boolean;
}
const initialPagination: PaginationInfo = {
  count: 0,
  next: null,
  previous: null,
  page_size: 20,
  current_page: 1,
  total_pages: 1,
};

const initialState: QuotesState = {
  list: [],
  pagination: initialPagination,
  loading: false,
  error: null,

  selected: null,
  selectedLoading: false,
  selectedError: null,

  items: [],
  itemsLoading: false,
  itemsError: null,

  types: [],
  typesLoading: false,
  typesError: null,

  states: [],
  statesLoading: false,
  statesError: null,

  creating: false,
  updating: false,
  deleting: false,
};

export const quotesSlice = createSlice({
  name: "quotes",
  initialState,
  reducers: {
    clearSelected(state) {
      state.selected = null;
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    // ================= QUOTES =================
    builder
      .addCase(fetchQuotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuotes.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.results;
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
          page_size: action.payload.page_size,
          current_page: action.payload.current_page,
          total_pages: action.payload.total_pages,
        };
      })
      .addCase(fetchQuotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Error obteniendo cotizaciones";
      });

    builder
      .addCase(fetchQuote.pending, (state) => {
        state.selectedLoading = true;
      })
      .addCase(fetchQuote.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selected = action.payload;
      });

    builder.addCase(createQuote.fulfilled, (state, action) => {
      state.list.unshift(action.payload);
    });

    builder.addCase(updateQuote.fulfilled, (state, action) => {
      state.list = state.list.map((q) =>
        q.id === action.payload.id ? action.payload : q
      );
      if (state.selected?.id === action.payload.id) {
        state.selected = action.payload;
      }
    });

    builder.addCase(deleteQuote.fulfilled, (state, action) => {
      state.list = state.list.filter((q) => q.id !== action.payload);
    });

    // ================= ITEMS =================
    builder
      .addCase(fetchQuoteItems.pending, (state) => {
        state.itemsLoading = true;
        state.itemsError = null;
      })
      .addCase(fetchQuoteItems.fulfilled, (state, action) => {
        state.itemsLoading = false;
        state.items = action.payload.results;
      })
      .addCase(fetchQuoteItems.rejected, (state, action) => {
        state.itemsLoading = false;
        state.itemsError = action.error.message ?? "Error obteniendo items";
      });

    builder.addCase(createQuoteItem.fulfilled, (state, action) => {
      state.items.push(action.payload);
    });

    builder.addCase(updateQuoteItem.fulfilled, (state, action) => {
      state.items = state.items.map((i) =>
        i.id === action.payload.id ? action.payload : i
      );
    });

    builder.addCase(deleteQuoteItem.fulfilled, (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
    });
    // ================= TYPES =================
    builder
      .addCase(fetchQuoteTypes.pending, (state) => {
        state.typesLoading = true;
        state.typesError = null;
      })
      .addCase(fetchQuoteTypes.fulfilled, (state, action) => {
        state.typesLoading = false;
        state.types = action.payload.results;
      })
      .addCase(fetchQuoteTypes.rejected, (state, action) => {
        state.typesLoading = false;
        state.typesError =
          action.error.message ?? "Error obteniendo tipos de cotización";
      });

    builder.addCase(createQuoteType.fulfilled, (state, action) => {
      state.types.push(action.payload);
    });

    builder.addCase(updateQuoteType.fulfilled, (state, action) => {
      state.types = state.types.map((t) =>
        t.id === action.payload.id ? action.payload : t
      );
    });

    builder.addCase(deleteQuoteType.fulfilled, (state, action) => {
      state.types = state.types.filter((t) => t.id !== action.payload);
    });
    // ================= STATES =================
    builder
      .addCase(fetchQuoteStates.pending, (state) => {
        state.statesLoading = true;
        state.statesError = null;
      })
      .addCase(fetchQuoteStates.fulfilled, (state, action) => {
        state.statesLoading = false;
        state.states = action.payload.results;
      })
      .addCase(fetchQuoteStates.rejected, (state, action) => {
        state.statesLoading = false;
        state.statesError = action.error.message ?? "Error obteniendo estados";
      });

    builder.addCase(createQuoteState.fulfilled, (state, action) => {
      state.states.push(action.payload);
    });

    builder.addCase(updateQuoteState.fulfilled, (state, action) => {
      state.states = state.states.map((s) =>
        s.id === action.payload.id ? action.payload : s
      );
    });

    builder.addCase(deleteQuoteState.fulfilled, (state, action) => {
      state.states = state.states.filter((s) => s.id !== action.payload);
    });
  },
});
export const { clearSelected } = quotesSlice.actions;
export default quotesSlice.reducer;
