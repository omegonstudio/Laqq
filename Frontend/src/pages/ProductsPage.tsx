import { useState, useEffect } from "react";
import ProductGrid from "@/components/organisms/ProductGrid";
import SearchBar from "@/components/molecules/SearchBar";
import { Product } from "@/types/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAllProducts, fetchProducts } from "@/store/productSlice";
import { useProductFilters } from "@/hooks/useFilters";
import { fetchAllBrands, fetchBrands } from "@/store/brandSlice";
import { fetchAllCategories, fetchCategories } from "@/store/categoriesSlice";
import NavDropdown from "@/components/molecules/NavDropdown";

const ProductsPage = () => {
  const { searchParams, setFilter, clearBrand, clearCategory } =
    useProductFilters();
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category");
  const brand = searchParams.get("brand");

  const dispatch = useAppDispatch();
  const {
    list: products,
    pagination,
    loading,
  } = useAppSelector((state) => state.products);
  const { list: brands } = useAppSelector((state) => state.brands);
  const { list: categories } = useAppSelector((state) => state.categories);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Cargar categorías y marcas al montar el componente
  useEffect(() => {
    // dispatch(fetchProducts({ page: 1, page_size: 9, is_active: true }));
    setCurrentPage(1);
    dispatch(fetchAllBrands());
    dispatch(fetchAllCategories());
  }, [dispatch]);

  // Cargar productos cuando cambian los filtros
  useEffect(() => {
    // Construir parámetros de filtrado para el backend
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
      page: 1,
      page_size: 9,
      is_active: true,
    };

    // Agregar búsqueda si existe
    if (search) {
      params.search = search;
    }

    // Usar category_recursive para filtrado recursivo de categorías
    if (category) {
      params.category_recursive = category;
    }

    // Agregar marca si existe
    if (brand) {
      params.brand = brand;
    }

    // Realizar la búsqueda con los filtros aplicados
    dispatch(fetchProducts(params));
    setCurrentPage(1);
    setAllProducts([]); // Resetear productos acumulados
  }, [dispatch, search, category, brand]);

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
    } else setAllProducts([]); // Si no hay productos, limpiar (ej: al cambiar filtros)
  }, [products, currentPage]);

  // Aplicar filtros locales
  useEffect(() => {
    // dispatch(fetchAllProducts({ is_active: true }));
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");

    // let filtered = allProducts;
    dispatch(
      fetchAllProducts({
        is_active: true,
        brand: brand ?? undefined,
        category: category ?? undefined,
        search: search ?? undefined,
      })
    );
  }, [searchParams]);

  // Handler para "Ver más"
  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);

    // Construir parámetros con filtros actuales para la siguiente página
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
      page: nextPage,
      page_size: 9,
      is_active: true,
    };

    if (search) {
      params.search = search;
    }

    if (category) {
      params.category_recursive = category;
    }

    if (brand) {
      params.brand = brand;
    }

    dispatch(fetchProducts(params));
  };

  // Determinar si hay más páginas
  const hasMore = currentPage < pagination.total_pages;

  const clearFilterBrand = () => {
    clearBrand();
  };

  const clearFilterCategory = () => {
    clearCategory();
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
          <div className="w-full flex flex-col justify-center items-center gap-5">
            <SearchBar
              debounceMs={300}
              maxResults={10}
              value={search}
              onViewAllResults={(q) => setFilter("search", q)}
            />
            <NavDropdown />
          </div>
          <div className="flex justify-between">
            {/* Mostrar filtro activo */}
            {activeBrand && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <span className="text-sm text-muted-foreground">
                  Filtrando por marca:
                </span>
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow">
                  <span className="font-medium text-primary">
                    {activeBrand.name}
                  </span>
                  <button
                    onClick={clearFilterBrand}
                    className="text-primary hover:text-primary/80 hover:scale-125 transition-transform font-bold text-xl"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            {activeCategory && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <span className="text-sm text-muted-foreground">
                  Filtrando por categoría:
                </span>
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow">
                  <span className="font-medium text-primary">
                    {activeCategory.name}
                  </span>
                  <button
                    onClick={clearFilterCategory}
                    className="text-primary hover:text-primary/80 hover:scale-125 transition-transform font-bold text-xl"
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
        products={allProducts}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        loading={loading}
      />
    </div>
  );
};

export default ProductsPage;
