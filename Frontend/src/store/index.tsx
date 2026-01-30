import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./authSlice";
import productsReducer from "./productSlice";
import categoriesReducer from "./categoriesSlice";
import { setStoreReference } from "@/api/client"; // ✅ Importar
import brandsReducer from "./brandSlice";
import specsReducer from "./specsSlice";
import fixedSpecsReducer from "./fixedSpecsSlice";
import quotesReducer from "./quotesSlice";
import contacts from "./contacts";
import users from "./usersSlice";
import ticketsService from "./ticketsSlice";

const persistConfig = {
  key: "auth",
  storage,
  whitelist: ["user", "access", "refresh"],
};

const persistedAuth = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuth,
    products: productsReducer,
    categories: categoriesReducer,
    brands: brandsReducer,
    specs: specsReducer,
    fixedSpecs: fixedSpecsReducer,
    quotes: quotesReducer,
    contacts: contacts,
    users: users,
    ticketsService: ticketsService,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

// ✅ Inicializar la referencia del store en apiClient
setStoreReference(store);

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
