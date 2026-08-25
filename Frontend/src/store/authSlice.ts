import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import CryptoJS from "crypto-js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Clave de encriptación (en producción, usa una variable de entorno)
const ENCRYPTION_KEY =
  import.meta.env.VITE_ENCRYPTION_KEY || "your-secret-key-change-in-production";

// Funciones de encriptación/desencriptación
const encryptToken = (token: string): string => {
  return CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString();
};

// Exportar para uso en otros módulos
export const decryptToken = (encryptedToken: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

interface AuthState {
  user: {
    username: string;
    is_superuser: boolean;
    is_staff: boolean;
    user_type_id: string | null;
  } | null;
  access: string | null;
  refresh: string | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  access: null,
  refresh: null,
  loading: false,
};

// ---- Login ----
export const loginThunk = createAsyncThunk(
  "auth/login",
  async (
    { username, password }: { username: string; password: string },
    thunkAPI
  ) => {
    try {
      const res = await fetch(`${BASE_URL}/users/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return thunkAPI.rejectWithValue(
          errorData.detail || "Credenciales incorrectas"
        );
      }

      const data = await res.json();

            // Encriptar tokens antes de guardarlos
      return {
        access: encryptToken(data.access),
        refresh: encryptToken(data.refresh),
        user: {
          username: username,
          is_staff: data.is_staff,
          is_superuser: data.is_superuser,
          user_type_id: data.user_type?.id ?? null,
        },
      };
    } catch (e) {
      return thunkAPI.rejectWithValue("Error de servidor");
    }
  }
);

// ---- Refresh Token ----
export const refreshThunk = createAsyncThunk(
  "auth/refresh",
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as { auth: AuthState };
      const encryptedRefresh = state.auth.refresh;

      if (!encryptedRefresh) {
        return thunkAPI.rejectWithValue("No hay refresh token");
      }

      // Desencriptar para enviarlo al servidor
      const refresh = decryptToken(encryptedRefresh);

      const res = await fetch(`${BASE_URL}/users/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (!res.ok) {
        return thunkAPI.rejectWithValue("No se pudo refrescar");
      }

      const data = await res.json();

      // Guardar el nuevo access token y, si el backend rota (ROTATE_REFRESH_TOKENS),
      // también el nuevo refresh, para no reutilizar el refresh ya rotado.
      return {
        access: encryptToken(data.access),
        refresh: data.refresh ? encryptToken(data.refresh) : undefined,
      };
    } catch {
      return thunkAPI.rejectWithValue("Error al refrescar");
    }
  }
);
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.access = null;
      state.refresh = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = {
          username: action.payload.user.username,
          is_superuser: action.payload.user.is_superuser,
          is_staff: action.payload.user.is_staff,
          user_type_id: action.payload.user.user_type_id,
        };
        state.access = action.payload.access; // Ya encriptado
        state.refresh = action.payload.refresh; // Ya encriptado
      })
      .addCase(loginThunk.rejected, (state) => {
        state.loading = false;
      })

      // REFRESH
      .addCase(refreshThunk.fulfilled, (state, action) => {
        state.access = action.payload.access; // Ya encriptado
        // Si el backend rotó el refresh (ROTATE_REFRESH_TOKENS=True),
        // actualizarlo, si no lo devuelve mantenemos el anterior.
        if (action.payload.refresh) {
          state.refresh = action.payload.refresh;
        }
      })
      .addCase(refreshThunk.rejected, (state) => {
        // Si falla el refresh, hacer logout
        state.user = null;
        state.access = null;
        state.refresh = null;
      });
  },
});

export const { logout } = authSlice.actions;

// Selector helper para obtener el access token desencriptado
export const selectDecryptedAccessToken = (state: {
  auth: AuthState;
}): string | null => {
  if (!state.auth.access) return null;
  try {
    return decryptToken(state.auth.access);
  } catch {
    return null;
  }
};

export default authSlice.reducer;
