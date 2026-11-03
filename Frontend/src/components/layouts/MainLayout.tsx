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
    // #region agent log
    fetch("http://127.0.0.1:7282/ingest/ab0e328b-2eba-4587-bb8f-7d705e5fa936", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "5407fd",
      },
      body: JSON.stringify({
        sessionId: "5407fd",
        runId: "pre-fix",
        hypothesisId: "D",
        location: "MainLayout.tsx:fetchAllBrands",
        message: "Dispatching fetchAllBrands",
        data: { pathname: window.location.pathname },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
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
