import HeroSection from "@/components/organisms/HeroSection";
import ProductGrid from "@/components/organisms/ProductGrid";
import BrandsGrid from "@/components/organisms/BrandsGrid";
import { useEffect, useState } from "react";
import { productsApi } from "@/lib/api/products";
import { Product } from "@/types/types";

const HomePage = () => {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingFeatured(true);
    productsApi
      .list({ is_active: true, is_featured: true, page_size: 12 })
      .then((response) => {
        if (!cancelled) setFeatured(response.results);
      })
      .catch(() => {
        if (!cancelled) setFeatured([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingFeatured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div style={{ position: "relative" }}>
        <HeroSection />
      </div>
      <section className="pt-16" style={{ minHeight: 720 }}>
        <ProductGrid
          products={featured}
          title="Productos Destacados"
          loading={loadingFeatured}
          showEmpty={false}
        />
      </section>
      <BrandsGrid />
    </>
  );
};

export default HomePage;
