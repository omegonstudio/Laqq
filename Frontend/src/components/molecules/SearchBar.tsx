import { useEffect, useRef, useState } from "react";
import { Search, ArrowRight, Loader2, Delete } from "lucide-react";
import { Product } from "@/types/types";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { useProductFilters } from "@/hooks/useFilters";
import { productsApi } from "@/lib/api/products";

interface SearchBarWithResultsProps {
  debounceMs?: number;
  maxResults?: number;
  loading?: boolean;
  onViewAllResults?: (query: string) => void;
  radius?: boolean;
  value?: string;
}

export default function SearchBar({
  debounceMs = 300,
  maxResults = 10,
  loading = false,
  onViewAllResults,
  radius = false,
  value = "",
}: SearchBarWithResultsProps) {
  const { clearSearch } = useProductFilters();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const { list: products, loading: loadingProducts } = useAppSelector(
    (state) => state.products
  );
  useEffect(() => {
    setQuery(value);
    setHasUserInteracted(false);
    setIsOpen(false);
  }, [value]);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Filter products based on debounced query
  useEffect(() => {
    if (!hasUserInteracted) return;

    if (debouncedQuery.trim()) {
      productsApi.list({ search: debouncedQuery, is_active: true }).then((response) => {
        setFilteredProducts(response.results);
      });

      setIsOpen(true);
    } else {
      setFilteredProducts([]);
      setIsOpen(false);
    }
    setHighlightedIndex(-1);
  }, [debouncedQuery, products, maxResults, hasUserInteracted]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredProducts.length ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > -1 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex === filteredProducts.length) {
        handleViewAll();
      } else if (highlightedIndex >= 0) {
        handleProductClick(filteredProducts[highlightedIndex]);
      } else if (query.trim()) {
        handleViewAll();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.id}`);
    setIsOpen(false);
    setQuery("");
  };

  const handleViewAll = () => {
    if (!query.trim()) return;
    onViewAllResults?.(query);
    setIsOpen(false);
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;

    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <span key={i} className="font-semibold text-foreground">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const totalResults = products.filter((p) => {
    const searchLower = debouncedQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(searchLower) ||
      (p.brand || "").toLowerCase().includes(searchLower) ||
      (p.description || "").toLowerCase().includes(searchLower) ||
      p.product_code.toLowerCase().includes(searchLower) ||
      p.variants?.some((v) => v.code?.toLowerCase().includes(searchLower)) ||
      p.variants?.some((v) =>
        v.technical_specs?.some((spec) =>
          spec.value?.toLowerCase().includes(searchLower)
        )
      )
    );
  }).length;
  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setHasUserInteracted(true);
            setQuery(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setHasUserInteracted(true);
            if (debouncedQuery.trim() && filteredProducts.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={"Buscar productos..."}
          className={`${
            radius ? " rounded-full" : " rounded-lg"
          } w-full h-full pl-12 pr-4 py-3 border border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground transition-all`}
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        {/*         <Delete
          className="w-5 h-5 text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
          onClick={query.length > 0 ? clearSearch : null}
        /> */}
      </div>

      {/* Dropdown with results */}
      {isOpen && debouncedQuery.trim() && (
        <div className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95">
          {filteredProducts.length > 0 ? (
            <>
              <div className="max-h-[400px] overflow-y-auto">
                {filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors text-left ${
                      highlightedIndex === index ? "bg-accent" : ""
                    }`}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {product.image && (
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {highlightText(product.name, debouncedQuery)}
                      </p>
                      {product.brand && (
                        <p className="text-xs text-muted-foreground truncate">
                          {highlightText(product.brand, debouncedQuery)}
                        </p>
                      )}
                    </div>
                    {/* {product.price && (
                      <div className="text-sm font-semibold text-foreground flex-shrink-0">
                        ${product.price.toFixed(2)}
                      </div>
                    )} */}
                  </div>
                ))}
              </div>

              {/* View all results button */}
              {totalResults > maxResults && (
                <button
                  onClick={handleViewAll}
                  className={`w-full px-4 py-3 flex items-center text-primary justify-between border-t border-border hover:bg-accent transition-colors hover:text-white ${
                    highlightedIndex === filteredProducts.length
                      ? "bg-accent text-white"
                      : ""
                  }`}
                  onMouseEnter={() =>
                    setHighlightedIndex(filteredProducts.length)
                  }
                >
                  <span className="text-sm font-medium">
                    Ver todos los resultados ({totalResults})
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No se encontraron resultados para "{debouncedQuery}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
