import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi, UserListParams } from "@/lib/api/users";
import { NormalizedApiError } from "@/lib/api/client";
import {
  PaginatedResponse,
  TokenObtainPair,
  TokenRefresh,
  User,
  UserCreate,
  UserState,
  UserType,
} from "@/types/api";

const usersListKey = (params?: UserListParams) => ["users", "list", params];
const userDetailKey = (id?: string) => ["users", "detail", id];
const userTypesKey = ["users", "types"];
const userTypeDetailKey = (id?: string) => ["users", "types", "detail", id];
const userStatesKey = ["users", "states"];
const userStateDetailKey = (id?: string) => ["users", "states", "detail", id];

export const useUsersList = (params?: UserListParams) =>
  useQuery<PaginatedResponse<User>, NormalizedApiError>({
    queryKey: usersListKey(params),
    queryFn: () => usersApi.list(params),
    placeholderData: (prev) => prev,
  });

export const useUser = (id?: string) =>
  useQuery<User, NormalizedApiError>({
    queryKey: userDetailKey(id),
    queryFn: () => usersApi.get(id as string),
    enabled: Boolean(id),
  });

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<User, NormalizedApiError, UserCreate>({
    mutationFn: (payload) => usersApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.setQueryData(userDetailKey(data.id), data);
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<
    User,
    NormalizedApiError,
    { id: string; payload: Partial<UserCreate> }
  >({
    mutationFn: ({ id, payload }) => usersApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.setQueryData(userDetailKey(data.id), data);
    },
  });
};

export const usePatchUser = () => {
  const queryClient = useQueryClient();

  return useMutation<
    User,
    NormalizedApiError,
    { id: string; payload: Partial<UserCreate> }
  >({
    mutationFn: ({ id, payload }) => usersApi.patch(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.setQueryData(userDetailKey(data.id), data);
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => usersApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.removeQueries({ queryKey: userDetailKey(id) });
    },
  });
};

// Types
export const useUserTypes = () =>
  useQuery<PaginatedResponse<UserType>, NormalizedApiError>({
    queryKey: userTypesKey,
    queryFn: () => usersApi.listTypes(),
    placeholderData: (prev) => prev,
  });

export const useUserType = (id?: string) =>
  useQuery<UserType, NormalizedApiError>({
    queryKey: userTypeDetailKey(id),
    queryFn: () => usersApi.getType(id as string),
    enabled: Boolean(id),
  });

export const useCreateUserType = () => {
  const queryClient = useQueryClient();

  return useMutation<UserType, NormalizedApiError, Partial<UserType>>({
    mutationFn: (payload) => usersApi.createType(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users", "types"] });
      queryClient.setQueryData(userTypeDetailKey(data.id), data);
    },
  });
};

export const useUpdateUserType = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UserType,
    NormalizedApiError,
    { id: string; payload: Partial<UserType> }
  >({
    mutationFn: ({ id, payload }) => usersApi.updateType(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users", "types"] });
      queryClient.setQueryData(userTypeDetailKey(data.id), data);
    },
  });
};

export const usePatchUserType = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UserType,
    NormalizedApiError,
    { id: string; payload: Partial<UserType> }
  >({
    mutationFn: ({ id, payload }) => usersApi.patchType(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users", "types"] });
      queryClient.setQueryData(userTypeDetailKey(data.id), data);
    },
  });
};

export const useDeleteUserType = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => usersApi.removeType(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["users", "types"] });
      queryClient.removeQueries({ queryKey: userTypeDetailKey(id) });
    },
  });
};

// States
export const useUserStates = () =>
  useQuery<PaginatedResponse<UserState>, NormalizedApiError>({
    queryKey: userStatesKey,
    queryFn: () => usersApi.listStates(),
    placeholderData: (prev) => prev,
  });

export const useUserState = (id?: string) =>
  useQuery<UserState, NormalizedApiError>({
    queryKey: userStateDetailKey(id),
    queryFn: () => usersApi.getState(id as string),
    enabled: Boolean(id),
  });

export const useCreateUserState = () => {
  const queryClient = useQueryClient();

  return useMutation<UserState, NormalizedApiError, Partial<UserState>>({
    mutationFn: (payload) => usersApi.createState(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users", "states"] });
      queryClient.setQueryData(userStateDetailKey(data.id), data);
    },
  });
};

export const useUpdateUserState = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UserState,
    NormalizedApiError,
    { id: string; payload: Partial<UserState> }
  >({
    mutationFn: ({ id, payload }) => usersApi.updateState(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users", "states"] });
      queryClient.setQueryData(userStateDetailKey(data.id), data);
    },
  });
};

export const usePatchUserState = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UserState,
    NormalizedApiError,
    { id: string; payload: Partial<UserState> }
  >({
    mutationFn: ({ id, payload }) => usersApi.patchState(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users", "states"] });
      queryClient.setQueryData(userStateDetailKey(data.id), data);
    },
  });
};

export const useDeleteUserState = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => usersApi.removeState(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["users", "states"] });
      queryClient.removeQueries({ queryKey: userStateDetailKey(id) });
    },
  });
};

// Auth token helpers
export const useObtainToken = () =>
  useMutation<TokenObtainPair, NormalizedApiError, { username: string; password: string }>({
    mutationFn: (payload) => usersApi.obtainToken(payload),
  });

export const useRefreshToken = () =>
  useMutation<TokenRefresh, NormalizedApiError, { refresh: string }>({
    mutationFn: (payload) => usersApi.refreshToken(payload),
  });

