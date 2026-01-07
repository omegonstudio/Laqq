import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notesApi, NoteListParams } from "@/lib/api/notes";
import { NormalizedApiError } from "@/lib/api/client";
import { Note, NoteState, NoteType, PaginatedResponse } from "@/types/api";

const notesListKey = (params?: NoteListParams) => ["notes", "list", params];
const noteDetailKey = (id?: string) => ["notes", "detail", id];
const noteStatesKey = ["notes", "states"];
const noteStateDetailKey = (id?: string) => ["notes", "states", "detail", id];
const noteTypesKey = ["notes", "types"];
const noteTypeDetailKey = (id?: string) => ["notes", "types", "detail", id];

export const useNotesList = (params?: NoteListParams) =>
  useQuery<PaginatedResponse<Note>, NormalizedApiError>({
    queryKey: notesListKey(params),
    queryFn: () => notesApi.list(params),
    placeholderData: (prev) => prev,
  });

export const useNote = (id?: string) =>
  useQuery<Note, NormalizedApiError>({
    queryKey: noteDetailKey(id),
    queryFn: () => notesApi.get(id as string),
    enabled: Boolean(id),
  });

export const useCreateNote = () => {
  const queryClient = useQueryClient();

  return useMutation<Note, NormalizedApiError, Partial<Note>>({
    mutationFn: (payload) => notesApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.setQueryData(noteDetailKey(data.id), data);
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Note,
    NormalizedApiError,
    { id: string; payload: Partial<Note> }
  >({
    mutationFn: ({ id, payload }) => notesApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.setQueryData(noteDetailKey(data.id), data);
    },
  });
};

export const usePatchNote = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Note,
    NormalizedApiError,
    { id: string; payload: Partial<Note> }
  >({
    mutationFn: ({ id, payload }) => notesApi.patch(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.setQueryData(noteDetailKey(data.id), data);
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => notesApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.removeQueries({ queryKey: noteDetailKey(id) });
    },
  });
};

// States
export const useNoteStates = () =>
  useQuery<PaginatedResponse<NoteState>, NormalizedApiError>({
    queryKey: noteStatesKey,
    queryFn: () => notesApi.listStates(),
    placeholderData: (prev) => prev,
  });

export const useNoteState = (id?: string) =>
  useQuery<NoteState, NormalizedApiError>({
    queryKey: noteStateDetailKey(id),
    queryFn: () => notesApi.getState(id as string),
    enabled: Boolean(id),
  });

export const useCreateNoteState = () => {
  const queryClient = useQueryClient();

  return useMutation<NoteState, NormalizedApiError, Partial<NoteState>>({
    mutationFn: (payload) => notesApi.createState(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes", "states"] });
      queryClient.setQueryData(noteStateDetailKey(data.id), data);
    },
  });
};

export const useUpdateNoteState = () => {
  const queryClient = useQueryClient();

  return useMutation<
    NoteState,
    NormalizedApiError,
    { id: string; payload: Partial<NoteState> }
  >({
    mutationFn: ({ id, payload }) => notesApi.updateState(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes", "states"] });
      queryClient.setQueryData(noteStateDetailKey(data.id), data);
    },
  });
};

export const usePatchNoteState = () => {
  const queryClient = useQueryClient();

  return useMutation<
    NoteState,
    NormalizedApiError,
    { id: string; payload: Partial<NoteState> }
  >({
    mutationFn: ({ id, payload }) => notesApi.patchState(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes", "states"] });
      queryClient.setQueryData(noteStateDetailKey(data.id), data);
    },
  });
};

export const useDeleteNoteState = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => notesApi.removeState(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["notes", "states"] });
      queryClient.removeQueries({ queryKey: noteStateDetailKey(id) });
    },
  });
};

// Types
export const useNoteTypes = () =>
  useQuery<PaginatedResponse<NoteType>, NormalizedApiError>({
    queryKey: noteTypesKey,
    queryFn: () => notesApi.listTypes(),
    placeholderData: (prev) => prev,
  });

export const useNoteType = (id?: string) =>
  useQuery<NoteType, NormalizedApiError>({
    queryKey: noteTypeDetailKey(id),
    queryFn: () => notesApi.getType(id as string),
    enabled: Boolean(id),
  });

export const useCreateNoteType = () => {
  const queryClient = useQueryClient();

  return useMutation<NoteType, NormalizedApiError, Partial<NoteType>>({
    mutationFn: (payload) => notesApi.createType(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes", "types"] });
      queryClient.setQueryData(noteTypeDetailKey(data.id), data);
    },
  });
};

export const useUpdateNoteType = () => {
  const queryClient = useQueryClient();

  return useMutation<
    NoteType,
    NormalizedApiError,
    { id: string; payload: Partial<NoteType> }
  >({
    mutationFn: ({ id, payload }) => notesApi.updateType(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes", "types"] });
      queryClient.setQueryData(noteTypeDetailKey(data.id), data);
    },
  });
};

export const usePatchNoteType = () => {
  const queryClient = useQueryClient();

  return useMutation<
    NoteType,
    NormalizedApiError,
    { id: string; payload: Partial<NoteType> }
  >({
    mutationFn: ({ id, payload }) => notesApi.patchType(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes", "types"] });
      queryClient.setQueryData(noteTypeDetailKey(data.id), data);
    },
  });
};

export const useDeleteNoteType = () => {
  const queryClient = useQueryClient();

  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (id) => notesApi.removeType(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["notes", "types"] });
      queryClient.removeQueries({ queryKey: noteTypeDetailKey(id) });
    },
  });
};

