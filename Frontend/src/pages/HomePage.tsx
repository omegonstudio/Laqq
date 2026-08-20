import HeroSection from "@/components/organisms/HeroSection";
import ProductGrid from "@/components/organisms/ProductGrid";
import BrandsGrid from "@/components/organisms/BrandsGrid";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useEffect } from "react";
import { fetchAllProducts } from "@/store/productSlice";
import { fetchAllBrands } from "@/store/brandSlice";

const HomePage = () => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchAllProducts({ is_active: true }));
    dispatch(fetchAllBrands());
  }, [dispatch]);

  const { list, loading } = useAppSelector((state) => state.products);

  const productFilter = () => {
    return list.filter((product) => product.is_featured);
  };
  return (
    <>
      <div style={{ position: "relative" }}>
        <HeroSection />
      </div>
      {(loading || productFilter().length > 0) && (
        <section className="pt-16" style={{ minHeight: 720 }}>
          <ProductGrid
            products={productFilter()}
            title="Productos Destacados"
            loading={loading}
          />
        </section>
      )}
      <BrandsGrid />
    </>
  );
};

export default HomePage;
