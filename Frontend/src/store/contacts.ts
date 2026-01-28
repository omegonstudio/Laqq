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

/* ---------- STATE ---------- */

interface ContactsState {
  /* CONTACTS */
  list: Contact[];
  count: number;
  loading: boolean;
  error: string | null;

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
}

const initialState: ContactsState = {
  list: [],
  count: 0,
  loading: false,
  error: null,

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
};

/* ---------- THUNKS ---------- */

/* CONTACTS */
export const fetchContacts = createAsyncThunk<
  PaginatedResponse<Contact>,
  ContactListParams | undefined
>("contacts/fetch", async (params) => {
  return contactsApi.list(params);
});

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
      .addCase(
        fetchContacts.fulfilled,
        (state, action: PayloadAction<PaginatedResponse<Contact>>) => {
          state.loading = false;
          state.list = action.payload.results;
          state.count = action.payload.count;
        }
      )
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

    builder.addCase(createMessage.fulfilled, (state, action) => {
      state.messages.unshift(action.payload);
    });
  },
});

export default contactsSlice.reducer;
