import { Product } from "@/types/types";
import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import Button from "../atoms/Button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export function ProductSearchCombobox({
  products,
  selectedProduct,
  onSelect,
  placeholder = "Nombre del producto o código",
}: {
  products: Product[];
  selectedProduct: Product | null;
  onSelect: (product: Product | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredProducts = useMemo(() => {
    const list = searchValue
      ? products.filter((product) => {
          const search = searchValue.toLowerCase();
          // Buscar en nombre del producto
          if (product.name.toLowerCase().includes(search)) return true;
          // Buscar en código del producto
          if (product.product_code.toLowerCase().includes(search)) return true;
          // Buscar en códigos de variantes
          if (
            product.variants?.some((v) =>
              v.code?.toLowerCase().includes(search)
            )
          )
            return true;
          return false;
        })
      : products;
    // Ordenar alfabéticamente por nombre
    return [...list].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" })
    );
  }, [products, searchValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full max-w-full justify-between rounded-xl border-input px-4 py-2.5 h-auto font-normal hover:bg-accent bg-transparent"
        >
          <span className="truncate block flex-1 min-w-0 text-left">
            {selectedProduct ? (
              `${selectedProduct.name} (${selectedProduct.product_code})`
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
        onWheel={(e) => {
          e.stopPropagation();
        }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar producto..."
            value={searchValue}
            onValueChange={setSearchValue}
            aria-description="Buscador de productos"
          />
          <CommandList className="max-h-[200px] overflow-y-auto">
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
