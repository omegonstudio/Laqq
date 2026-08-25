import { useAppSelector } from "@/store/hooks";
import { Link } from "react-router-dom";
import { useMemo } from "react";
// import { brands } from "@/utils/data/brands";

const BrandsGrid = () => {
  const { list, loading } = useAppSelector((state) => state.brands);
  const sortedBrands = useMemo(
    () =>
      [...list].sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" })
      ),
    [list]
  );

  return (
    <section className="py-16 bg-background" style={{ minHeight: 420 }}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-12 text-center">Marcas Líderes</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 items-center justify-items-center">
          {loading && list.length === 0
            ? Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 w-[120px] animate-pulse rounded-md bg-muted"
                />
              ))
            : sortedBrands.map((brand) => (
                <Link
                  key={brand.id}
                  to={`/products?brand=${brand.id}`}
                  aria-label={`Ver productos de ${brand.name}`}
                  className="flex min-h-11 min-w-[120px] items-center justify-center p-4 grayscale hover:grayscale-0 transition-all duration-300 hover:scale-105"
                >
                  {brand.logo_url ? (
                    <img
                      src={brand.logo_url}
                      alt={brand.name}
                      width={120}
                      height={48}
                      loading="lazy"
                      decoding="async"
                      className="h-12 w-auto max-w-[120px] object-contain"
                    />
                  ) : (
                    <span className="text-xl font-bold text-muted-foreground">
                      {brand.name}
                    </span>
                  )}
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
};

export default BrandsGrid;
