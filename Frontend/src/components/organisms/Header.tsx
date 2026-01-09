import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Moon, Sun, User, ShoppingCart } from "lucide-react";
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
import logoLight from "@/assets/laqq_marca_color_neg.svg";
import { useAppSelector } from "@/store/hooks";
import SearchBar from "../molecules/SearchBar";
import { useProductFilters } from "@/hooks/useFilters";

const Header = () => {
  const { searchParams, setFilter } = useProductFilters();

  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const { totalItems } = useCart();
  const { list: brands, loading } = useAppSelector((state) => state.brands);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleViewAllResults = (query: string) => {
    setFilter("search", query);
  };

  return (
    <>
      {/* Spacer to prevent content jump */}
      <div className={scrolled ? "h-[60px]" : "h-0"} />

      <header className="w-full">
        {/* --- Top Bar (hides on scroll) --- */}
        <div
          className={`w-full border-b transition-all duration-300 ${
            scrolled ? "hidden" : "block"
          } ${
            theme === "dark"
              ? "bg-[#0a0a0a] border-[#222]"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="container mx-auto flex items-center justify-between py-3 px-6">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img
                src={logoLight}
                alt="La Química Quirúrgica"
                className="h-10"
              />
            </Link>

            {/* Search Section */}
            <div className="flex-1 flex items-center justify-center gap-3">
              {/* <div
                className={`flex items-center rounded-full px-4 py-2 w-full max-w-lg border ${
                  theme === "dark"
                    ? "border-gray-700 bg-transparent"
                    : "border-gray-300 bg-white"
                }`}
              >
                <Search
                  className={`w-4 h-4 mr-2 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`flex-1 text-sm focus:outline-none bg-transparent ${
                    theme === "dark" ? "text-gray-200" : "text-gray-800"
                  }`}
                />
              </div> */}
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
                  <SelectValue placeholder="Todas las marcas" />
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
            </div>

            {/* Icons - 20% larger (w-6 h-6 instead of w-5 h-5) */}
            <div className="flex items-center gap-4">
              {/* Botones comentados
              <Link
                to="/quote"
                className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                  theme === "dark"
                    ? "border-orange-500 text-orange-500 hover:bg-orange-500/10"
                    : "border-orange-500 text-orange-600 hover:bg-orange-50"
                }`}
              >
                Solicitud de cotización
              </Link>
              <Link
                to="/service"
                className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                  theme === "dark"
                    ? "border-orange-500 text-orange-500 hover:bg-orange-500/10"
                    : "border-orange-500 text-orange-600 hover:bg-orange-50"
                }`}
              >
                Servicio técnico
              </Link>
              */}

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
          </div>
        </div>

        {/* --- Bottom Navigation (sticky) --- */}
        <nav
          className={`border-b transition-all duration-300 ${
            scrolled ? "fixed top-0 left-0 right-0 z-50 shadow-md" : ""
          } ${
            theme === "dark"
              ? "border-gray-800 bg-[#0a0a0a]"
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="container mx-auto flex items-center justify-between py-2 px-6">
            {/* Logo in sticky mode */}
            {scrolled && (
              <Link to="/" className="flex items-center mr-6">
                <img
                  src={logoLight}
                  alt="La Química Quirúrgica"
                  className="h-8"
                />
              </Link>
            )}

            <div
              className={`flex items-center gap-2 text-sm font-medium ${
                scrolled ? "" : "justify-center w-full"
              }`}
            >
              <NavDropdown />
            </div>

            {/* Icons in sticky mode */}
            {scrolled && (
              <div className="flex items-center gap-3 ml-6">
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
            )}
          </div>
        </nav>
      </header>
      <CartModal isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default Header;
