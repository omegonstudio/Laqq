// store/productSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  Product,
  ProductCreateRequest,
  ProductUpdateRequest,
} from "@/types/types";
import { productsApi } from "@/lib/api/products";

interface FetchProductsParams {
  page?: number;
  page_size?: number;
}

// ============================================
// ASYNC THUNKS
// ============================================
export const fetchAllProducts = createAsyncThunk(
  "products/fetchAllRecursive",
  async (_, { rejectWithValue }) => {
    try {
      const allProducts: Product[] = [];
      let page = 1;
      const pageSize = 100; // tamaño de página grande para menos requests
      let hasMore = true;

      while (hasMore) {
        const response = await productsApi.list({
          page,
          page_size: pageSize,
        });

        allProducts.push(...response.results);

        // Si ya no hay más páginas, salir del loop
        hasMore = response.next !== null;
        page++;
      }

      return {
        results: allProducts,
        count: allProducts.length,
      };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);
export const fetchProducts = createAsyncThunk(
  "products/fetchAll",
  async (params?: FetchProductsParams) => {
    return productsApi.list(params);
  }
);

export const fetchProduct = createAsyncThunk(
  "products/fetchProduct",
  async (id: string) => {
    return productsApi.retrieve(id);
  }
);

export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (data: ProductCreateRequest) => {
    return productsApi.create(data);
  }
);

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, data }: { id: string; data: ProductUpdateRequest }) => {
    return productsApi.update(id, data);
  }
);

export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (id: string) => {
    await productsApi.delete(id);
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
  allLoaded: boolean;
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
  allLoaded: false,

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
    // FETCH ALL (recursivo - para search y filtros)
    builder
      .addCase(fetchAllProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.allLoaded = false;
      })
      .addCase(fetchAllProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.results;
        state.count = action.payload.count;
        state.allLoaded = true;
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Error obteniendo todos los productos";
        state.allLoaded = false;
      });
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
