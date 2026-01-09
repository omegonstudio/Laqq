import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProductGrid from "@/components/organisms/ProductGrid";
import SearchBar from "@/components/molecules/SearchBar";
import { Product } from "@/types/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProducts } from "@/store/productSlice";
import { useProductFilters } from "@/hooks/useFilters";

const ProductsPage = () => {
  const { searchParams, setFilter, clearAll, clearBrand } = useProductFilters();
  const search = searchParams.get("search") ?? "";

  const dispatch = useAppDispatch();
  const { list: products, loading: loadingProducts } = useAppSelector(
    (state) => state.products
  );
  const { list: brands } = useAppSelector((state) => state.brands);
  const { list: categories } = useAppSelector((state) => state.categories);

  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchProducts({ page: 1, page_size: 20 }));
  }, [dispatch]);

  useEffect(() => {
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");

    let filtered = products;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          (p.brand || "").toLowerCase().includes(searchLower) ||
          (p.description || "").toLowerCase().includes(searchLower)
      );
    }

    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }

    if (brand) {
      const brandObj = brands.find((b) => b.id === brand);
      filtered = filtered.filter((p) => p.brand === brandObj?.name);
    }

    setFilteredProducts(filtered);
  }, [searchParams, products]);

  const clearFilters = () => clearBrand();

  // Obtener nombre de la marca activa
  const activeBrandId = searchParams.get("brand");
  const activeBrand = brands.find((b) => b.id === activeBrandId);
  console.log(products, "PRODUCTOS");
  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Catálogo de Productos</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Explora nuestra amplia selección de equipos y material de
            laboratorio
          </p>
          <SearchBar
            debounceMs={300}
            maxResults={10}
            value={search}
            onViewAllResults={(q) => setFilter("search", q)}
          />

          {/* Mostrar filtro activo */}
          {activeBrand && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">
                Filtrando por marca:
              </span>
              <div className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
                <span className="font-medium">{activeBrand.name}</span>
                <button
                  onClick={clearFilters}
                  className="text-primary hover:text-primary/80 font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProductGrid products={filteredProducts} />
    </div>
  );
};

export default ProductsPage;
