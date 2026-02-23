import { useState, useEffect } from "react";
import ProductGrid from "@/components/organisms/ProductGrid";
import SearchBar from "@/components/molecules/SearchBar";
import { Product } from "@/types/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProducts } from "@/store/productSlice";
import { useProductFilters } from "@/hooks/useFilters";
import { fetchAllBrands, fetchBrands } from "@/store/brandSlice";
import { fetchAllCategories, fetchCategories } from "@/store/categoriesSlice";

const ProductsPage = () => {
  const { searchParams, setFilter, clearBrand, clearCategory } =
    useProductFilters();
  const search = searchParams.get("search") ?? "";

  const dispatch = useAppDispatch();
  const {
    list: products,
    pagination,
    loading,
  } = useAppSelector((state) => state.products);
  const { list: brands } = useAppSelector((state) => state.brands);
  const { list: categories } = useAppSelector((state) => state.categories);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Cargar primera página
  useEffect(() => {
    dispatch(fetchProducts({ page: 1, page_size: 9, is_active: true }));
    setCurrentPage(1);
    dispatch(fetchAllBrands());
    dispatch(fetchAllCategories());
    setAllProducts([]); // Resetear al montar
  }, [dispatch]);

  // Acumular productos cuando llegan nuevos
  useEffect(() => {
    if (products.length > 0) {
      setAllProducts((prev) => {
        // Si es la página 1, reemplazar todo
        if (currentPage === 1) {
          return products;
        }
        // Si es página siguiente, agregar sin duplicados
        const existingIds = new Set(prev.map((p) => p.id));
        const newProducts = products.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newProducts];
      });
    }
  }, [products, currentPage]);

  // Aplicar filtros locales
  useEffect(() => {
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");

    let filtered = allProducts;

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
      filtered = filtered.filter((p) => p.category_id === category);
    }

    if (brand) {
      const brandObj = brands.find((b) => b.id === brand);
      filtered = filtered.filter((p) => p.brand === brandObj?.name);
    }

    setFilteredProducts(filtered);
  }, [searchParams, allProducts, brands]);

  // Handler para "Ver más"
  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    dispatch(fetchProducts({ page: nextPage, page_size: 9 }));
  };

  // Determinar si hay más páginas
  const hasMore = currentPage < pagination.total_pages;

  const clearFilterBrand = () => {
    clearBrand();
    // Opcional: recargar desde la página 1
    setCurrentPage(1);
    dispatch(fetchProducts({ page: 1, page_size: 9 }));
    setAllProducts([]);
  };
  const clearFilterCategory = () => {
    clearCategory();
    // Opcional: recargar desde la página 1
    setCurrentPage(1);
    dispatch(fetchProducts({ page: 1, page_size: 9 }));
    setAllProducts([]);
  };

  // Obtener nombre de la marca activa
  const activeBrandId = searchParams.get("brand");
  const activeCategoryId = searchParams.get("category");
  const activeBrand = brands.find((b) => b.id === activeBrandId);
  const activeCategory = categories.find((b) => b.id === activeCategoryId);
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
          <div className="flex justify-between">
            {/* Mostrar filtro activo */}
            {activeBrand && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Filtrando por marca:
                </span>
                <div className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
                  <span className="font-medium">{activeBrand.name}</span>
                  <button
                    onClick={clearFilterBrand}
                    className="text-primary hover:text-primary/80 font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            {activeCategory && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Filtrando por categoría:
                </span>
                <div className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
                  <span className="font-medium">{activeCategory.name}</span>
                  <button
                    onClick={clearFilterCategory}
                    className="text-primary hover:text-primary/80 font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductGrid
        products={filteredProducts}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        loading={loading}
      />
    </div>
  );
};

export default ProductsPage;
