import { useEffect, useMemo, useState } from "react";
import InputField from "../atoms/InputField";
import Button from "../atoms/Button";
import { Product } from "@/types/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuoteFormState } from "@/types/api";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createQuoteFromForm } from "@/store/quotesSlice";
import { ProductSearchCombobox } from "./ProductSearch";

const initialState: QuoteFormState = {
  contact: {
    id: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    country: "Argentina",
    message: "",
    company_name: "",
    state: "PENDING", // Agregado según ContactInfo
    assigned_user: null, // Agregado según ContactInfo
  },
  quote: {
    quote_type: "EQUIPMENT",
    message: "",
    state: "PENDING",
    user: null,
  },
  items: [],
};

function QuoteForm() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items: itemsCart, clearCart } = useCart();

  const { list: products, loading: loadingProducts } = useAppSelector(
    (state) => state.products
  );
  const { creating } = useAppSelector((state) => state.quotes);

  const [formState, setFormState] = useState<QuoteFormState>(initialState);

  // Sincronizar items del carrito con el formulario
  useEffect(() => {
    if (itemsCart.length > 0) {
      setFormState((prev) => ({
        ...prev,
        items: itemsCart.map((item) => ({
          product: item.id,
          quantity: item.quantity,
          unit_price: "0",
        })),
      }));
    }
  }, [itemsCart]);

  const addItem = () => {
    setFormState((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product: "",
          quantity: 1,
          unit_price: "0",
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const getProductById = (productId: string) =>
    products.find((p) => p.id === productId) ?? null;

  const updateItemProduct = (index: number, product: Product | null) => {
    setFormState((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, product: product?.id ?? "" } : item
      ),
    }));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    setFormState((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, quantity) } : item
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (formState.items.length === 0) {
      toast.error("Debes agregar al menos un producto");
      return;
    }

    if (formState.items.some((item) => !item.product)) {
      toast.error("Todos los items deben tener un producto seleccionado");
      return;
    }

    try {
      const result = await dispatch(createQuoteFromForm(formState)).unwrap();

      toast.success("Cotización creada exitosamente");

      // Limpiar formulario y carrito
      setFormState(initialState);
      clearCart();

      // Opcional: redirigir a la lista de cotizaciones
      // navigate("/quotes");

      console.log("Cotización creada:", result);
    } catch (err) {
      console.error("Error al crear cotización:", err);
      toast.error(err.message || "Error al crear la cotización");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información del contacto */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Información de Contacto</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <InputField
            label="Nombre"
            value={formState.contact.first_name}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                contact: { ...prev.contact, first_name: e.target.value },
              }))
            }
            required
          />
          <InputField
            label="Apellido"
            value={formState.contact.last_name}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                contact: { ...prev.contact, last_name: e.target.value },
              }))
            }
            required
          />
          <InputField
            label="Empresa"
            value={formState.contact.company_name}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                contact: { ...prev.contact, company_name: e.target.value },
              }))
            }
            required
          />
          <InputField
            label="Email"
            type="email"
            value={formState.contact.email}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                contact: { ...prev.contact, email: e.target.value },
              }))
            }
            required
          />
          <InputField
            label="Teléfono"
            type="number"
            value={formState.contact.phone}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                contact: { ...prev.contact, phone: e.target.value },
              }))
            }
            required
          />
          <InputField
            label="País"
            value={formState.contact.country}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                contact: { ...prev.contact, country: e.target.value },
              }))
            }
          />
        </div>
      </div>

      {/* Productos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Productos</h3>
          <Button type="button" variant="ghost" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-1" /> Agregar Producto
          </Button>
        </div>
        {formState.items.map((item, index) => {
          const selectedProduct = getProductById(item.product);
          return (
            <div key={index} className="flex gap-2">
              <ProductSearchCombobox
                products={products}
                selectedProduct={selectedProduct}
                onSelect={(product) => updateItemProduct(index, product)}
              />

              <InputField
                type="number"
                value={item.quantity}
                min={1}
                className="w-24"
                onChange={(e) =>
                  updateItemQuantity(index, Number(e.target.value) || 1)
                }
              />
            </div>
          );
        })}
      </div>

      {/* Mensaje adicional */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Mensaje Adicional
        </label>
        <textarea
          value={formState.contact.message}
          onChange={(e) =>
            setFormState((prev) => ({
              ...prev,
              contact: { ...prev.contact, message: e.target.value },
            }))
          }
          className="w-full px-4 py-2.5 rounded-xl border border-input bg-background min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Información adicional sobre la cotización..."
        />
      </div>

      {/* Botón de envío */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={creating || loadingProducts}
      >
        {creating ? "Creando cotización..." : "Enviar Solicitud"}
      </Button>
    </form>
  );
}

export default QuoteForm;
