import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearSelected, fetchProduct } from "@/store/productSlice";
import { unifyProductSpecs } from "@/components/atoms/specsTable";
import placeholderImage from "@/assets/laqq_marca_color_neg.svg";

const ProductDetailPage = () => {
  const [activeTab, setActiveTab] = useState<"details" | "related">("details");
  const { addToCart } = useCart();
  const { id } = useParams();
  const {
    selected: product,
    selectedLoading,
    selectedError,
  } = useAppSelector((state) => state.products);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      dispatch(fetchProduct(id));
    }

    // Limpiar el producto seleccionado cuando se desmonte el componente
    return () => {
      dispatch(clearSelected());
    };
  }, [id, dispatch]);

  // Mostrar loading mientras carga
  if (selectedLoading) {
    return (
      <div className="py-16">
        <div className="container mx-auto px-4 text-center">
          <p>Cargando producto...</p>
        </div>
      </div>
    );
  }

  // Mostrar error si hay error
  if (selectedError) {
    return (
      <div className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">
            Error al cargar el producto
          </h1>
          <p className="text-muted-foreground mb-4">{selectedError}</p>
          <Link to="/products">
            <Button>Volver al Catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Mostrar mensaje si no hay producto
  if (!product) {
    return (
      <div className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
          <Link to="/products">
            <Button>Volver al Catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calcular especificaciones y productos relacionados
  const unifiedSpecs = unifyProductSpecs(product);
  const relatedList = product.related || product.related_products || [];
  const hasSpecs = unifiedSpecs.length > 0;
  const hasRelated = relatedList.length > 0;

  // Si no hay ninguna de las dos secciones, no mostrar el contenedor
  const showDetailsSection = hasSpecs || hasRelated;

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Catálogo
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          <div className="bg-muted rounded-2xl p-8 flex items-center justify-center">
            <img
              src={product.image_url ? product.image_url : placeholderImage}
              alt={product.image_url}
              className="max-w-full max-h-96 object-contain"
            />
          </div>

          <div>
            <Badge variant="primary" className="mb-4">
              {product.brand}
            </Badge>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <p className="text-lg text-muted-foreground mb-8">
              {product.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="flex items-center justify-center gap-2"
                onClick={() => addToCart(product)}
              >
                <ShoppingCart size={20} />
                Agregar al Carrito
              </Button>
              <Link to="/quote">
                <Button size="lg" variant="outline" className="w-full">
                  Solicitar Cotización
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Solo mostrar esta sección si hay especificaciones o productos relacionados */}
        {showDetailsSection && (
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="flex gap-4 mb-6 border-b border-border">
              {hasSpecs && (
                <button
                  onClick={() => setActiveTab("details")}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === "details"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Especificaciones
                </button>
              )}
              {hasRelated && (
                <button
                  onClick={() => setActiveTab("related")}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === "related"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Productos Relacionados
                </button>
              )}
            </div>

            {activeTab === "details" && hasSpecs && (
              <div className="overflow-x-auto">
                <table className="w-full border border-border rounded-xl overflow-hidden">
                  <thead className="bg-primary/10">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold">
                        Especificación
                      </th>
                      <th className="px-4 py-3 text-left font-bold">Valor</th>
                    </tr>
                  </thead>

                  <tbody>
                    {unifiedSpecs.map((spec, index) => (
                      <tr key={index} className="border-t border-border">
                        <td className="px-4 py-3 text-sm font-medium">
                          {spec.specification}
                        </td>
                        <td className="px-4 py-3 text-sm">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "related" && hasRelated && (
              <div className="space-y-4">
                {relatedList.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => navigate(`/product/${item.id}`)}
                    className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="secondary" className="mb-2">
                          {item.brand || "Relacionado"}
                        </Badge>
                        <h3 className="font-bold mb-1">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Código: {item.product_code}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
