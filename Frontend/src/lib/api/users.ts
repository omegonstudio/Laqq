import { api } from "./client";
import { cleanParams, QueryParams } from "./utils";
import {
  PaginatedResponse,
  TokenObtainPair,
  TokenRefresh,
  User,
  UserCreate,
  UserState,
  UserType,
} from "@/types/api";

const BASE = "/users";

export interface UserListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  user_type?: string;
  state?: string;
  is_active?: boolean;
}

export const usersApi = {
  list: (params?: UserListParams) =>
    api.get<PaginatedResponse<User>>(
      `${BASE}/list/`,
      cleanParams(params as QueryParams)
    ),
  get: (id: string) => api.get<User>(`${BASE}/list/${id}/`),
  create: (payload: UserCreate) => api.post<User>(`${BASE}/list/`, payload),
  update: (id: string, payload: Partial<UserCreate>) =>
    api.put<User>(`${BASE}/list/${id}/`, payload),
  patch: (id: string, payload: Partial<UserCreate>) =>
    api.patch<User>(`${BASE}/list/${id}/`, payload),
  remove: (id: string) => api.delete<void>(`${BASE}/list/${id}/`),

  listTypes: (params?: { search?: string }) =>
    api.get<PaginatedResponse<UserType>>(
      `${BASE}/types/`,
      cleanParams(params as QueryParams)
    ),
  getType: (id: string) => api.get<UserType>(`${BASE}/types/${id}/`),
  createType: (payload: Partial<UserType>) =>
    api.post<UserType>(`${BASE}/types/`, payload),
  updateType: (id: string, payload: Partial<UserType>) =>
    api.put<UserType>(`${BASE}/types/${id}/`, payload),
  patchType: (id: string, payload: Partial<UserType>) =>
    api.patch<UserType>(`${BASE}/types/${id}/`, payload),
  removeType: (id: string) => api.delete<void>(`${BASE}/types/${id}/`),

  listStates: (params?: { search?: string }) =>
    api.get<PaginatedResponse<UserState>>(
      `${BASE}/states/`,
      cleanParams(params as QueryParams)
    ),
  getState: (id: string) => api.get<UserState>(`${BASE}/states/${id}/`),
  createState: (payload: Partial<UserState>) =>
    api.post<UserState>(`${BASE}/states/`, payload),
  updateState: (id: string, payload: Partial<UserState>) =>
    api.put<UserState>(`${BASE}/states/${id}/`, payload),
  patchState: (id: string, payload: Partial<UserState>) =>
    api.patch<UserState>(`${BASE}/states/${id}/`, payload),
  removeState: (id: string) => api.delete<void>(`${BASE}/states/${id}/`),

  obtainToken: (payload: { username: string; password: string }) =>
    api.post<TokenObtainPair>(`${BASE}/token/`, payload),
  refreshToken: (payload: { refresh: string }) =>
    api.post<TokenRefresh>(`${BASE}/token/refresh/`, payload),
};

