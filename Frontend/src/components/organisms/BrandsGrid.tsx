import { useAppSelector } from "@/store/hooks";
import { useNavigate } from "react-router-dom";

// import { brands } from "@/utils/data/brands";

const BrandsGrid = () => {
  const { list, loading } = useAppSelector((state) => state.brands);
  const navigate = useNavigate();

  const handleBrandClick = (brandId: string) => {
    navigate(`/products?brand=${brandId}`);
  };
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-12 text-center">Marcas Líderes</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 items-center justify-items-center">
          {list.map((brand) => (
            <div
              key={brand.id}
              onClick={() => handleBrandClick(brand.id)}
              className="flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer hover:scale-110"
            >
              {brand.logo_url ? (
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="max-h-12 w-auto object-contain"
                />
              ) : (
                <span className="text-xl font-bold text-muted-foreground">
                  {brand.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandsGrid;
