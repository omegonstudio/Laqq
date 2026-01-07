import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { PaginatedResponse, ProductSpec } from "@/types/types";
import { productsApi } from "@/lib/api/products";

export const fetchSpecs = createAsyncThunk(
  "specs/fetchAll",
  async (params?: fetchSpecsParams) => {
    return productsApi.listSpecs(params);
  }
);

export const fetchSpec = createAsyncThunk(
  "specs/fetchSpecs",
  async (id: string) => {
    return productsApi.retrieveSpec(id);
  }
);

export const createSpec = createAsyncThunk(
  "specs/createSpec",
  async (data: Partial<ProductSpec>) => {
    return productsApi.createSpec(data);
  }
);

export const updateSpec = createAsyncThunk(
  "specs/updateSpec",
  async ({ id, data }: { id: string; data: Partial<ProductSpec> }) => {
    return productsApi.updateSpec(id, data);
  }
);

export const deleteSpec = createAsyncThunk(
  "specs/deleteSpec",
  async (id: string) => {
    await productsApi.deleteSpec(id);
    return id; // o un boolean si querés
  }
);

interface fetchSpecsParams {
  page?: number;
  page_size?: number;
}

interface SpecsState {
  list: ProductSpec[];
  count: number;
  loading: boolean;
  error: string | null;

  selected: ProductSpec | null;
  selectedLoading: boolean;
  selectedError: string | null;

  creating: boolean;
  createError: string | null;
  createdItem: ProductSpec | null;

  updating: boolean;
  updateError: string | null;
  updatedItem: ProductSpec | null;

  deleting: boolean;
  deleteError: string | null;
  deleteSuccess: boolean;
}

const initialState: SpecsState = {
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

export const specsSlice = createSlice({
  name: "specs",
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
      .addCase(fetchSpecs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchSpecs.fulfilled,
        (state, action: PayloadAction<PaginatedResponse<ProductSpec>>) => {
          state.loading = false;
          state.list = action.payload.results;
          state.count = action.payload.count;
        }
      )
      .addCase(fetchSpecs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error obteniendo especificación";
      });

    // GET ONE
    builder
      .addCase(fetchSpec.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchSpec.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchSpec.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError =
          action.error.message || "Error obteniendo el especificación";
      });

    // CREATE
    builder
      .addCase(createSpec.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createSpec.fulfilled, (state, action) => {
        state.creating = false;
        state.createdItem = action.payload;
        state.list.unshift(action.payload); // opcional
      })
      .addCase(createSpec.rejected, (state, action) => {
        state.creating = false;
        state.createError =
          action.error.message || "Error creando especificación";
      });

    // UPDATE
    builder
      .addCase(updateSpec.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateSpec.fulfilled, (state, action) => {
        state.updating = false;
        state.updatedItem = action.payload;

        // actualizar en la lista
        state.list = state.list.map((p) =>
          p.id === action.payload.id ? action.payload : p
        );
      })
      .addCase(updateSpec.rejected, (state, action) => {
        state.updating = false;
        state.updateError =
          action.error.message || "Error actualizando especificación";
      });

    // DELETE
    builder
      .addCase(deleteSpec.pending, (state) => {
        state.deleting = true;
        state.deleteError = null;
      })
      .addCase(deleteSpec.fulfilled, (state, action) => {
        state.deleting = false;
        state.deleteSuccess = true;
      })
      .addCase(deleteSpec.rejected, (state, action) => {
        state.deleting = false;
        state.deleteError =
          action.error.message || "Error eliminando especificación";
      });
  },
});

export const { resetCreate, resetUpdate, resetDelete } = specsSlice.actions;

export default specsSlice.reducer;
