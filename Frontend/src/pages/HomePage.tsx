import HeroSection from "@/components/organisms/HeroSection";
import ProductGrid from "@/components/organisms/ProductGrid";
import BrandsGrid from "@/components/organisms/BrandsGrid";
import { mockProducts } from "@/utils/data/mockProducts";
import { useAppDispatch } from "@/store/hooks";
import { useEffect } from "react";
import { fetchProducts } from "@/store/productSlice";
import { fetchBrand, fetchBrands } from "@/store/brandSlice";
import { fetchCategories } from "@/store/categoriesSlice";

const HomePage = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchProducts({ page: 1, page_size: 10 }));
    dispatch(fetchBrands({ page: 1, page_size: 10 }));
    dispatch(fetchCategories({ page: 1, page_size: 10 }));
  }, [dispatch]);

  return (
    <>
      <HeroSection />
      <ProductGrid
        products={mockProducts.slice(0, 3)}
        title="Productos Destacados"
      />
      <BrandsGrid />
    </>
  );
};

export default HomePage;
