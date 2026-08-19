import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Moon, Sun, User, ShoppingCart, X, Menu } from "lucide-react";
import NavDropdown from "../molecules/NavDropdown";
import { useTheme } from "next-themes";
import { useCart } from "@/contexts/CartContext";
import CartModal from "./CartModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppSelector } from "@/store/hooks";
import SearchBar from "../molecules/SearchBar";
import { useProductFilters } from "@/hooks/useFilters";
import Logo from "../atoms/Logo";

const Header = () => {
  const { searchParams, setFilter } = useProductFilters();

  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { totalItems } = useCart();
  const { list: brands } = useAppSelector((state) => state.brands);
  const [selectedBrand, setSelectedBrand] = useState("all");

  const handleViewAllResults = (query: string) => {
    setFilter("search", query);
  };

  useEffect(() => {
    setSelectedBrand(searchParams.get("brand") || "all");
  }, [searchParams]);

  // Encontrar el nombre de la marca seleccionada
  const getSelectedBrandName = () => {
    if (!searchParams.get("brand")) return "Todas las marcas";
    if (selectedBrand === "all") return "Todas las marcas";
    const brand = brands.find((b) => b.id === selectedBrand);
    return brand?.name || "Todas las marcas";
  };

  const navigate = useNavigate();

  /**
   * Navega a una ruta y, si contiene un hash (#section),
   * hace scroll suave al elemento correspondiente después del render.
   */
  const handleNavigate = (path: string) => {
    navigate(path);

    const hash = path.split("#")[1];

    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  };

  // Orden fijo de las opciones del menú Nosotros
  const navigateNosotros: { name: string; path: string }[] = [
    { name: "Empresa", path: "/company" },
    { name: "Representaciones", path: "/company#representaciones" },
    { name: "Contacto", path: "/contact" },
  ];

  const sortedBrands = [...brands].sort((a, b) =>
  a.name.localeCompare(b.name, "es", {
    sensitivity: "base",
    numeric: true,
  })
);

  return (
    <>
      <header className="w-full sticky top-0 z-50">
        {/* --- Top Bar --- */}
        <div
          className={`w-full border-b
           ${
             theme === "dark"
               ? "bg-[#0a0a0a] border-[#222]"
               : "bg-white border-gray-200"
           }`}
        >
          <div className="container mx-auto flex items-center justify-between py-3 px-4 md:px-6">
            {/* Logo */}
            <a href="/">
              <Logo variant="auto" className="h-8 md:h-10" showLink={false} />
            </a>

            {/* Search Section - Hidden on mobile */}
            <div className="hidden lg:flex flex-1 items-center justify-center gap-3 ">
              <div
                className={`flex items-start rounded-full px-4 py-2 w-full max-w-lg 
                }`}
              >
                <SearchBar
                  debounceMs={300}
                  maxResults={10}
                  radius
                  onViewAllResults={handleViewAllResults}
                  value={searchParams.get("search") ?? ""}
                />
              </div>
              <Select
                defaultValue="all"
                onValueChange={(value) => setFilter("brand", value)}
              >
                <SelectTrigger
                  className={`w-[180px] text-sm rounded-2xl px-4 py-2 border transition-colors ${
                    theme === "dark"
                      ? "bg-[#0a0a0a] border-gray-700 text-gray-200"
                      : "bg-white border-gray-300 text-gray-700"
                  }`}
                >
                  <SelectValue>{getSelectedBrandName()}</SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all" className="rounded-xl">
                    Todas las marcas
                  </SelectItem>
                  {sortedBrands.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="rounded-xl">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Desktop Icons */}
            <div className="hidden md:flex items-center gap-4 ">
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Carrito de compras"
              >
                <ShoppingCart
                  className={`w-6 h-6 ${
                    theme === "dark" ? "text-gray-200" : "text-gray-700"
                  }`}
                />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </button>

              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-6 h-6 text-gray-200" />
                ) : (
                  <Moon className="w-6 h-6 text-gray-700" />
                )}
              </button>

              <Link
                to="/login"
                className={`p-2 rounded-lg hover:bg-muted transition-colors ${
                  theme === "dark"
                    ? "text-gray-300 hover:text-primary"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                <User className="w-6 h-6" />
              </Link>
            </div>

            {/* Mobile Icons */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Carrito de compras"
              >
                <ShoppingCart
                  className={`w-5 h-5 ${
                    theme === "dark" ? "text-gray-200" : "text-gray-700"
                  }`}
                />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                    {totalItems}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Menú"
              >
                {mobileMenuOpen ? (
                  <X
                    className={`w-5 h-5 ${
                      theme === "dark" ? "text-gray-200" : "text-gray-700"
                    }`}
                  />
                ) : (
                  <Menu
                    className={`w-5 h-5 ${
                      theme === "dark" ? "text-gray-200" : "text-gray-700"
                    }`}
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* --- Bottom Navigation (sticky) --- */}
        {/* Order: Equipamiento · Insumos · Procesos · Mobiliario | Servicio Técnico | Nosotros */}
        <nav
          className={`border-b ${
            theme === "dark"
              ? "border-gray-800 bg-[#0a0a0a]"
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="container md:flex md:flex-row flex-col mx-auto flex items-center gap-5 justify-center py-2 px-0">
            {/* Product categories: Equipamiento, Insumos, Procesos, Mobiliario (fixed order via display_order) */}
            <NavDropdown />
            <div className="flex justify-between md:justify-center gap-5">
              {/* Servicio Técnico — fixed link, always 5th */}
              <Link
                to="/support"
                className={`px-4 py-2 rounded-2xl text-sm font-medium border transition-colors ${
                  theme === "dark"
                    ? "border-orange-500 text-orange-500 hover:bg-orange-500/10"
                    : "border-orange-500 text-orange-600 hover:bg-orange-50"
                }`}
              >
                Servicio técnico
              </Link>

              {/* Certificados — fixed link*/}
              <Link
                to="/certificates"
                className={`px-4 py-2 rounded-2xl text-sm font-medium border transition-colors ${
                  theme === "dark"
                    ? "border-orange-500 text-orange-500 hover:bg-orange-500/10"
                    : "border-orange-500 text-orange-600 hover:bg-orange-50"
                }`}
              >
                Certificados
              </Link>

              {/* Nosotros — always last */}
              <Select
                value=""
                onValueChange={(value) => {
                  handleNavigate(value);
                }}
              >
                <SelectTrigger
                  className={`w-auto text-sm rounded-2xl px-4 py-1 border transition-colors ${
                    theme === "dark"
                      ? "bg-[#0a0a0a] border-gray-700 text-gray-200"
                      : "bg-white border-gray-300 text-gray-700"
                  }`}
                >
                  <SelectValue placeholder="Nosotros" />
                </SelectTrigger>

                <SelectContent className="rounded-2xl">
                  {navigateNosotros.map((n) => (
                    <SelectItem
                      key={n.path}
                      className="rounded-xl"
                      value={n.path}
                    >
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div
          className={`md:hidden border-b transition-all duration-300 overflow-hidden ${
            mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          } ${
            theme === "dark"
              ? "border-gray-800 bg-[#0a0a0a]"
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Search on mobile */}
            <div className="w-full">
              <SearchBar
                debounceMs={300}
                maxResults={10}
                radius
                onViewAllResults={handleViewAllResults}
                value={searchParams.get("search") ?? ""}
              />
            </div>

            {/* Brand selector on mobile */}
            <Select
              defaultValue="all"
              onValueChange={(value) => setFilter("brand", value)}
            >
              <SelectTrigger
                className={`w-full text-sm rounded-2xl px-4 py-2 border transition-colors ${
                  theme === "dark"
                    ? "bg-[#0a0a0a] border-gray-700 text-gray-200"
                    : "bg-white border-gray-300 text-gray-700"
                }`}
              >
                <SelectValue>{getSelectedBrandName()}</SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="rounded-xl">
                  Todas las marcas
                </SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="rounded-xl">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Navigation links on mobile */}
            <div className="flex flex-col gap-2">
              {/* Product categories on mobile */}
              <NavDropdown />

              {/* Servicio Técnico */}
              {/* <Link
                to="/support"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-md text-sm font-medium border text-center transition-colors ${
                  theme === "dark"
                    ? "border-orange-500 text-orange-500 hover:bg-orange-500/10"
                    : "border-orange-500 text-orange-600 hover:bg-orange-50"
                }`}
              >
                Servicio técnico
              </Link> */}

              {/* Nosotros */}
              {/* <Select onValueChange={(value) => handleNavigate(value)}>
                <SelectTrigger
                  className={`w-[180px] text-sm rounded-2xl px-4 py-2 border transition-colors ${
                    theme === "dark"
                      ? "bg-[#0a0a0a] border-gray-700 text-gray-200"
                      : "bg-white border-gray-300 text-gray-700"
                  }`}
                >
                  <SelectValue placeholder="Nosotros" />
                </SelectTrigger>

                <SelectContent className="rounded-2xl">
                  {navigateNosotros.map((n) => (
                    <SelectItem
                      key={n.path}
                      className="rounded-xl"
                      value={n.path}
                    >
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select> */}
            </div>

            {/* User actions on mobile */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors ${
                  theme === "dark"
                    ? "text-gray-300 hover:text-primary"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-sm">Iniciar sesión</span>
              </Link>

              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-5 h-5 text-gray-200" />
                    <span className="text-sm text-gray-200">Modo claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-5 h-5 text-gray-700" />
                    <span className="text-sm text-gray-700">Modo oscuro</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
      <CartModal isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default Header;
