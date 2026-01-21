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
import { create } from "domain";
import {
  createQuote,
  createQuoteFormState,
  createQuoteItemsBulk,
} from "@/store/quotesSlice";
import { QuoteFormState } from "@/types/api";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const initialState: QuoteFormState = {
  contact: {
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    country: "",
    message: "",
    company_name: "",
  },
  quote: {
    quote_type: "EQUIPMENT",
    message: "",
    state: "PENDING",
    user: null,
  },
  items: [],
};

function ProductSearchCombobox({
  products,
  selectedProduct,
  onSelect,
  placeholder = "Nombreee del producto o código",
}: {
  products: Product[];
  selectedProduct: Product | null;
  onSelect: (product: Product | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchValue) return products;
    const search = searchValue.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(search) ||
        product.product_code.toLowerCase().includes(search)
    );
  }, [products, searchValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className="bg-blue-500">
        <Button
          variant="primary"
          role="combobox"
          aria-expanded={open}
          className="w-full bg-red-500 justify-between rounded-xl border-input bg-background px-4 py-2.5 h-auto font-normal hover:bg-background"
        >
          {selectedProduct ? (
            <span className="truncate">
              {selectedProduct.name} ({selectedProduct.product_code})
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar producto..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No se encontraron productos.</CommandEmpty>
            <CommandGroup>
              {filteredProducts.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.id}
                  onSelect={() => {
                    onSelect(product);
                    setOpen(false);
                    setSearchValue("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedProduct?.id === product.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Código: {product.product_code}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function QuoteForm() {
  const dispatch = useAppDispatch();
  const {
    items: itemsCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
  } = useCart();
  // Replace mockProducts with your Redux selector:
  const { list: products, loading: loadingProducts } = useAppSelector(
    (state) => state.products
  );

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      items: itemsCart.map((item) => ({
        product: item.id,
        quantity: item.quantity,
        unit_price: "0", // Ensure `unit_price` exists in `CartItem`
      })),
    }));
  }, [itemsCart]);
  // const products = mockProducts;
  const [formState, setFormState] = useState<QuoteFormState>(initialState);

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

  // const removeItem = (id: string) => {
  //   setItems((prev) => prev.filter((item) => item.id !== id));
  // };

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
        i === index ? { ...item, quantity } : item
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await dispatch(createQuoteFormState(formState)).unwrap();

      // result === QuoteFormState (respuesta de la API)
      toast.success("Cotización creada");

      console.log(result);
      setFormState(initialState);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error("Error al crear la cotización");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        />

        <InputField
          label="Email"
          type="email"
          value={formState.contact.email}
          onChange={(e) =>
            setFormState({
              ...formState,
              contact: { ...formState.contact, email: e.target.value },
            })
          }
          required
        />
        <InputField
          label="Teléfono"
          type="tel"
          value={formState.contact.phone}
          onChange={(e) =>
            setFormState({
              ...formState,
              contact: { ...formState.contact, phone: e.target.value },
            })
          }
          required
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Productos</label>
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

      <div>
        <label className="block text-sm font-medium mb-2">Mensaje</label>
        <textarea
          value={formState.contact.message}
          onChange={(e) =>
            setFormState({
              ...formState,
              contact: { ...formState.contact, message: e.target.value },
            })
          }
          className="w-full px-4 py-2.5 rounded-xl border border-input bg-background min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Información adicional..."
        />
      </div>

      <Button type="submit" size="lg" className="w-full">
        Enviar Solicitud
      </Button>
    </form>
  );
}

export default QuoteForm;
