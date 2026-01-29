import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Category, PaginatedResponse } from "@/types/types";
import { usersApi } from "@/lib/api/users";
import { User, UserCreate } from "@/types/api";

// Params (paginación)
interface FetchuserParams {
  page?: number;
  page_size?: number;
}
interface userState {
  list: User[];
  count: number;
  loading: boolean;
  error: string | null;

  selected: User | null;
  selectedLoading: boolean;
  selectedError: string | null;

  creating: boolean;
  createError: string | null;
  createdItem: User | null;

  updating: boolean;
  updateError: string | null;
  updatedItem: User | null;

  deleting: boolean;
  deleteError: string | null;
  deleteSuccess: boolean;
}

const initialState: userState = {
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

export const fetchUsers = createAsyncThunk(
  "user/fetch",
  async (params?: FetchuserParams) => {
    return usersApi.list(params);
  }
);

export const fetchUser = createAsyncThunk(
  "user/fetchOne",
  async (id: string) => {
    return usersApi.get(id);
  }
);

export const createUser = createAsyncThunk(
  "user/create",
  async (data: UserCreate) => {
    return usersApi.create(data);
  }
);

export const updateUser = createAsyncThunk(
  "user/update",
  async ({ id, data }: { id: string; data: Partial<UserCreate> }) => {
    return usersApi.update(id, data);
  }
);

export const deleteUser = createAsyncThunk(
  "user/delete",
  async (id: string) => {
    await usersApi.remove(id);
    return id;
  }
);

// ---- SLICE ----

export const userSlice = createSlice({
  name: "user",
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
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.results;
        state.count = action.payload.count;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error cargando usuarios";
      });

    // GET ONE
    builder
      .addCase(fetchUser.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError = action.error.message || "Error cargando usuario";
      });

    // CREATE
    builder
      .addCase(createUser.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.creating = false;
        state.createdItem = action.payload;
        state.list.unshift(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.error.message || "Error creando usuario";
      });

    // UPDATE
    builder
      .addCase(updateUser.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.updating = false;
        state.updatedItem = action.payload;

        state.list = state.list.map((u) =>
          u.id === action.payload.id ? action.payload : u
        );
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.updating = false;
        state.updateError =
          action.error.message || "Error actualizando usuario";
      });

    // DELETE
    builder
      .addCase(deleteUser.pending, (state) => {
        state.deleting = true;
        state.deleteError = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.deleting = false;
        state.deleteSuccess = true;
        state.list = state.list.filter((u) => u.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.deleting = false;
        state.deleteError = action.error.message || "Error eliminando usuario";
      });
  },
});

export const { resetCreate, resetUpdate, resetDelete } = userSlice.actions;

export default userSlice.reducer;
