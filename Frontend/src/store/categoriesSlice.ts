import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Category, PaginatedResponse } from "@/types/types";
import { productsApi } from "@/lib/api/products";

// Params (paginación)
interface FetchCategoriesParams {
  page?: number;
  page_size?: number;
}
interface FetchAllCategoriesOptions {
  retries?: number;
  retryDelayMs?: number;
  force?: boolean;
}

interface CategoriesState {
  list: Category[];
  count: number;
  loading: boolean;
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
  lastRequestId: string | null;

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
  status: "idle",
  error: null,
  lastRequestId: null,

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
  async (
    options: FetchAllCategoriesOptions | undefined,
    { rejectWithValue }
  ) => {
    const retries = options?.retries ?? 2;
    const retryDelayMs = options?.retryDelayMs ?? 300;

    const sleep = (ms: number) =>
      new Promise((resolve) => {
        setTimeout(resolve, ms);
      });

    try {
      const allCategories: Category[] = [];
      let page = 1;
      const pageSize = 100;
      let hasMore = true;
      const seenIds = new Set<string>();

      while (hasMore) {
        let attempt = 0;
        let response: Awaited<ReturnType<typeof productsApi.listCategories>> | null =
          null;

        while (attempt <= retries) {
          try {
            response = await productsApi.listCategories({
              page,
              page_size: pageSize,
            });
            break;
          } catch (error) {
            attempt += 1;
            if (attempt > retries) throw error;
            console.warn(
              `[categories] reintento ${attempt}/${retries} para página ${page}`
            );
            await sleep(retryDelayMs * attempt);
          }
        }

        if (!response) {
          throw new Error("No se pudo cargar la página de categorías");
        }

        response.results.forEach((category) => {
          if (!seenIds.has(category.id)) {
            allCategories.push(category);
            seenIds.add(category.id);
          }
        });

        if (!Array.isArray(response.results)) {
          console.warn("[categories] payload inválido en listCategories.results");
          break;
        }

        hasMore = response.next !== null;
        page++;
      }
      console.info(
        `[categories] cargadas ${allCategories.length} categorías (${page - 1} páginas)`
      );
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
  },
  {
    condition: (options, { getState }) => {
      const state = getState() as { categories: CategoriesState };
      if (options?.force) return true;
      if (state.categories.loading) return false;
      if (state.categories.status === "success" && state.categories.list.length > 0) {
        return false;
      }
      return true;
    },
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
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        fetchCategories.fulfilled,
        (state, action: PayloadAction<PaginatedResponse<Category>>) => {
          state.loading = false;
          state.status = "success";
          state.list = action.payload.results;
          state.count = action.payload.count;
        }
      )
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.status = "error";
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
    builder
      .addCase(fetchAllCategories.pending, (state, action) => {
        state.loading = true;
        state.status = "loading";
        state.error = null;
        state.lastRequestId = action.meta.requestId;
      })
      .addCase(fetchAllCategories.fulfilled, (state, action) => {
        if (state.lastRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.status = "success";
        state.list = action.payload.results;
        state.count = action.payload.count;
      })
      .addCase(fetchAllCategories.rejected, (state, action) => {
        if (state.lastRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.status = "error";
        state.error =
          (action.payload as { message?: string } | undefined)?.message ||
          action.error.message ||
          "Error cargando categorías";
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
