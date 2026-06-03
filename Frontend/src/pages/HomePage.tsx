import HeroSection from "@/components/organisms/HeroSection";
import ProductGrid from "@/components/organisms/ProductGrid";
import BrandsGrid from "@/components/organisms/BrandsGrid";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useEffect } from "react";
import { fetchAllProducts } from "@/store/productSlice";
import { fetchAllBrands } from "@/store/brandSlice";
import WhatsAppFloat from "@/components/WhatsAppFloat";

const HomePage = () => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchAllProducts({ is_active: true }));
    dispatch(fetchAllBrands());
  }, [dispatch]);

  const { list } = useAppSelector((state) => state.products);

  const productFilter = () => {
    return list.filter((product) => product.is_featured);
  };
  return (
    <>
      <div style={{ position: "relative" }}>
        <HeroSection />
      </div>
      {productFilter().length > 0 && (
        <ProductGrid products={productFilter()} title="Productos Destacados" />
      )}
      <BrandsGrid />
     {/* <WhatsAppFloat />*/}
    </>
  );
};

export default HomePage;
