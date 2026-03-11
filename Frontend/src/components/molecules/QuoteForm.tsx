import { useEffect, useState } from "react";
import InputField from "../atoms/InputField";
import Button from "../atoms/Button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { DeleteIcon, Plus, Trash2, X } from "lucide-react";
import { QuoteFormState } from "@/types/api";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { createQuoteFromForm } from "@/store/quotesSlice";
import { ProductSearchCombobox } from "./ProductSearch";
import { fetchAllProducts } from "@/store/productSlice";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/types/types";

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
    state: null, // Agregado según ContactInfo
    assigned_user: null, // Agregado según ContactInfo
  },
  quote: {
    quote_type: null,
    message: "",
    state: null,
    user: null,
  },
  items: [],
};

function QuoteForm() {
  const dispatch = useAppDispatch();
  const { items: itemsCart, clearCart } = useCart();

  useEffect(() => {
    dispatch(fetchAllProducts({ is_active: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      items: prev.items.map((item, i) => {
        if (i === index) {
          // Permitimos cualquier número, incluyendo 0
          // Si es negativo, lo convertimos a 0
          return { ...item, quantity: quantity < 0 ? 0 : quantity };
        }
        return item;
      }),
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (formState.items.length === 0) {
      toast({
        title: "Debes agregar al menos un producto",
        variant: "destructive",
      });
      return;
    }

    if (formState.items.some((item) => !item.product)) {
      toast({
        title: "Todos los items deben tener un producto seleccionado",
        variant: "destructive",
      });
      return;
    }

    // Validar que ninguna cantidad sea 0
    if (formState.items.some((item) => item.quantity === 0)) {
      toast({
        title: "La cantidad de productos no puede ser 0",
        description:
          "Por favor, ingresa una cantidad válida para todos los productos",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await dispatch(createQuoteFromForm(formState)).unwrap();

      toast({ title: "Cotización creada exitosamente" });

      // Limpiar formulario y carrito
      setFormState(initialState);
      clearCart();
    } catch (err) {
      console.error("Error al crear cotización:", err);
      toast({
        title: err.message || "Error al crear la cotización",
        variant: "destructive",
      });
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
            <div key={index} className="flex gap-2 grid grid-cols-2">
              <ProductSearchCombobox
                products={products}
                selectedProduct={selectedProduct}
                onSelect={(product) => updateItemProduct(index, product)}
              />

              <div className="flex items-center gap-2">
                <div className="w-[80%]">
                  {" "}
                  <InputField
                    type="number"
                    value={item.quantity}
                    min={0}
                    placeholder="1"
                    onChange={(e) => {
                      const value = e.target.value;
                      // Si el campo está vacío, pasamos 0
                      // Esto permite borrar completamente el input
                      updateItemQuantity(
                        index,
                        value === "" ? 0 : Number(value)
                      );
                    }}
                    className={item.quantity === 0 ? "border-yellow-500" : ""}
                  />
                  {item.quantity === 0 && (
                    <span className="text-xs text-yellow-600">Mínimo 1</span>
                  )}
                </div>
                <Button
                  className="bg-transparent text-red-600 hover:bg-red-600 hover:text-white"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 size={20} />
                </Button>
              </div>
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
