import { ReactNode } from "react";
import Header from "../organisms/Header";
import Footer from "../organisms/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
     <WhatsAppFloat />

      <Footer />
    </div>
  );
};

export default MainLayout;
