import { ReactNode, useEffect } from "react";
import Header from "../organisms/Header";
import Footer from "../organisms/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { useAppDispatch } from "@/store/hooks";
import { fetchAllCategories } from "@/store/categoriesSlice";
import { fetchAllBrands } from "@/store/brandSlice";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchAllCategories({ retries: 2, retryDelayMs: 350 }));
    dispatch(fetchAllBrands());
  }, [dispatch]);

  return (
    <>
      <div className="min-h-screen">
        <div className="h-[10.0625rem]" aria-hidden="true" />
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
      <WhatsAppFloat />
    </>
  );
};

export default MainLayout;
