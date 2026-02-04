import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Category, PaginatedResponse } from "@/types/types";
import { productsApi } from "@/lib/api/products";

// Params (paginación)
interface FetchCategoriesParams {
  page?: number;
  page_size?: number;
}

interface CategoriesState {
  list: Category[];
  count: number;
  loading: boolean;
  error: string | null;

  selected: Category | null;
  selectedLoading: boolean;
  selectedError: string | null;

  creating: boolean;
  createError: string | null;
  createdItem: Category | null;

  updating: boolean;
  updateError: string | null;
  updatedItem: Category | null;

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

export const fetchAllCategories = createAsyncThunk(
  "brands/fetchAllCategories",
  async (_, { rejectWithValue }) => {
    try {
      const allCategories: Category[] = [];
      let page = 1;
      const pageSize = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await productsApi.listCategories({
          page,
          page_size: pageSize,
        });

        allCategories.push(...response.results);
        hasMore = response.next !== null;
        page++;
      }
      return {
        results: allCategories,
        count: allCategories.length,
        next: null,
        previous: null,
        page_size: allCategories.length,
        current_page: 1,
        total_pages: 1,
      };
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);
export const fetchCategories = createAsyncThunk(
  "categories/fetch",
  async (params?: FetchCategoriesParams) => {
    return productsApi.listCategories(params);
  }
);

export const fetchCategory = createAsyncThunk(
  "categories/fetchOne",
  async (id: string) => {
    return productsApi.retrieveCategory(id);
  }
);

export const createCategory = createAsyncThunk(
  "categories/create",
  async (data: Partial<Category>) => {
    return productsApi.createCategory(data);
  }
);

export const updateCategory = createAsyncThunk(
  "categories/update",
  async ({ id, data }: { id: string; data: Partial<Category> }) => {
    return productsApi.updateCategory(id, data);
  }
);

export const deleteCategory = createAsyncThunk(
  "categories/delete",
  async (id: string) => {
    await productsApi.deleteCategory(id);
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
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCategories.fulfilled,
        (state, action: PayloadAction<PaginatedResponse<Category>>) => {
          state.loading = false;
          state.list = action.payload.results;
          state.count = action.payload.count;
        }
      )
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error cargando categorías";
      });

    // GET ONE
    builder
      .addCase(fetchCategory.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchCategory.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchCategory.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError =
          action.error.message || "Error cargando categoría";
      });
    builder.addCase(fetchAllCategories.fulfilled, (state, action) => {
      state.loading = false;
      state.list = action.payload.results;
      state.count = action.payload.count;
    });

    // CREATE
    builder
      .addCase(createCategory.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.creating = false;
        state.createdItem = action.payload;
        state.list.unshift(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.error.message || "Error creando categoría";
      });

    // UPDATE
    builder
      .addCase(updateCategory.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.updating = false;
        state.updatedItem = action.payload;

        state.list = state.list.map((c) =>
          c.id === action.payload.id ? action.payload : c
        );
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.updating = false;
        state.updateError =
          action.error.message || "Error actualizando categoría";
      });

    // DELETE
    builder
      .addCase(deleteCategory.pending, (state) => {
        state.deleting = true;
        state.deleteError = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.deleting = false;
        state.deleteSuccess = true;

        // remover de la lista
        state.list = state.list.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.deleting = false;
        state.deleteError =
          action.error.message || "Error eliminando categoría";
      });
  },
});

export const { resetCreate, resetUpdate, resetDelete } =
  categoriesSlice.actions;

export default categoriesSlice.reducer;
