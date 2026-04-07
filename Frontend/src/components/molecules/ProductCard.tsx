import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/types/types";
import Badge from "../atoms/Badge";
import Button from "../atoms/Button";
import { useCart } from "@/contexts/CartContext";
import placeholderImage from "@/assets/laqq_marca_color_neg.svg";
import placeholderImageDark from "@/assets/laqq_marca_color_pos.svg";
import { useTheme } from "next-themes";
import Logo from "@/components/atoms/Logo";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart, addVariantToCart } = useCart();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();

    const specs = product.fixed_specs ?? [];
    const specsCount = specs.length;

    // 🔹 Sin variantes
    if (specsCount === 0) {
      addToCart(product);
      return;
    }

    // 🔹 Una sola variante → agregar directamente
    if (specsCount === 1) {
      const spec = specs[0];

      addVariantToCart(product, spec, spec.code);
      return;
    }

    // 🔹 Más de una → ir al detalle
    navigate(`/product/${product.id}`);
  };
  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:scale-[1.02] hover:border-primary/50 transition-all duration-300 group">
      <div className="aspect-square bg-muted rounded-xl mb-4 overflow-hidden relative">
        <Link to={`/product/${product.id}`}>
          <img
            src={
              product.image_url
                ? product.image_url
                : resolvedTheme === "dark"
                ? placeholderImage
                : placeholderImageDark
            }
            alt={product.name}
            className="w-full h-full object-contain p-4 cursor-pointer transition-transform duration-300 group-hover:scale-110"
          />
        </Link>
      </div>

      <Badge variant="primary" className="mb-2">
        {product.brand}
      </Badge>

      <Link to={`/product/${product.id}`}>
        <h3 className="text-lg font-bold mb-2 line-clamp-2 hover:underline">
          {product.name}
        </h3>
      </Link>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {product.description}
      </p>

      <div className="flex gap-2">
        <Button
          variant="primary"
          className="flex-1 flex items-center justify-center gap-2"
          onClick={handleAddToCart}
        >
          <ShoppingCart size={16} />
          Agregar
        </Button>
        <Link to={`/product/${product.id}`} className="flex-1">
          <Button variant="outline" className="w-full">
            Ver Detalles
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
