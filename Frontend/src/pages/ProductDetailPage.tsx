import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import { useEffect, useMemo, useState, useRef } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearSelected, fetchProduct } from "@/store/productSlice";
import { fetchAllCategories } from "@/store/categoriesSlice";
import { hasSpecTableContent } from "@/types/types";
import { buildCatalogCrumbs } from "@/utils/data/categories";
import CatalogBreadcrumb from "@/components/molecules/CatalogBreadcrumb";
import placeholderImage from "@/assets/laqq_marca_color_neg.svg";

const formatDescription = (description: string) => {
  if (!description) return "";
  const tables: string[] = [];
  let content = description.replace(/<table[\s\S]*?<\/table>/gi, (match) => {
    tables.push(match);
    return `__TABLE_${tables.length - 1}__`;
  });
  // Convertir saltos de línea a <br />, cubriendo \n, \r\n y \r
  content = content.replace(/\r?\n|\r/g, "<br />");
  content = content.replace(
    /__TABLE_(\d+)__/g,
    (_, index) => tables[Number(index)]
  );
  return content;
};

const ProductDetailPage = () => {
  // ─── ZONA 1: Hooks que NO dependen de derivaciones ───────────────────────
  const [activeTab, setActiveTab] = useState<"details" | "files">("details");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { items, addToCart, addVariantToCart, removeFromCart } = useCart();
  const { id } = useParams();
  const {
    selected: product,
    selectedLoading,
    selectedError,
  } = useAppSelector((state) => state.products);
  const { list: categories } = useAppSelector((state) => state.categories);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const variantsRef = useRef<HTMLDivElement>(null);

  const variantColumns = useMemo(() => {
    const keys = new Set<string>();
    product?.variants?.forEach((v) => {
      v.technical_specs?.forEach((s) => {
        if (s.key) keys.add(s.key);
      });
    });
    return Array.from(keys);
  }, [product]);

  useEffect(() => {
    if (id) dispatch(fetchProduct(id));
    return () => {
      dispatch(clearSelected());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchAllCategories({}));
    }
  }, [categories.length, dispatch]);

  // ─── ZONA 2: Derivaciones ─────────────────────────────────────────────────
  const isImage = (contentType?: string) => contentType?.startsWith("image/");
  const variantCount = product?.variants?.length ?? 0;
  const hasVariants = variantCount > 0;
  const hasSingleVariant = variantCount === 1;
  const relatedList = Array.isArray(product?.related)
    ? product.related
    : Array.isArray(product?.related_products)
    ? product.related_products
    : [];
  const imageAttachments =
    product?.attachments?.filter((att) => isImage(att.content_type_str)) ?? [];
  const fileAttachments =
    product?.attachments?.filter((att) => !isImage(att.content_type_str)) ?? [];
  const specTable = product?.spec_table;
  const showSpecTable = hasSpecTableContent(specTable);
  const showDetailsSection = hasVariants || fileAttachments.length > 0;
  const crumbs = useMemo(
    () =>
      buildCatalogCrumbs({
        categories,
        categoryId: product?.category_id,
        productName: product?.name,
      }),
    [categories, product?.category_id, product?.name]
  );

  // ─── ZONA 2b: useEffect que depende de las derivaciones ──────────────────
  useEffect(() => {
    if (!hasVariants && fileAttachments.length > 0) {
      setActiveTab("files");
    }
  }, [hasVariants, fileAttachments.length]);

  // ─── ZONA 3: Early returns ────────────────────────────────────────────────
  if (selectedLoading) {
    return (
      <div className="py-16">
        <div className="container mx-auto px-4 text-center">
          <p>Cargando producto...</p>
        </div>
      </div>
    );
  }

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

  // ─── ZONA 4: Lógica que requiere product garantizado ──────────────────────
  const formattedDescription = formatDescription(product.description);

  const buildImageArray = () => {
    const imageArray = [];
    if (product.image_url) {
      imageArray.push({ url: product.image_url, isMain: true });
    }
    if (imageAttachments.length > 0) {
      imageArray.push(
        ...imageAttachments.map((att) => ({
          url: att.url || att.file,
          isMain: false,
        }))
      );
    }
    if (imageArray.length === 0) {
      imageArray.push({ url: placeholderImage, isMain: true });
    }
    return imageArray;
  };

  const images = buildImageArray();
  const totalImages = images.length;

  const isVariantInCart = (variant) => {
    const uniqueId = `${product.id}-${variant.code}`;
    return items.some((item) => item.id === uniqueId);
  };

  const toggleVariantInCart = (variant) => {
    const uniqueId = `${product.id}-${variant.code}`;
    if (isVariantInCart(variant)) {
      removeFromCart(uniqueId);
    } else {
      addVariantToCart(product, variant, variant.code);
    }
  };

  const hasProductInCart = () => {
    return items.some((item) =>
      item.variantSpecId
        ? item.id.startsWith(product.id)
        : item.id === product.id
    );
  };

  const addCuoteButton = (product) => {
    if (hasProductInCart()) {
      navigate("/quote");
      return;
    }
    if (variantCount === 0) {
      addToCart(product);
      navigate("/quote");
      return;
    }
    if (variantCount === 1) {
      const variant = product.variants[0];
      addVariantToCart(product, variant, variant.code);
      navigate("/quote");
      return;
    }
    navigate("/quote");
  };

  const goToNext = () =>
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
  const goToPrevious = () =>
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
  const goToImage = (index: number) => setCurrentImageIndex(index);

  // ─── ZONA 5: JSX ─────────────────────────────────────────────────────────
  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <CatalogBreadcrumb items={crumbs} className="mb-8" />

            <div className="grid lg:grid-cols-2 gap-12 items-start mb-12">
            <div className="bg-background rounded-2xl p-8 border border-border">            {/* Contenedor de la imagen con altura fija */}
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
              <div className="max-h-[500px] overflow-y-auto pr-3">
                <div
                  className="
                    prose prose-sm
                    max-w-none
                    text-muted-foreground
                    text-justify
                    [--tw-prose-body:currentColor]
                    [--tw-prose-bold:currentColor]
                    [--tw-prose-bullets:currentColor]
                    [--tw-prose-counters:currentColor]
                    whitespace-normal
                    [&_table]:w-full
                    [&_table]:border-collapse
                    [&_table]:my-2
                    [&_th]:border
                    [&_td]:border
                    [&_th]:p-2
                    [&_td]:p-2
                    [&_p]:!text-justify
                    [&_li]:!text-justify
                    [&_td]:!text-justify
                  "
                  dangerouslySetInnerHTML={{
                    __html: formattedDescription,
                  }}
                />
              </div>
            <br />
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
              ) : null}
              {variantCount < 2 ? (
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
              ) : null}
              {variantCount >= 2 ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                  onClick={() => {
                    variantsRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                >
                  Elegir variante
                </Button>
              ) : null}
              {/* </Link> */}
            </div>
          </div>
        </div>

        {showSpecTable && specTable && (
          <div className="bg-card border border-border rounded-2xl p-8 mb-8">
            <p className="font-bold mb-5">Especificaciones técnicas</p>
            <div className="overflow-x-auto">
              <table className="w-full border border-border rounded-xl overflow-hidden text-center">
                <thead className="bg-primary/10">
                  <tr>
                    {specTable.columns.map((col, index) => (
                      <th
                        key={`${col}-${index}`}
                        className="px-4 py-3 text-center font-bold"
                      >
                        {col || "\u00A0"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {specTable.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-border">
                      {specTable.columns.map((_, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-4 py-3 text-sm text-center"
                        >
                          {row[colIndex]?.trim() ? row[colIndex] : "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Solo mostrar esta sección si hay especificaciones o productos relacionados */}
        {showDetailsSection && (
          <div
            ref={variantsRef}
            className="bg-card border border-border rounded-2xl p-8 "
          >
            <div className="flex mb-5">
              {hasVariants && (
                <div
                  onClick={() => setActiveTab("details")}
                  className={`cursor-pointer border-b-2 pb-3 pr-5 ${
                    activeTab === "details"
                      ? "text-primary font-bold border-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <p>Variantes del producto</p>
                </div>
              )}
              {fileAttachments.length > 0 && (
                <div
                  onClick={() => setActiveTab("files")}
                  className={`cursor-pointer border-b-2 pb-3 pl-5 ${
                    activeTab === "files"
                      ? "text-primary font-bold border-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <p>Descargas / Documentos</p>
                </div>
              )}
            </div>
            {hasVariants && activeTab === "details" && (
              <div className="overflow-x-auto">
                <table className="w-full border border-border rounded-xl overflow-hidden text-center">
                  <thead className="bg-primary/10">
                    <tr>
                      <th className="px-4 py-3 text-center font-bold">
                        Modelo
                      </th>

                      {variantColumns.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-3 text-center font-bold"
                        >
                          {col}
                        </th>
                      ))}

                      <th className="px-4 py-3 text-center font-bold">
                        Agregar al carrito
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((variant) => (
                      <tr key={variant.id} className="border-t border-border">
                        <td className="px-4 py-3 text-sm font-medium text-center">
                          {variant.code}
                        </td>

                        {variantColumns.map((col) => {
                          const spec = variant.technical_specs?.find(
                            (s) => s.key === col
                          );
                          return (
                            <td
                              key={col}
                              className="px-4 py-3 text-sm text-center"
                            >
                              {spec?.value || "-"}
                            </td>
                          );
                        })}

                        <td className="px-4 py-3 text-sm text-center">
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
            {fileAttachments.length > 0 && activeTab === "files" && (
              <div className="space-y-4 bg-muted/30 rounded-sm">
                <div className="grid lg:grid-cols-2 gap-5 mb-12">
                  {fileAttachments.map((file) => (
                    <div
                      key={file.id}
                      onClick={() =>
                        window.open(file.url || file.file, "_blank")
                      }
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
          </div>
        )}
        <br />

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
