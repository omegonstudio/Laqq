import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import ScrollToTop from "@/components/common/ScrollToTop";
import ScrollToHash from "@/components/common/ScrollToHash";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import BackofficeLayout from "./components/layout/BackofficeLayout";
import BackofficeHome from "./pages/BackofficeHome";
import UsersPage from "./pages/UsersPage";
import MessagesPage from "./pages/MessagesPage";
import NotesPage from "./pages/NotesPage";
import CategoriesPage from "./pages/backoffice/CategoriesPage";
import ProductsBackoffice from "./pages/backoffice/ProductsBackoffice";
import QuotesBackoffice from "./pages/backoffice/QuotesBackoffice";
import MainLayout from "./components/layouts/MainLayout";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import QuotePage from "./pages/QuotePage";
import SupportPage from "./pages/SupportPage";
import CertificatesPage from "./pages/CertificatesPage";
import CompanyPage from "./pages/CompanyPage";
import ContactPage from "./pages/ContactPage";
import FurniturePage from "./pages/FurniturePage";
import BrandsPage from "./pages/BrandsPage";
import ContactsPage from "./pages/ContactsPage";
import StatesPage from "./pages/complementary/StatesPage";
import TypesPage from "./pages/complementary/TypesPage";
import LevelsPage from "./pages/complementary/LevelsPage";
import RRHHPage from "./pages/complementary/RRHHPage";
import AccessoriesPage from "./pages/complementary/AccessoriesPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { useAppDispatch } from "./store/hooks";
import { useEffect } from "react";
import { fetchAllCategories } from "./store/categoriesSlice";
import { fetchAllBrands } from "./store/brandSlice";
import PageTicket from "./pages/backofficeClients";
import TicketsPage from "./pages/TicketsPage";
import LibreriaPage from "./pages/LibreriaPage";

const queryClient = new QueryClient();
const App = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchAllCategories({ retries: 2, retryDelayMs: 350 }));
    dispatch(fetchAllBrands());
    // dispatch(fetchAllProducts());
  }, [dispatch]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <CartProvider>
            <BrowserRouter>
              <ScrollToTop />
              <ScrollToHash />
              <Routes>
                <Route path="/tickets" element={<PageTicket />} />
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route
                  path="/products"
                  element={
                    <MainLayout>
                      <ProductsPage />
                    </MainLayout>
                  }
                />
                <Route
                  path="/product/:id"
                  element={
                    <MainLayout>
                      <ProductDetailPage />
                    </MainLayout>
                  }
                />
                <Route
                  path="/quote"
                  element={
                    <MainLayout>
                      <QuotePage />
                    </MainLayout>
                  }
                />
                <Route
                  path="/support"
                  element={
                    <MainLayout>
                      <SupportPage />
                    </MainLayout>
                  }
                />
                <Route
                  path="/certificates"
                  element={
                    <MainLayout>
                      <CertificatesPage />
                    </MainLayout>
                  }
                />
                <Route
                  path="/furniture"
                  element={
                    <MainLayout>
                      <FurniturePage />
                    </MainLayout>
                  }
                />
                <Route
                  path="/company"
                  element={
                    <MainLayout>
                      <CompanyPage />
                    </MainLayout>
                  }
                />
                <Route
                  path="/contact"
                  element={
                    <MainLayout>
                      <ContactPage />
                    </MainLayout>
                  }
                />

                {/* Auth route */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected backoffice routes */}
                <Route
                  path="/backoffice"
                  element={
                    <ProtectedRoute>
                      <BackofficeLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<BackofficeHome />} />
                  <Route path="users" element={<UsersPage />} />
                  <Route path="tickets" element={<TicketsPage />} />
                  <Route path="libreria" element={<LibreriaPage />} />
                  <Route path="products" element={<ProductsBackoffice />} />
                  <Route path="quotes" element={<QuotesBackoffice />} />
                  <Route path="messages" element={<MessagesPage />} />
                  <Route path="notes" element={<NotesPage />} />
                  <Route path="brands" element={<BrandsPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="contacts" element={<ContactsPage />} />
                  <Route path="complementary/states" element={<StatesPage />} />
                  <Route path="complementary/types" element={<TypesPage />} />
                  <Route path="complementary/levels" element={<LevelsPage />} />
                  <Route path="complementary/rrhh" element={<RRHHPage />} />
                  <Route
                    path="complementary/accessories"
                    element={<AccessoriesPage />}
                  />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
