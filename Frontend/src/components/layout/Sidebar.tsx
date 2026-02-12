import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Mail,
  Newspaper,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  Tag,
  Phone,
  Ticket,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Logo from "../atoms/Logo";

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/backoffice",
  },
  { id: "users", label: "Usuarios", icon: Users, path: "/backoffice/users" },
  {
    id: "products",
    label: "Productos",
    icon: Package,
    path: "/backoffice/products",
  },
  {
    id: "quotes",
    label: "Cotizaciones",
    icon: FileText,
    path: "/backoffice/quotes",
  },
  {
    id: "messages",
    label: "Mensajes",
    icon: Mail,
    path: "/backoffice/messages",
  },
  // { id: "notes", label: "Notas / Novedades", icon: Newspaper, path: "/backoffice/notes" },
  { id: "brands", label: "Marcas", icon: Tag, path: "/backoffice/brands" },
  {
    id: "categories",
    label: "Categorías",
    icon: FolderTree,
    path: "/backoffice/categories",
  },
  {
    id: "contacts",
    label: "Contactos",
    icon: Phone,
    path: "/backoffice/contacts",
  },
  {
    id: "ticketsService",
    label: "Tickets de servicio",
    icon: Ticket,
    path: "/backoffice/tickets",
  },
  {
    id: "libreria",
    label: "Librería",
    icon: Image,
    path: "/backoffice/libreria",
  },
];

// const complementaryItems = [
//   {
//     id: "complementary-categories",
//     label: "Rubros y Categorías",
//     path: "/backoffice/categories",
//   },
//   { id: "states", label: "Estados", path: "/backoffice/complementary/states" },
//   { id: "types", label: "Tipos", path: "/backoffice/complementary/types" },
//   { id: "levels", label: "Niveles", path: "/backoffice/complementary/levels" },
//   { id: "rrhh", label: "RRHH", path: "/backoffice/complementary/rrhh" },
//   {
//     id: "accessories",
//     label: "Accesorios",
//     path: "/backoffice/complementary/accessories",
//   },
// ];

const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [complementaryOpen, setComplementaryOpen] = useState(false);

  return (
    <aside
      className={cn(
        "bg-secondary text-white transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {!collapsed && <Logo />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                "hover:bg-white/10",
                isActive && "bg-primary text-primary-foreground font-medium"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* Complementaria Dropdown */}
        {/* <div className="space-y-1">
          <button
            onClick={() => setComplementaryOpen(!complementaryOpen)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              "hover:bg-white/10",
              complementaryOpen && "bg-white/5"
            )}
            title={collapsed ? "Complementaria" : undefined}
          >
            <Settings size={20} />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Complementaria</span>
                <ChevronDown
                  size={16}
                  className={cn(
                    "transition-transform",
                    complementaryOpen && "rotate-180"
                  )}
                />
              </>
            )}
          </button>

          {complementaryOpen && !collapsed && (
            <div className="ml-4 space-y-1 border-l-2 border-white/10 pl-2">
              {complementaryItems.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={cn(
                      "block px-4 py-2 rounded-lg transition-colors text-sm",
                      "hover:bg-white/10",
                      isActive &&
                        "bg-primary text-primary-foreground font-medium"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div> */}
      </nav>
    </aside>
  );
};

export default Sidebar;
