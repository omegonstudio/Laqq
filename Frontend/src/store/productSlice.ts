import { productsApi } from "@/lib/api/products";
import {
  Product,
  ProductCreateRequest,
  ProductUpdateRequest,
  PaginationInfo,
} from "@/types/types";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

interface FetchProductsParams {
  page?: number;
  page_size?: number;
  search?: string;
  brand?: string;
  category?: string;
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
      const pageSize = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await productsApi.list({
          page,
          page_size: pageSize,
        });

        allProducts.push(...response.results);
        hasMore = response.next !== null;
        page++;
      }

      return {
        results: allProducts,
        count: allProducts.length,
        next: null,
        previous: null,
        page_size: allProducts.length,
        current_page: 1,
        total_pages: 1,
      };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);
export const refreshProductEverywhere = createAsyncThunk(
  "products/refreshEverywhere",
  async (productId: string) => {
    console.log(productId, "AAA");
    // Siempre traemos el producto actualizado del backend
    return productsApi.retrieve(productId);
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
  pagination: PaginationInfo;
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

const initialPagination: PaginationInfo = {
  count: 0,
  next: null,
  previous: null,
  page_size: 20,
  current_page: 1,
  total_pages: 1,
};

const initialState: ProductsState = {
  list: [],
  pagination: initialPagination,
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
    resetPagination(state) {
      state.pagination = initialPagination;
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
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
          page_size: action.payload.page_size,
          current_page: action.payload.current_page,
          total_pages: action.payload.total_pages,
        };
        state.allLoaded = true;
      })
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Error obteniendo todos los productos";
        state.allLoaded = false;
      });
    builder.addCase(refreshProductEverywhere.fulfilled, (state, action) => {
      const updated = action.payload;

      // 1️⃣ Reemplazar en la lista principal
      state.list = state.list.map((p) => (p.id === updated.id ? updated : p));

      // 2️⃣ Reemplazar selected si aplica
      if (state.selected?.id === updated.id) {
        state.selected = updated;
      }

      // ⚠️ No tocamos pagination
      // ⚠️ No tocamos loading
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
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
          page_size: action.payload.page_size,
          current_page: action.payload.current_page,
          total_pages: action.payload.total_pages,
        };
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
        state.pagination.count += 1;
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
        state.pagination.count -= 1;

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

export const {
  resetCreate,
  resetUpdate,
  resetDelete,
  clearSelected,
  resetPagination,
} = productsSlice.actions;

export default productsSlice.reducer;
