import { useMemo, useState } from "react";
import InputField from "../atoms/InputField";
import Button from "../atoms/Button";
import { Product, QuoteFormData, QuoteItem } from "@/types/types";
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
import { createQuote, createQuoteItemsBulk } from "@/store/quotesSlice";
import { QuoteItemUI } from "@/types/api";

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

  // Replace mockProducts with your Redux selector:
  const { list: products, loading: loadingProducts } = useAppSelector(
    (state) => state.products
  );
  // const products = mockProducts;
  console.log(products);
  const [formData, setFormData] = useState<QuoteFormData>({
    name: "",
    company: "",
    email: "",
    phone: "",
    message: "",
  });

  const [items, setItems] = useState<QuoteItemUI[]>([]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        productId: "",
        quantity: 1,
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const getProductById = (productId: string) =>
    products.find((p) => p.id === productId) ?? null;

  const updateItemProduct = (itemId: string, product: Product | null) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, productId: product?.id ?? "" } : item
      )
    );
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Quote request:", formData);
    const quoteResult = await dispatch(createQuote(formData)).unwrap();
    const quoteId = quoteResult.id;

    const bulkPayload = items.map((item) => ({
      quote: quoteId,
      product: item.productId,
      quantity: item.quantity,
    }));

    await dispatch(createQuoteItemsBulk(bulkPayload));

    // toast({ title: "Solicitud Enviada", description: "Nos pondremos en contacto contigo pronto." })
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <InputField
          label="Nombre"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <InputField
          label="Empresa"
          value={formData.company}
          onChange={(e) =>
            setFormData({ ...formData, company: e.target.value })
          }
          required
        />
        <InputField
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <InputField
          label="Teléfono"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
        {items.map((item) => {
          const selectedProduct = getProductById(item.productId);

          return (
            <div key={item.id} className="flex gap-2">
              <ProductSearchCombobox
                products={products}
                selectedProduct={selectedProduct}
                onSelect={(product) => updateItemProduct(item.id, product)}
              />

              <InputField
                type="number"
                value={item.quantity}
                min={1}
                className="w-24"
                onChange={(e) =>
                  updateItemQuantity(item.id, Number(e.target.value) || 1)
                }
              />
            </div>
          );
        })}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Mensaje</label>
        <textarea
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
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
