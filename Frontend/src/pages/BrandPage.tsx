import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductGrid from "@/components/organisms/ProductGrid";
import CatalogBreadcrumb from "@/components/molecules/CatalogBreadcrumb";
import ProductImage from "@/components/atoms/ProductImage";
import Button from "@/components/atoms/Button";
import { Brand, PaginationInfo, Product } from "@/types/types";
import { productsApi } from "@/lib/api/products";
import {
  absoluteUrl,
  SITE_NAME,
} from "@/config/seo";
import { applyDocumentSeo } from "@/components/seo/SeoHead";
import { ensureHttpsUrl } from "@/utils/secureUrl";

const INITIAL_PAGINATION: PaginationInfo = {
  count: 0,
  next: null,
  previous: null,
  page_size: 9,
  current_page: 1,
  total_pages: 1,
};

const BrandPage = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [brandError, setBrandError] = useState(false);
  const [brandLoading, setBrandLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [pagination, setPagination] =
    useState<PaginationInfo>(INITIAL_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setBrandLoading(true);
    setBrandError(false);
    setBrand(null);
    setAllProducts([]);
    setCurrentPage(1);

    productsApi
      .getBrandBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        setBrand(data);
        setBrandLoading(false);
        applyDocumentSeo({
          title: `Productos ${data.name} | ${SITE_NAME}`,
          description:
            data.description?.trim() ||
            `Catálogo de productos ${data.name} representados por ${SITE_NAME}.`,
          canonical: absoluteUrl(`/marcas/${data.slug}`),
          robots: "index, follow",
        });
      })
      .catch(() => {
        if (cancelled) return;
        setBrandError(true);
        setBrandLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const buildParams = useCallback(
    (page: number) => {
      if (!brand) return null;
      return {
        page,
        page_size: 9,
        is_active: true,
        brand: brand.id,
      };
    },
    [brand]
  );

  useEffect(() => {
    if (!brand) return;
    const params = buildParams(1);
    if (!params) return;

    const seq = ++requestSeqRef.current;
    setLoading(true);
    setAllProducts([]);
    setCurrentPage(1);

    productsApi
      .list(params)
      .then((res) => {
        if (seq !== requestSeqRef.current) return;
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
  }, [brand, buildParams]);

  const handleLoadMore = () => {
    if (!brand) return;
    const nextPage = currentPage + 1;
    const params = buildParams(nextPage);
    if (!params) return;
    const seq = ++requestSeqRef.current;
    setLoading(true);

    productsApi
      .list(params)
      .then((res) => {
        if (seq !== requestSeqRef.current) return;
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

  if (brandLoading) {
    return (
      <div className="py-16">
        <div className="container mx-auto px-4 text-center">
          <p>Cargando marca...</p>
        </div>
      </div>
    );
  }

  if (brandError || !brand) {
    return (
      <div className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Marca no encontrada</h1>
          <Link to="/products">
            <Button>Ver catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasMore = currentPage < pagination.total_pages;
  const crumbs = [
    { label: "Inicio", href: "/" },
    { label: "Catálogo", href: "/products" },
    { label: brand.name, href: `/marcas/${brand.slug}` },
  ];

  return (
    <div className="py-5">
      <div className="container mx-auto px-4">
        <CatalogBreadcrumb items={crumbs} />
        <div className="max-w-3xl mx-auto text-center mb-8">
          {brand.logo_url ? (
            <div className="flex justify-center mb-6">
              <ProductImage
                src={ensureHttpsUrl(brand.logo_url) ?? brand.logo_url}
                alt={brand.name}
                width={200}
                height={80}
                className="h-16 w-auto max-w-[200px] object-contain"
              />
            </div>
          ) : null}
          <h1 className="text-4xl font-bold mb-4">Productos {brand.name}</h1>
          <p className="text-xl text-muted-foreground mb-2">
            {brand.description?.trim() ||
              `Equipos y material de laboratorio ${brand.name} en el catálogo de ${SITE_NAME}.`}
          </p>
          <p className="text-base text-muted-foreground">
            ¿No encontrás el producto que estás buscando?{" "}
            <Link
              to="/contact"
              className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Contactanos
            </Link>
          </p>
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

export default BrandPage;
