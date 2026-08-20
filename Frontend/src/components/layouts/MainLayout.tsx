import { ReactNode } from "react";
import Header from "../organisms/Header";
import Footer from "../organisms/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
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
