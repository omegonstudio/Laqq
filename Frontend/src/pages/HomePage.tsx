import HeroSection from "@/components/organisms/HeroSection";
import ProductGrid from "@/components/organisms/ProductGrid";
import BrandsGrid from "@/components/organisms/BrandsGrid";
import { mockProducts } from "@/utils/data/mockProducts";
import { useAppDispatch } from "@/store/hooks";
import { useEffect } from "react";
import { fetchAllProducts, fetchProducts } from "@/store/productSlice";
import { fetchBrand, fetchBrands } from "@/store/brandSlice";
import { fetchCategories } from "@/store/categoriesSlice";

const HomePage = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchAllProducts());
    dispatch(fetchBrands({ page: 1, page_size: 10 }));
    dispatch(fetchCategories({ page: 1, page_size: 10 }));
  }, [dispatch]);

  return (
    <>
      <div style={{ position: "relative" }}>
        <HeroSection />
      </div>
      <ProductGrid
        products={mockProducts.slice(0, 3)}
        title="Productos Destacados"
      />
      <BrandsGrid />
    </>
  );
};

export default HomePage;
