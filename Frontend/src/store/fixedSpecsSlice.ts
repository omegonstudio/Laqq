import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { PaginatedResponse, ProductFixedSpec } from "@/types/types";
import { productsApi } from "@/lib/api/products";

export const fetchFixedSpecs = createAsyncThunk(
  "specs/fetchAll",
  async (params?: fetchSpecsParams) => {
    return productsApi.listFixedSpecs(params);
  }
);

export const fetchFixedSpec = createAsyncThunk(
  "specs/fetchSpecs",
  async (id: string) => {
    return productsApi.retrieveFixedSpec(id);
  }
);

export const createFixedSpec = createAsyncThunk(
  "specs/createSpec",
  async (data: Partial<ProductFixedSpec>) => {
    return productsApi.createFixedSpec(data);
  }
);

export const updateFixedSpec = createAsyncThunk(
  "specs/updateSpec",
  async ({ id, data }: { id: string; data: Partial<ProductFixedSpec> }) => {
    return productsApi.updateFixedSpec(id, data);
  }
);

export const deleteFixedSpec = createAsyncThunk(
  "specs/deleteSpec",
  async (id: string) => {
    await productsApi.deleteFixedSpec(id);
    return id; // o un boolean si querés
  }
);

interface fetchSpecsParams {
  page?: number;
  page_size?: number;
}

interface SpecsState {
  list: ProductFixedSpec[];
  count: number;
  loading: boolean;
  error: string | null;

  selected: ProductFixedSpec | null;
  selectedLoading: boolean;
  selectedError: string | null;

  creating: boolean;
  createError: string | null;
  createdItem: ProductFixedSpec | null;

  updating: boolean;
  updateError: string | null;
  updatedItem: ProductFixedSpec | null;

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
      .addCase(fetchFixedSpecs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchFixedSpecs.fulfilled,
        (state, action: PayloadAction<PaginatedResponse<ProductFixedSpec>>) => {
          state.loading = false;
          state.list = action.payload.results;
          state.count = action.payload.count;
        }
      )
      .addCase(fetchFixedSpecs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error obteniendo especificación";
      });

    // GET ONE
    builder
      .addCase(fetchFixedSpec.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchFixedSpec.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchFixedSpec.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError =
          action.error.message || "Error obteniendo el especificación";
      });

    // CREATE
    builder
      .addCase(createFixedSpec.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createFixedSpec.fulfilled, (state, action) => {
        state.creating = false;
        state.createdItem = action.payload;
        state.list.unshift(action.payload); // opcional
      })
      .addCase(createFixedSpec.rejected, (state, action) => {
        state.creating = false;
        state.createError =
          action.error.message || "Error creando especificación";
      });

    // UPDATE
    builder
      .addCase(updateFixedSpec.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateFixedSpec.fulfilled, (state, action) => {
        state.updating = false;
        state.updatedItem = action.payload;

        // actualizar en la lista
        state.list = state.list.map((p) =>
          p.id === action.payload.id ? action.payload : p
        );
      })
      .addCase(updateFixedSpec.rejected, (state, action) => {
        state.updating = false;
        state.updateError =
          action.error.message || "Error actualizando especificación";
      });

    // DELETE
    builder
      .addCase(deleteFixedSpec.pending, (state) => {
        state.deleting = true;
        state.deleteError = null;
      })
      .addCase(deleteFixedSpec.fulfilled, (state, action) => {
        state.deleting = false;
        state.deleteSuccess = true;
      })
      .addCase(deleteFixedSpec.rejected, (state, action) => {
        state.deleting = false;
        state.deleteError =
          action.error.message || "Error eliminando especificación";
      });
  },
});

export const { resetCreate, resetUpdate, resetDelete } = specsSlice.actions;

export default specsSlice.reducer;
