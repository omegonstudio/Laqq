// store/productSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  Product,
  ProductCreateRequest,
  ProductUpdateRequest,
} from "@/types/types";
import { apiClient } from "@/api/client";

interface PaginatedResponse<T> {
  results: T[];
  count: number;
}

interface FetchProductsParams {
  page?: number;
  page_size?: number;
}

// ============================================
// ASYNC THUNKS
// ============================================

export const fetchProducts = createAsyncThunk(
  "products/fetchAll",
  async (params?: FetchProductsParams) => {
    const res = await apiClient.get<PaginatedResponse<Product>>(
      "/products/list/",
      params
    );
    return res;
  }
);

export const fetchProduct = createAsyncThunk(
  "products/fetchProduct",
  async (id: string) => {
    const response = await apiClient.get<Product>(`/products/list/${id}`);
    console.log(response, "aaa response");
    return response;
  }
);

export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (data: ProductCreateRequest) => {
    const response = await apiClient.post<Product>("/products/list/", data);
    return response;
  }
);

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, data }: { id: string; data: ProductUpdateRequest }) => {
    const response = await apiClient.patch<Product>(
      `/products/list/${id}/`,
      data
    );
    return response;
  }
);

export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (id: string) => {
    await apiClient.delete(`/products/list/${id}/`);
    return id;
  }
);

// ============================================
// STATE
// ============================================

interface ProductsState {
  list: Product[];
  count: number;
  loading: boolean;
  error: string | null;

  selected: Product | null;
  selectedLoading: boolean;
  selectedError: string | null;

  creating: boolean;
  createError: string | null;

  updating: boolean;
  updateError: string | null;

  deleting: boolean;
  deleteError: string | null;
}

const initialState: ProductsState = {
  list: [],
  count: 0,
  loading: false,
  error: null,

  selected: null,
  selectedLoading: false,
  selectedError: null,

  creating: false,
  createError: null,

  updating: false,
  updateError: null,

  deleting: false,
  deleteError: null,
};

// ============================================
// SLICE
// ============================================

export const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    resetCreate(state) {
      state.createError = null;
    },
    resetUpdate(state) {
      state.updateError = null;
    },
    resetDelete(state) {
      state.deleteError = null;
    },
    clearSelected(state) {
      state.selected = null;
      state.selectedError = null;
    },
  },
  extraReducers: (builder) => {
    // FETCH LIST
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.results;
        state.count = action.payload.count;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error obteniendo productos";
      });

    // FETCH ONE
    builder
      .addCase(fetchProduct.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError =
          action.error.message || "Error obteniendo producto";
      });

    // CREATE
    builder
      .addCase(createProduct.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.creating = false;
        state.list.unshift(action.payload);
        state.count += 1;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.error.message || "Error creando producto";
      });

    // UPDATE
    builder
      .addCase(updateProduct.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.updating = false;

        // Actualizar en la lista
        state.list = state.list.map((p) =>
          p.id === action.payload.id ? action.payload : p
        );

        // Actualizar selected si es el mismo
        if (state.selected?.id === action.payload.id) {
          state.selected = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.updating = false;
        state.updateError =
          action.error.message || "Error actualizando producto";
      });

    // DELETE
    builder
      .addCase(deleteProduct.pending, (state) => {
        state.deleting = true;
        state.deleteError = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.deleting = false;
        state.list = state.list.filter((p) => p.id !== action.payload);
        state.count -= 1;

        if (state.selected?.id === action.payload) {
          state.selected = null;
        }
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.deleting = false;
        state.deleteError = action.error.message || "Error eliminando producto";
      });
  },
});

export const { resetCreate, resetUpdate, resetDelete, clearSelected } =
  productsSlice.actions;

export default productsSlice.reducer;
