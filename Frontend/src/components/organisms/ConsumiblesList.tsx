import { ConsumiblesProduct } from "@/types/types";
import { Loader2, PackageSearch, FileText, ShieldCheck, FileDown, Files, } from "lucide-react";
import Button from "../atoms/Button";
import { useNavigate } from "react-router-dom";

interface ConsumiblesListProps {
  products: ConsumiblesProduct[];
  title?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loading?: boolean;
}

const ConsumiblesList = ({
  products,
  title,
  hasMore = false,
  onLoadMore,
  loading = false,
}: ConsumiblesListProps) => {
  if (loading && products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!loading && products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <PackageSearch className="mx-auto w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-xl font-semibold">
          No se encontraron consumibles
        </p>
      </div>
    );
  }


  const navigate = useNavigate();

  return (
    <section className="pb-10">
      <div className="container mx-auto px-4">

        {title && (
          <h2 className="text-3xl font-bold mb-6">
            {title}
          </h2>
        )}

        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">

          <table className="w-full">

            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="px-4 py-4 text-left w-28">Artículo</th>
                <th className="px-4 py-4 text-left">Detalle</th>
                <th className="px-4 py-4 text-center w-40">CAS</th>
                <th className="px-4 py-4 text-center w-28">Sedronar</th>
                <th className="px-4 py-4 text-center w-20">ESP</th>
                <th className="px-4 py-4 text-center w-20">HDS</th>
              </tr>
            </thead>

            <tbody>

              {products.map((product) => (

                  <tr
                    key={product.id}
                    className="border-b hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                  <td className="px-4 py-4 font-medium">
                    {product.code}
                  </td>

                  <td className="px-4 py-4">
                    {product.name}
                  </td>

                  <td className="px-4 py-4 text-center">
                    {product.cas || "-"}
                  </td>

                  <td className="px-4 py-4 text-center">
                    {product.sedronar ? (
                      <ShieldCheck className="mx-auto w-5 h-5 text-green-600" />
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="px-4 py-4 text-center">
                  {product.especificacion_pdf ? (
                    <a
                      href={product.especificacion_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Descargar especificación PDF"
                      className="inline-flex items-center justify-center p-2 rounded-md hover:bg-muted transition-colors"

                    >
                      <FileDown className="mx-auto w-5 h-5 hover:text-primary transition-colors" />
                    </a>
                  ) : (
                    "-"
                  )}
                </td>

                      <td className="px-4 py-4 text-center">
                  {product.hds_pdf ? (
                    <a
                      href={product.hds_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Descargar HDS"
                      className="inline-flex items-center justify-center p-2 rounded-md hover:bg-muted transition-colors"

                    >
                      <Files className="mx-auto w-5 h-5 hover:text-primary transition-colors" />
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                </tr>

              ))}

            </tbody>

          </table>
        </div>

        {hasMore && (
          <div className="flex justify-center mt-8">

            <Button
              onClick={onLoadMore}
              disabled={loading}
              size="lg"
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                "Ver más consumibles"
              )}
            </Button>

          </div>
        )}

      </div>
    </section>
  );
};

export default ConsumiblesList;