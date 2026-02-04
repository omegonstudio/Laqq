import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  Contact,
  ContactState,
  Message,
  MessageCreate,
  PaginatedResponse,
} from "@/types/api";
import {
  contactsApi,
  MessageListParams,
  ContactListParams,
} from "@/lib/api/contacts";
import { PaginationInfo } from "@/types/types";

/* ---------- STATE ---------- */
interface FetchContactsParams {
  page?: number;
  page_size?: number;
  search?: string;
  state?: string;
}
interface ContactsState {
  /* CONTACTS */
  list: Contact[];
  count: number;
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;

  selected: Contact | null;
  selectedLoading: boolean;
  selectedError: string | null;

  /* STATES */
  states: ContactState[];
  statesLoading: boolean;
  statesError: string | null;

  /* MESSAGES */
  messages: Message[];
  messagesCount: number;
  messagesLoading: boolean;
  messagesError: string | null;

  deleting: boolean;
  deleteError: string | null;
  deleteSuccess: boolean;
}
const initialPagination: PaginationInfo = {
  count: 0,
  next: null,
  previous: null,
  page_size: 20,
  current_page: 1,
  total_pages: 1,
};
const initialState: ContactsState = {
  list: [],
  count: 0,
  loading: false,
  error: null,
  pagination: initialPagination,

  selected: null,
  selectedLoading: false,
  selectedError: null,

  states: [],
  statesLoading: false,
  statesError: null,

  messages: [],
  messagesCount: 0,
  messagesLoading: false,
  messagesError: null,

  deleting: false,
  deleteError: null,
  deleteSuccess: false,
};

/* ---------- THUNKS ---------- */

/* CONTACTS */
// export const fetchContacts = createAsyncThunk<
//   PaginatedResponse<Contact>,
//   ContactListParams | undefined
// >("contacts/fetch", async (params) => {
//   return contactsApi.list(params);
// });

export const fetchContacts = createAsyncThunk(
  "contacts/fetch",
  async (params?: FetchContactsParams) => {
    return contactsApi.list(params);
  }
);
export const fetchContact = createAsyncThunk<Contact, string>(
  "contacts/fetchOne",
  async (id) => {
    return contactsApi.get(id);
  }
);

export const createContact = createAsyncThunk<Contact, Partial<Contact>>(
  "contacts/create",
  async (data) => {
    return contactsApi.create(data);
  }
);

export const updateContact = createAsyncThunk<
  Contact,
  { id: string; data: Partial<Contact> }
>("contacts/update", async ({ id, data }) => {
  return contactsApi.update(id, data);
});

export const deleteContact = createAsyncThunk<string, string>(
  "contacts/delete",
  async (id) => {
    await contactsApi.remove(id);
    return id;
  }
);

/* STATES */
export const fetchContactStates = createAsyncThunk<
  PaginatedResponse<ContactState>,
  { search?: string } | undefined
>("contacts/fetchStates", async (params) => {
  return contactsApi.listStates(params);
});

/* MESSAGES */
export const fetchMessages = createAsyncThunk<
  PaginatedResponse<Message>,
  MessageListParams | undefined
>("contacts/fetchMessages", async (params) => {
  return contactsApi.listMessages(params);
});

export const createMessage = createAsyncThunk<
  Message, // lo que devuelve la API
  MessageCreate // lo que enviás
>("contacts/createMessage", async (data) => {
  return contactsApi.createMessage(data);
});

export const deleteMessage = createAsyncThunk<string, string>(
  "contacts/deleteMessage",
  async (id) => {
    await contactsApi.removeMessage(id);
    return id; // Retornar el id después de eliminarlo
  }
);

/* ---------- SLICE ---------- */

export const contactsSlice = createSlice({
  name: "contacts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    /* CONTACTS LIST */
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // .addCase(
      //   fetchContacts.fulfilled,
      //   (state, action: PayloadAction<PaginatedResponse<Contact>>) => {
      //     state.loading = false;
      //     state.list = action.payload.results;
      //     state.count = action.payload.count;
      //   }
      // )
      .addCase(fetchContacts.fulfilled, (state, action) => {
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
      .addCase(fetchContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error cargando contactos";
      });

    /* CONTACT GET ONE */
    builder
      .addCase(fetchContact.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchContact.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchContact.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError = action.error.message || "Error cargando contacto";
      });
    builder
      .addCase(updateContact.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        state.loading = false;

        const updated = action.payload;

        // 1️⃣ Actualizar en la lista
        const index = state.list.findIndex(
          (contact) => contact.id === updated.id
        );

        if (index !== -1) {
          state.list[index] = updated;
        }

        // 2️⃣ Actualizar seleccionado si corresponde
        if (state.selected?.id === updated.id) {
          state.selected = updated;
        }
      })
      .addCase(updateContact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error actualizando contacto";
      });
    builder
      .addCase(deleteContact.pending, (state) => {
        state.deleting = true;
        state.deleteError = null;
        state.deleteSuccess = false;
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.deleting = false;
        state.deleteSuccess = true;

        const deletedId = action.payload;

        // 1️⃣ Eliminar de la lista
        state.list = state.list.filter((contact) => contact.id !== deletedId);

        // 2️⃣ Actualizar contador total
        state.count = Math.max(0, state.count - 1);

        // 3️⃣ Limpiar seleccionado si era el eliminado
        if (state.selected?.id === deletedId) {
          state.selected = null;
        }
      })
      .addCase(deleteContact.rejected, (state, action) => {
        state.deleting = false;
        state.deleteError = action.error.message || "Error eliminando contacto";
      });

    /* STATES */
    builder
      .addCase(fetchContactStates.pending, (state) => {
        state.statesLoading = true;
        state.statesError = null;
      })
      .addCase(fetchContactStates.fulfilled, (state, action) => {
        state.statesLoading = false;
        state.states = action.payload.results;
      })
      .addCase(fetchContactStates.rejected, (state, action) => {
        state.statesLoading = false;
        state.statesError = action.error.message || "Error cargando estados";
      });

    /* MESSAGES */
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true;
        state.messagesError = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        state.messages = action.payload.results;
        state.messagesCount = action.payload.count;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.messagesError = action.error.message || "Error cargando mensajes";
      });
    builder
      .addCase(deleteMessage.pending, (state) => {
        state.deleting = true;
        state.deleteError = null;
        state.deleteSuccess = false;
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.deleting = false;
        state.deleteSuccess = true;
        // Eliminar el mensaje de la lista
        state.messages = state.messages.filter((m) => m.id !== action.payload);
        state.messagesCount = Math.max(0, state.messagesCount - 1);
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.deleting = false;
        state.deleteError = action.error.message || "Error eliminando mensaje";
      });
    builder.addCase(createMessage.fulfilled, (state, action) => {
      state.messages.unshift(action.payload);
    });
  },
});

export default contactsSlice.reducer;
