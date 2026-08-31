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

  useEffect(() => {
    let cancelled = false;
    const hide = () => {
      if (cancelled) return;
      const el = document.getElementById("boot-shell");
      if (!el) return;
      el.style.opacity = "0";
      el.style.transition = "opacity 120ms ease";
      window.setTimeout(() => el.remove(), 160);
    };
    const run = () => {
      window.requestAnimationFrame(() => window.requestAnimationFrame(hide));
    };
    const timeout = window.setTimeout(run, 400);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        window.clearTimeout(timeout);
        run();
      });
    }
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, []);

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
