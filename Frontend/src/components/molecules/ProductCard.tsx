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

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { resolvedTheme } = useTheme();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
  };
  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
      <div className="aspect-square bg-muted rounded-xl mb-4 overflow-hidden">
        <img
          src={
            product.image_url
              ? product.image_url
              : resolvedTheme === "dark"
              ? placeholderImage
              : placeholderImageDark
          }          
          alt={product.name}
          className="w-full h-full object-contain p-4"
        />
      </div>

      <Badge variant="primary" className="mb-2">
        {product.brand}
      </Badge>

      <h3 className="text-lg font-bold mb-2 line-clamp-2">{product.name}</h3>

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
