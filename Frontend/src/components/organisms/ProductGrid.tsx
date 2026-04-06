import { Product } from "@/types/types";
import ProductCard from "../molecules/ProductCard";
import Button from "../atoms/Button";
import { Loader2 } from "lucide-react";
interface ProductGridProps {
  products: Product[];
  title?: string;
  // Props para "Ver más"
  hasMore?: boolean;
  onLoadMore?: () => void;
  loading?: boolean;
}

const ProductGrid = ({
  products,
  title,
  hasMore = false,
  onLoadMore,
  loading = false,
}: ProductGridProps) => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        {title && (
          <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>
        )}

        {products.length === 0 ? (
          <div className="text-center py-16 animate-in fade-in zoom-in-50">
            <div className="inline-block p-8 rounded-2xl bg-muted/50 border-2 border-dashed border-border">
              <p className="text-2xl font-semibold text-muted-foreground mb-2">
                No se encontraron productos
              </p>
              <p className="text-sm text-muted-foreground">
                Intenta ajustar los filtros de búsqueda
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Botón "Ver más" */}
            {hasMore && onLoadMore && (
              <div className="flex justify-center mt-12 animate-in fade-in slide-in-from-bottom-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onLoadMore}
                  disabled={loading}
                  className="min-w-[200px] bg-primary hover:scale-105 transition-transform duration-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    "Ver más productos"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;
