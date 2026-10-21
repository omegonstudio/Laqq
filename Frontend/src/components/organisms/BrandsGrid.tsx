import { useAppSelector } from "@/store/hooks";
import { Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { ensureHttpsUrl } from "@/utils/secureUrl";
// import { brands } from "@/utils/data/brands";

const BrandsGrid = () => {
  const { list, loading, error } = useAppSelector((state) => state.brands);
  const sortedBrands = useMemo(
    () =>
      [...list].sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" })
      ),
    [list]
  );

  // #region agent log
  useEffect(() => {
    const names = sortedBrands.map((b) => b.name);
    fetch("http://127.0.0.1:7282/ingest/ab0e328b-2eba-4587-bb8f-7d705e5fa936", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "5407fd",
      },
      body: JSON.stringify({
        sessionId: "5407fd",
        runId: "pre-fix",
        hypothesisId: "B",
        location: "BrandsGrid.tsx:render-state",
        message: "Home Marcas Lideres brands state",
        data: {
          listLen: list.length,
          sortedLen: sortedBrands.length,
          loading,
          error,
          hasOmegon: names.some((n) => /omegon/i.test(n)),
          withLogo: sortedBrands.filter((b) => !!b.logo_url).length,
          namesSample: names.slice(0, 8),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [list, loading, error, sortedBrands]);
  // #endregion

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
                  to={brand.slug ? `/marcas/${brand.slug}` : `/products?brand=${brand.id}`}
                  aria-label={`Ver productos de ${brand.name}`}
                  className="flex min-h-11 min-w-[120px] items-center justify-center p-4 grayscale hover:grayscale-0 transition-all duration-300 hover:scale-105"
                >
                  {brand.logo_url ? (
                    <img
                      src={ensureHttpsUrl(brand.logo_url)}
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
