import { useState, useEffect, useRef, useCallback } from "react";
import ProductGrid from "@/components/organisms/ProductGrid";
import { Product, PaginationInfo } from "@/types/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { productsApi, ProductListParams } from "@/lib/api/products";
import { useProductFilters } from "@/hooks/useFilters";
import { fetchAllCategories } from "@/store/categoriesSlice";
import { Link } from "react-router-dom";

const INITIAL_PAGINATION: PaginationInfo = {
  count: 0,
  next: null,
  previous: null,
  page_size: 9,
  current_page: 1,
  total_pages: 1,
};

const ProductsPage = () => {
  const { searchParams, clearBrand, clearCategory } = useProductFilters();
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category");
  const brand = searchParams.get("brand");

  const dispatch = useAppDispatch();
  const { list: brands } = useAppSelector((state) => state.brands);
  const { list: categories } = useAppSelector((state) => state.categories);

  // Estado 100% local: esta página ya no depende del slice compartido de
  // productos en Redux (evita que respuestas de otros filtros/páginas lo pisen).
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [pagination, setPagination] =
    useState<PaginationInfo>(INITIAL_PAGINATION);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Token de secuencia: descarta respuestas fuera de orden. Cada cambio de
  // filtro o "Ver más" incrementa el token; solo se aplica la respuesta que
  // corresponde al token más reciente. Esto elimina el race condition que
  // mostraba productos del filtro anterior o de otras marcas al scrollear.
  const requestSeqRef = useRef(0);

  const buildParams = useCallback(
    (page: number): ProductListParams => {
      const params: ProductListParams = {
        page,
        page_size: 9,
        is_active: true,
      };
      if (search) params.search = search;
      if (category) params.category_recursive = category;
      if (brand) params.brand = brand;
      return params;
    },
    [search, category, brand]
  );

  // Cargar categorías al montar el componente
  useEffect(() => {
    dispatch(fetchAllCategories({}));
  }, [dispatch]);

  // Cargar la primera página cuando cambian los filtros
  useEffect(() => {
    const seq = ++requestSeqRef.current;

    setLoading(true);
    // Resetear productos acumulados para no mostrar datos del filtro anterior
    setAllProducts([]);
    setCurrentPage(1);

    productsApi
      .list(buildParams(1))
      .then((res) => {
        if (seq !== requestSeqRef.current) return; // Respuesta obsoleta, ignorar
        setPagination({
          count: res.count,
          next: res.next,
          previous: res.previous,
          page_size: res.page_size,
          current_page: res.current_page,
          total_pages: res.total_pages,
        });
        setAllProducts(res.results);
        setLoading(false);
      })
      .catch(() => {
        if (seq !== requestSeqRef.current) return;
        setLoading(false);
      });
  }, [search, category, brand, buildParams]);

  // Handler para "Ver más"
  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    const seq = ++requestSeqRef.current;

    setLoading(true);

    productsApi
      .list(buildParams(nextPage))
      .then((res) => {
        if (seq !== requestSeqRef.current) return; // Respuesta obsoleta, ignorar
        setPagination({
          count: res.count,
          next: res.next,
          previous: res.previous,
          page_size: res.page_size,
          current_page: res.current_page,
          total_pages: res.total_pages,
        });
        setAllProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newProducts = res.results.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newProducts];
        });
        setCurrentPage(nextPage);
        setLoading(false);
      })
      .catch(() => {
        if (seq !== requestSeqRef.current) return;
        setLoading(false);
      });
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
    <div className="py-5">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-3">
          <h1 className="text-4xl font-bold mb-4">Catálogo de Productos</h1>
          <p className="text-xl text-muted-foreground mb-2">
            Explora nuestra amplia selección de equipos y material de
            laboratorio
          </p>
          <p className="text-base text-muted-foreground mb-8">
            ¿No encontrás el producto que estás buscando?{" "}
            <Link
              to="/contact"
              className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Contactanos
            </Link>
          </p>
          {/* <div className="w-full flex flex-col justify-center items-center gap-5">
            <SearchBar
              debounceMs={300}
              maxResults={10}
              value={search}
              onViewAllResults={(q) => setFilter("search", q)}
            />
            <NavDropdown />
          </div> */}
          <br></br>
          <div className="flex justify-between">
            {/* Mostrar filtro activo */}
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              {activeCategory && (
                <div>
                  <span className="text-sm text-muted-foreground mr-2">
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

            {activeBrand && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <span className="text-sm text-muted-foreground mr-2">
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
