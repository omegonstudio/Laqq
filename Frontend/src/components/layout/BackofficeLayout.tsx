import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const BackofficeLayout = () => {
  return (
    <div className="flex h-screen bg-muted/30 w-full">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <Topbar />
        <div className="px-6 pb-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default BackofficeLayout;
