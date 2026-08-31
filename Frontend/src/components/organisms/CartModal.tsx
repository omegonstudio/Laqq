import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import Button from "@/components/atoms/Button";
import { Link } from "react-router-dom";
import placeholderImage from "@/assets/laqq_marca_color_neg.svg";
import { ensureHttpsUrl } from "@/utils/secureUrl";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartModal = ({ isOpen, onClose }: CartModalProps) => {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems } =
    useCart();

  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background z-50 shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold">Carrito ({totalItems})</h2>
          <button
            onClick={onClose}
            className="min-h-11 min-w-11 p-2 hover:bg-muted rounded-lg transition-colors inline-flex items-center justify-center"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-muted-foreground mb-4">
                Tu carrito está vacío
              </p>
              <Link to="/products" onClick={onClose}>
                <Button variant="outline">Ver Productos</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0">
                      <img
                        src={item.image_url ? ensureHttpsUrl(item.image_url) : placeholderImage}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm mb-1 line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {item.brand}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="min-h-11 min-w-11 p-1 hover:bg-muted rounded transition-colors inline-flex items-center justify-center"
                          aria-label={`Quitar una unidad de ${item.name}`}
                        >
                          <Minus className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="min-h-11 min-w-11 p-1 hover:bg-muted rounded transition-colors inline-flex items-center justify-center"
                          aria-label={`Agregar una unidad de ${item.name}`}
                        >
                          <Plus className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="ml-auto min-h-11 min-w-11 p-1 hover:bg-destructive/10 text-destructive rounded transition-colors inline-flex items-center justify-center"
                          aria-label={`Eliminar ${item.name} del carrito`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-border space-y-3">
            <Button variant="ghost" className="w-full" onClick={clearCart}>
              Vaciar Carrito
            </Button>
            <Link to="/quote" onClick={onClose}>
              <Button className="w-full" size="lg">
                Solicitar Cotización
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default CartModal;
