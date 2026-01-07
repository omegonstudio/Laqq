import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Brand, PaginatedResponse } from "@/types/types";
import { productsApi } from "@/lib/api/products";

interface FetchBrandsParams {
  page?: number;
  page_size?: number;
}

interface BrandsState {
  list: Brand[];
  count: number;
  loading: boolean;
  error: string | null;

  selected: Brand | null;
  selectedLoading: boolean;
  selectedError: string | null;

  creating: boolean;
  createError: string | null;
  createdItem: Brand | null;

  updating: boolean;
  updateError: string | null;
  updatedItem: Brand | null;

  deleting: boolean;
  deleteError: string | null;
  deleteSuccess: boolean;
}

const initialState: BrandsState = {
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

export const fetchBrands = createAsyncThunk(
  "brands/fetch",
  async (params: FetchBrandsParams) => {
    return productsApi.listBrands(params);
  }
);

export const fetchBrand = createAsyncThunk(
  "brands/fetchOne",
  async (id: string) => {
    return productsApi.retrieveBrand(id);
  }
);

export const createBrand = createAsyncThunk(
  "brands/create",
  async (data: Partial<Brand>) => {
    return productsApi.createBrand(data);
  }
);

export const updateBrand = createAsyncThunk(
  "brands/update",
  async ({ id, data }: { id: string; data: Partial<Brand> }) => {
    return productsApi.updateBrand(id, data);
  }
);

export const deleteBrand = createAsyncThunk(
  "brands/delete",
  async (id: string) => {
    await productsApi.deleteBrand(id);
    return id;
  }
);

// ---- SLICE ----

export const brandsSlice = createSlice({
  name: "brands",
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
      .addCase(fetchBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchBrands.fulfilled,
        (state, action: PayloadAction<PaginatedResponse<Brand>>) => {
          state.loading = false;
          state.list = action.payload.results;
          state.count = action.payload.count;
        }
      )
      .addCase(fetchBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error cargando marcas";
      });

    // GET ONE
    builder
      .addCase(fetchBrand.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchBrand.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchBrand.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError = action.error.message || "Error cargando marca";
      });

    // CREATE
    builder
      .addCase(createBrand.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createBrand.fulfilled, (state, action) => {
        state.creating = false;
        state.createdItem = action.payload;
        state.list.unshift(action.payload);
      })
      .addCase(createBrand.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.error.message || "Error creando marca";
      });

    // UPDATE
    builder
      .addCase(updateBrand.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateBrand.fulfilled, (state, action) => {
        state.updating = false;
        state.updatedItem = action.payload;

        state.list = state.list.map((b) =>
          b.id === action.payload.id ? action.payload : b
        );
      })
      .addCase(updateBrand.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.error.message || "Error actualizando marca";
      });

    // DELETE
    builder
      .addCase(deleteBrand.pending, (state) => {
        state.deleting = true;
        state.deleteError = null;
      })
      .addCase(deleteBrand.fulfilled, (state, action) => {
        state.deleting = false;
        state.deleteSuccess = true;

        state.list = state.list.filter((b) => b.id !== action.payload);
      })
      .addCase(deleteBrand.rejected, (state, action) => {
        state.deleting = false;
        state.deleteError = action.error.message || "Error eliminando marca";
      });
  },
});

export const { resetCreate, resetUpdate, resetDelete } = brandsSlice.actions;

export default brandsSlice.reducer;
