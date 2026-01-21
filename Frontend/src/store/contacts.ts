import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { contactQuote, PaginatedResponse } from "@/types/api";
import { contactsApi } from "@/lib/api/contacts";

// Params (paginación)
interface FetchCategoriesParams {
  page?: number;
  page_size?: number;
}

interface CategoriesState {
  list: contactQuote[];
  count: number;
  loading: boolean;
  error: string | null;

  selected: contactQuote | null;
  selectedLoading: boolean;
  selectedError: string | null;

  creating: boolean;
  createError: string | null;
  createdItem: contactQuote | null;

  updating: boolean;
  updateError: string | null;
  updatedItem: contactQuote | null;

  deleting: boolean;
  deleteError: string | null;
  deleteSuccess: boolean;
}

const initialState: CategoriesState = {
  list: [],
  count: 0,
  loading: false,
  error: null,

  selected: null,
  selectedLoading: false,
  selectedError: null,

  creating: false,
  createError: null,
  createdItem: null,

  updating: false,
  updateError: null,
  updatedItem: null,

  deleting: false,
  deleteError: null,
  deleteSuccess: false,
};

// ---- THUNKS ----

export const fetchContacts = createAsyncThunk(
  "categories/fetch",
  async (params?: FetchCategoriesParams) => {
    return contactsApi.list(params);
  }
);

export const fetchcontactQuote = createAsyncThunk(
  "categories/fetchOne",
  async (id: string) => {
    return contactsApi.get(id);
  }
);

export const createcontactQuote = createAsyncThunk(
  "categories/create",
  async (data: Partial<contactQuote>) => {
    return contactsApi.create(data);
  }
);

export const updatecontactQuote = createAsyncThunk(
  "categories/update",
  async ({ id, data }: { id: string; data: Partial<contactQuote> }) => {
    return contactsApi.update(id, data);
  }
);

export const deletecontactQuote = createAsyncThunk(
  "categories/delete",
  async (id: string) => {
    await contactsApi.remove(id);
    return id;
  }
);

// ---- SLICE ----

export const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    resetCreate(state) {
      state.createdItem = null;
      state.createError = null;
    },
    resetUpdate(state) {
      state.updatedItem = null;
      state.updateError = null;
    },
    resetDelete(state) {
      state.deleteSuccess = false;
      state.deleteError = null;
    },
  },
  extraReducers: (builder) => {
    // LIST
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchContacts.fulfilled,
        (state, action: PayloadAction<PaginatedResponse<contactQuote>>) => {
          state.loading = false;
          state.list = action.payload.results;
          state.count = action.payload.count;
        }
      )
      .addCase(fetchContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error cargando categorías";
      });

    // GET ONE
    builder
      .addCase(fetchcontactQuote.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchcontactQuote.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchcontactQuote.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError =
          action.error.message || "Error cargando categoría";
      });

    // CREATE
    builder
      .addCase(createcontactQuote.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createcontactQuote.fulfilled, (state, action) => {
        state.creating = false;
        state.createdItem = action.payload;
        state.list.unshift(action.payload);
      })
      .addCase(createcontactQuote.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.error.message || "Error creando categoría";
      });

    // UPDATE
    builder
      .addCase(updatecontactQuote.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updatecontactQuote.fulfilled, (state, action) => {
        state.updating = false;
        state.updatedItem = action.payload;

        state.list = state.list.map((c) =>
          c.id === action.payload.id ? action.payload : c
        );
      })
      .addCase(updatecontactQuote.rejected, (state, action) => {
        state.updating = false;
        state.updateError =
          action.error.message || "Error actualizando categoría";
      });

    // DELETE
    builder
      .addCase(deletecontactQuote.pending, (state) => {
        state.deleting = true;
        state.deleteError = null;
      })
      .addCase(deletecontactQuote.fulfilled, (state, action) => {
        state.deleting = false;
        state.deleteSuccess = true;

        // remover de la lista
        state.list = state.list.filter((c) => c.id !== action.payload);
      })
      .addCase(deletecontactQuote.rejected, (state, action) => {
        state.deleting = false;
        state.deleteError =
          action.error.message || "Error eliminando categoría";
      });
  },
});

export const { resetCreate, resetUpdate, resetDelete } =
  categoriesSlice.actions;

export default categoriesSlice.reducer;
