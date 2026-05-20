import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearSelected, fetchProduct } from "@/store/productSlice";
import placeholderImage from "@/assets/laqq_marca_color_neg.svg";

const ProductDetailPage = () => {
  const [activeTab, setActiveTab] = useState<"details" | "files">("details");
  const { items, addToCart, addVariantToCart, removeFromCart } = useCart();
  const { id } = useParams();
  const {
    selected: product,
    selectedLoading,
    selectedError,
  } = useAppSelector((state) => state.products);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const relatedList = Array.isArray(product?.related)
    ? product.related
    : Array.isArray(product?.related_products)
    ? product.related_products
    : [];

  const variantCount: number = product?.variants?.length ?? 0;
  const isVariantInCart = (variant) => {
    const uniqueId = `${product.id}-${variant.code}`;
    return items.some((item) => item.id === uniqueId);
  };
  const hasVariants = variantCount > 0;
  const hasSingleVariant = variantCount === 1;

  const toggleVariantInCart = (variant) => {
    const uniqueId = `${product.id}-${variant.code}`;

    if (isVariantInCart(variant)) {
      removeFromCart(uniqueId);
    } else {
      addVariantToCart(product, variant, variant.code);
    }
  };
  // Si no hay ninguna de las dos secciones, no mostrar el contenedor
  const variantColumns = useMemo(() => {
    const keys = new Set<string>();

    product?.variants?.forEach((v) => {
      v.technical_specs?.forEach((s) => {
        if (s.key) keys.add(s.key);
      });
    });

    return Array.from(keys);
  }, [product]);
  console.log(variantColumns);
  const hasProductInCart = () => {
    return items.some(
      (item) =>
        item.variantSpecId
          ? item.id.startsWith(product.id) // variantes
          : item.id === product.id // producto simple
    );
  };

  const addCuoteButton = (product) => {
    const variantCount = product?.variants?.length;
    // 1. Ya hay variantes en carrito → solo redirigir
    if (hasProductInCart()) {
      navigate("/quote");
      return;
    }

    // 2. Producto sin variantes
    if (variantCount === 0) {
      addToCart(product);
      navigate("/quote");
      return;
    }

    // 3. Producto con una sola variante
    if (variantCount === 1) {
      const variant = product.variants[0];
      addVariantToCart(product, variant, variant.code);
      navigate("/quote");
      return;
    }

    // 4. Múltiples variantes y ninguna seleccionada
    navigate("/quote");
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchProduct(id));
    }

    // Limpiar el producto seleccionado cuando se desmonte el componente
    return () => {
      dispatch(clearSelected());
    };
  }, [id, dispatch]);
  const isImage = (contentType?: string) => contentType?.startsWith("image/");

  const imageAttachments =
    product?.attachments?.filter((att) => isImage(att.content_type_str)) ?? [];

  const fileAttachments =
    product?.attachments?.filter((att) => !isImage(att.content_type_str)) ?? [];
  const showDetailsSection = hasVariants || fileAttachments.length > 0;
  useEffect(() => {
    if (!hasVariants && fileAttachments.length > 0) {
      setActiveTab("files");
    }
  }, [hasVariants, fileAttachments.length]);
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

  // Construir array de imágenes con la lógica correcta
  // AHORA SÍ podemos usar product de forma segura porque ya verificamos que existe
  const buildImageArray = () => {
    const imageArray = [];

    // 1. Si existe image_url, agregarlo primero
    if (product.image_url) {
      imageArray.push({ url: product.image_url, isMain: true });
    }
    if (imageAttachments.length > 0) {
      const attachmentImages = imageAttachments.map((att) => ({
        url: att.url || att.file,
        isMain: false,
      }));
      imageArray.push(...attachmentImages);
    }
    // 2. Si existen attachments, agregarlos después

    // 3. Si no hay ninguna imagen, usar placeholder
    if (imageArray.length === 0) {
      imageArray.push({ url: placeholderImage, isMain: true });
    }

    return imageArray;
  };
  const images = buildImageArray();
  const totalImages = images.length;

  // Funciones para navegar entre imágenes
  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  // Calcular especificaciones y productos relacionados
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
          <div className="bg-muted rounded-2xl p-8">
            {/* Contenedor de la imagen con altura fija */}
            <div className="relative h-[500px]">
              {" "}
              {/* Altura fija aquí */}
              <div className="flex items-center justify-center h-full mb-4">
                <img
                  src={images[currentImageIndex]?.url || placeholderImage}
                  alt={`${product.name} - Imagen ${currentImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
              {/* Botones de navegación - Solo mostrar si hay más de una imagen */}
              {totalImages > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute left-2 top-1/2 -translate-y-1/2 hover:bg-white p-2 rounded-full shadow-lg transition-all z-10"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft className="w-6 h-6 hover:bg-black" />
                  </button>

                  <button
                    onClick={goToNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-white p-2 rounded-full shadow-lg transition-all z-10"
                    aria-label="Imagen siguiente"
                  >
                    <ChevronRight className="w-6 h-6 hover:bg-black" />
                  </button>
                </>
              )}
            </div>

            {/* Indicadores de puntos / Miniaturas */}
            {totalImages > 1 && (
              <div className="flex gap-2 justify-center mt-4">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? "border-primary scale-110"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image.url || placeholderImage}
                      alt={`Miniatura ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Contador de imágenes */}
            {totalImages > 1 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                {currentImageIndex + 1} / {totalImages}
              </p>
            )}
          </div>

          <div>
            <Badge variant="primary" className="mb-4">
              {product.brand}
            </Badge>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <p className="text-lg text-muted-foreground mb-8 whitespace-pre-line ">
              {product.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {variantCount < 2 ? (
                <Button
                  size="lg"
                  className="flex items-center justify-center gap-2"
                  onClick={() => {
                    if (!hasVariants) {
                      addToCart(product);
                      return;
                    }
                    if (hasSingleVariant) {
                      const variant = product.variants[0];
                      addVariantToCart(product, variant, variant.code);
                      return;
                    }
                  }}
                  disabled={false}
                >
                  <ShoppingCart size={20} />
                  Agregar al carrito
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="flex items-center justify-center gap-2"
                  onClick={() => {
                    document.getElementById("variantes")?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }}
                  disabled={false}
                >
                  <ShoppingCart size={20} />
                  Seleccionar variedad
                </Button>
              )}
              {/* <Link to="/quote"> */}
              <Button
                size="lg"
                variant="outline"
                className="flex items-center justify-center gap-2"
                onClick={() => {
                  addCuoteButton(product);
                }}
              >
                Solicitar Cotización
              </Button>
              {/* </Link> */}
            </div>
          </div>
        </div>

        {/* Solo mostrar esta sección si hay especificaciones o productos relacionados */}
        {showDetailsSection && (
          <div className="bg-card border border-border rounded-2xl p-8 ">
            {/* Tab Bar */}

            {/* Tab: fixed_specs */}
            {hasVariants && (
              <div className="overflow-x-auto">
                <label className="text-2xl text-center font-bold">
                  Variantes del producto
                </label>
                <br />
                <br />
                <table className="w-full border border-border rounded-xl overflow-hidden">
                  <thead className="bg-primary/10">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold">Código</th>
                      <th className="px-4 py-3 text-left font-bold">Nombre</th>
                      <th className="px-4 py-3 text-left font-bold">
                        Dimensiones
                      </th>
                      {variantColumns.map((col) => (
                        <th key={col} className="px-4 py-3 text-left font-bold">
                          {col}
                        </th>
                      ))}

                      <th className="px-4 py-3 text-left font-bold">
                        Agregar al carrito
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {product.variants.map((variant) => (
                      <tr key={variant.id} className="border-t border-border">
                        <td className="px-4 py-3 text-sm font-medium">
                          {variant.code}
                        </td>

                        <td className="px-4 py-3 text-sm font-medium">
                          {variant.name}
                        </td>

                        <td className="px-4 py-3 text-sm font-medium">
                          {variant.dimensions}
                        </td>

                        {variantColumns.map((col) => {
                          const spec = variant.technical_specs?.find(
                            (s) => s.key === col
                          );

                          return (
                            <td key={col} className="px-4 py-3 text-sm">
                              {spec?.value || "-"}
                            </td>
                          );
                        })}

                        <td className="px-4 py-3 text-sm">
                          <Button
                            size="sm"
                            variant={
                              isVariantInCart(variant) ? "primary" : "outline"
                            }
                            onClick={() => toggleVariantInCart(variant)}
                          >
                            {isVariantInCart(variant) ? "Quitar" : "+ Agregar"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        <br />
        {fileAttachments.length > 0 && (
          <div className="space-y-4 bg-muted/30 border p-6 rounded-sm">
            <label className="text-2xl text-center font-bold">
              Información adicional
            </label>

            <div className="grid lg:grid-cols-2 gap-5 mb-12">
              {fileAttachments.map((file) => (
                <div
                  key={file.id}
                  onClick={() => window.open(file.url || file.file, "_blank")}
                  className="cursor-pointer border rounded-lg p-4 flex items-center gap-3 hover:bg-muted transition-colors w-full overflow-hidden"
                >
                  <div className="text-2xl shrink-0">📄</div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.file_name}</p>

                    <p className="text-muted-foreground text-xs truncate">
                      {file.content_type_str}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <br />
        {relatedList.length > 0 && (
          <div className="space-y-4 bg-muted/30 border p-6 rounded-sm">
            <label className="text-2xl text-center font-bold">
              Productos relacionados
            </label>
            <br />
            <div className="grid lg:grid-cols-2 gap-5 mb-12">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
