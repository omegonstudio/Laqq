import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import ScrollToTop from "@/components/common/ScrollToTop";
import ScrollToHash from "@/components/common/ScrollToHash";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { lazy, Suspense, type ReactNode } from "react";
import SeoHead from "./components/seo/SeoHead";
import AppShellSkeleton from "./components/layout/AppShellSkeleton";
import Index from "./pages/Index";

const NotFound = lazy(() => import("./pages/NotFound"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const BackofficeLayout = lazy(
  () => import("./components/layout/BackofficeLayout")
);
const BackofficeHome = lazy(() => import("./pages/BackofficeHome"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const NotesPage = lazy(() => import("./pages/NotesPage"));
const CategoriesPage = lazy(() => import("./pages/backoffice/CategoriesPage"));
const ProductsBackoffice = lazy(
  () => import("./pages/backoffice/ProductsBackoffice")
);
const QuotesBackoffice = lazy(
  () => import("./pages/backoffice/QuotesBackoffice")
);
import MainLayout from "./components/layouts/MainLayout";
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const QuotePage = lazy(() => import("./pages/QuotePage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const CertificatesPage = lazy(() => import("./pages/CertificatesPage"));
const CompanyPage = lazy(() => import("./pages/CompanyPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const FurniturePage = lazy(() => import("./pages/FurniturePage"));
const BrandsPage = lazy(() => import("./pages/BrandsPage"));
const ContactsPage = lazy(() => import("./pages/ContactsPage"));
const StatesPage = lazy(() => import("./pages/complementary/StatesPage"));
const TypesPage = lazy(() => import("./pages/complementary/TypesPage"));
const LevelsPage = lazy(() => import("./pages/complementary/LevelsPage"));
const RRHHPage = lazy(() => import("./pages/complementary/RRHHPage"));
const AccessoriesPage = lazy(
  () => import("./pages/complementary/AccessoriesPage")
);
const PageTicket = lazy(() => import("./pages/backofficeClients"));
const TicketsPage = lazy(() => import("./pages/TicketsPage"));
const LibreriaPage = lazy(() => import("./pages/LibreriaPage"));

const queryClient = new QueryClient();

const PublicLayout = ({ children }: { children: ReactNode }) => (
  <MainLayout>{children}</MainLayout>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <CartProvider>
            <BrowserRouter>
              <SeoHead />
              <ScrollToTop />
              <ScrollToHash />
              <Suspense fallback={<AppShellSkeleton />}>
                <Routes>
                  <Route path="/tickets" element={<PageTicket />} />
                  <Route path="/" element={<Index />} />
                  <Route
                    path="/products"
                    element={
                      <PublicLayout>
                        <ProductsPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/product/:id"
                    element={
                      <PublicLayout>
                        <ProductDetailPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/quote"
                    element={
                      <PublicLayout>
                        <QuotePage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/support"
                    element={
                      <PublicLayout>
                        <SupportPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/certificates"
                    element={
                      <PublicLayout>
                        <CertificatesPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/furniture"
                    element={
                      <PublicLayout>
                        <FurniturePage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/company"
                    element={
                      <PublicLayout>
                        <CompanyPage />
                      </PublicLayout>
                    }
                  />
                  <Route
                    path="/contact"
                    element={
                      <PublicLayout>
                        <ContactPage />
                      </PublicLayout>
                    }
                  />

                  <Route path="/login" element={<LoginPage />} />

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
                    <Route
                      path="complementary/states"
                      element={<StatesPage />}
                    />
                    <Route path="complementary/types" element={<TypesPage />} />
                    <Route
                      path="complementary/levels"
                      element={<LevelsPage />}
                    />
                    <Route path="complementary/rrhh" element={<RRHHPage />} />
                    <Route
                      path="complementary/accessories"
                      element={<AccessoriesPage />}
                    />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </CartProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
