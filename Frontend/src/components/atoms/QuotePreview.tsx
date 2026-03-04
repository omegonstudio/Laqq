// components/quotes/QuotePreviewDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createQuote,
  createQuoteItem,
  deleteQuoteItem,
  updateQuote,
  updateQuoteItem,
} from "@/store/quotesSlice";
import {
  QuoteRender,
  QuoteItemRender,
  QuoteUpdatePayload,
  QuoteStateType,
  QuoteTypeEnum,
  UserData,
} from "@/types/api";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CopyIcon, PencilIcon, Plus, Trash2 } from "lucide-react";
import Button from "./Button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  convertQuotesState,
  convertQuotesTypes,
  revertQuotesState,
  revertQuotesTypes,
} from "@/utils/quotesConvert";
import { fetchUsers } from "@/store/usersSlice";
import { toast } from "@/hooks/use-toast";
import { ProductSearchCombobox } from "../molecules/ProductSearch";
import { Product } from "@/types/types";
import InputField from "./InputField";
import { fetchAllProducts } from "@/store/productSlice";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: QuoteRender | null;
}

interface EditableData {
  state: QuoteStateType; // Valor REAL (no convertido)
  quote_type: QuoteTypeEnum; // Valor REAL (no convertido)
  items: QuoteItemRender[];
  user: UserData;
}

const QuotePreviewDialog = ({ open, onOpenChange, quote }: Props) => {
  const dispatch = useAppDispatch();
  const { list: users } = useAppSelector((state) => state.users);
  const { user } = useAppSelector((state) => state.auth);
  const { list: products, loading: loadingProducts } = useAppSelector(
    (state) => state.products
  );
  const [newProducts, setNewProducts] = useState<QuoteItemRender[]>([]);
  const [edit, setEdit] = useState(false);
  const [formState, setFormState] = useState<EditableData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (!open) {
      setEdit(false);
      setFormState(null);
    }
  }, [open]);

  useEffect(() => {
    dispatch(fetchUsers({ page: 1, page_size: 50 }));
    dispatch(fetchAllProducts({}));
  }, [dispatch]);

  useEffect(() => {
    if (quote) {
      setFormState({
        state: revertQuotesState(quote.state), // Convertir de vuelta a valor real
        quote_type: revertQuotesTypes(quote.quote_type), // Convertir de vuelta a valor real
        items: quote.items ? [...quote.items] : [],
        user: users.find((item) => item.id === quote.user) as UserData,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote]);

  const quotesTypes = useAppSelector((state) => state.quotes.types);
  const quotesStates = useAppSelector((state) => state.quotes.states);

  useEffect(() => {
    if (!formState) return;
    setNewProducts(formState.items ?? []);
  }, [formState]);

  if (!quote || !formState) {
    return null;
  }

  const contact = quote.contact;

  const calculateTotal = (): number => {
    return formState.items.reduce((total, item) => {
      return total + parseFloat(item.subtotal || "0");
    }, 0);
  };

  const handleCancel = () => {
    setFormState({
      state: quote.state,
      quote_type: quote.quote_type,
      items: quote.items ? [...quote.items] : [],
      user: users.find((item) => item.id === quote.user) as UserData,
    });
    setEdit(false);
  };
  const getProductById = (productId: string) =>
    products.find((p) => p.id === productId) ?? null;

  const updateItemProduct = (index: number, product: Product | null) => {
    setNewProducts((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              product: product
                ? { ...product, created_at: "", updated_at: "" }
                : null,
            }
          : item
      )
    );
  };
  const updateItemQuantity = (index: number, quantity: number) => {
    setNewProducts((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: quantity < 0 ? 0 : quantity } : item
      )
    );
  };
  const updateItemPrice = (index: number, value: string) => {
    setNewProducts((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const unitPrice = parseFloat(value) || 0;
        const subtotal = (unitPrice * item.quantity).toFixed(2);

        return {
          ...item,
          unit_price: value,
          subtotal,
        };
      })
    );
  };
  const removeItem = (index: number) => {
    setNewProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setNewProducts((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        quote: quote.id,
        product: null,
        quantity: 1,
        unit_price: "0",
        subtotal: "0",
      },
    ]);
  };

  console.log("Form State:", newProducts);
  const handleSave = async () => {
    if (!formState || !contact) return;

    setIsLoading(true);

    try {
      /* 1️⃣ Update quote (metadata) */
      await dispatch(
        updateQuote({
          id: quote.id,
          data: {
            contact_id: contact.id,
            message: quote.message,
            total_amount: calculateTotal().toFixed(2),
            user: formState.user.id,
            quote_type: formState.quote_type,
            state: formState.state,
          },
        })
      ).unwrap();

      const allItems = newProducts;
      const existingItems = quote.items ?? [];

      /* 2️⃣ Clasificación */
      const itemsToCreate = allItems.filter((i) => i.id.startsWith("new-"));

      const itemsToUpdate = allItems.filter(
        (i) =>
          !i.id.startsWith("new-") &&
          existingItems.some((orig) => orig.id === i.id)
      );

      const itemsToDelete = existingItems.filter(
        (orig) => !allItems.some((i) => i.id === orig.id)
      );

      /* 3️⃣ Ejecutar operaciones */
      await Promise.all([
        // CREATE
        ...itemsToCreate.map((item) =>
          dispatch(
            createQuoteItem({
              quote: quote.id,
              product: item.product.id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              subtotal: item.subtotal,
            })
          ).unwrap()
        ),

        // UPDATE
        ...itemsToUpdate.map((item) =>
          dispatch(
            updateQuoteItem({
              id: item.id,
              data: {
                quote: quote.id,
                product: item.product.id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                subtotal: item.subtotal,
              },
            })
          ).unwrap()
        ),

        // DELETE
        ...itemsToDelete.map((item) =>
          dispatch(deleteQuoteItem(item.id)).unwrap()
        ),
      ]);

      toast({ title: "Cotización actualizada correctamente" });
      setEdit(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error al actualizar la cotización",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cotización #{quote.quote_number}</DialogTitle>
        </DialogHeader>

        {contact && (
          <div className="border rounded p-3 grid grid-cols-2 gap-4">
            <p>Empresa: {contact.company_name}</p>
            <div className="flex items-center justify-between gap-2">
              <Link className="underline" to={`mailto:${contact.email}`}>
                {contact.email}
              </Link>
              {contact.email && (
                <CopyIcon
                  className="cursor-pointer text-blue-200 hover:text-blue-500"
                  size={18}
                  onClick={() => {
                    navigator.clipboard.writeText(contact.email);
                    toast({ title: "Correo copiado" });
                  }}
                />
              )}
            </div>
            <p>
              {contact.first_name} {contact.last_name}
            </p>
            <div className="flex items-center justify-between gap-2">
              <p>{contact.phone}</p>
              {contact.phone && (
                <CopyIcon
                  className="cursor-pointer text-blue-200 hover:text-blue-500"
                  size={18}
                  onClick={() => {
                    navigator.clipboard.writeText(contact.phone);
                    toast({ title: "Teléfono copiado" });
                  }}
                />
              )}
            </div>
          </div>
        )}
        <p className="font-medium">Mensaje:</p>
        <div className="border rounded p-3">
          {contact?.message ? (
            <>
              <p>{contact.message}</p>
            </>
          ) : (
            <p className="text-muted-foreground">Sin mensaje</p>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm h-[4rem] m-h-fit">
          <div>
            <label>Estado</label>
            {edit ? (
              <Select
                value={formState.state} // Valor real
                onValueChange={(value: QuoteStateType) =>
                  setFormState((prev) =>
                    prev ? { ...prev, state: value } : null
                  )
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quotesStates.map((state) => (
                    <SelectItem key={state.id} value={state.name}>
                      {convertQuotesState(state.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-muted-foreground">
                {convertQuotesState(formState.state as QuoteStateType)}
              </p>
            )}
          </div>

          <div>
            <label>Tipo</label>
            {edit ? (
              <Select
                value={formState.quote_type} // Valor real
                onValueChange={(value: QuoteTypeEnum) =>
                  setFormState((prev) =>
                    prev ? { ...prev, quote_type: value } : null
                  )
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quotesTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {convertQuotesTypes(type.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-muted-foreground">
                {convertQuotesTypes(formState.quote_type as QuoteTypeEnum)}
              </p>
            )}
          </div>
          <div>
            <label>Usuario asignado</label>
            {edit ? (
              <Select
                value={formState?.user?.id ?? ""}
                onValueChange={(userId) => {
                  const selectedUser = users.find((u) => u.id === userId);
                  if (!selectedUser) return;

                  setFormState((prev) =>
                    prev ? { ...prev, user: selectedUser } : null
                  );
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>

                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-muted-foreground">
                {formState?.user
                  ? `${formState.user.first_name} ${formState.user.last_name}`
                  : "Ninguno"}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium mb-1">Creación</p>
            <p className="text-muted-foreground">{quote.created_at}</p>
          </div>
          <div>
            <p className="font-medium mb-1">Actualización</p>
            <p className="text-muted-foreground">{quote.updated_at}</p>
          </div>
        </div>
        <div className="space-y-3 flex items-center justify-between h-[3rem]">
          <h3 className="text-lg font-semibold">Productos</h3>
          {edit && (
            <Button
              type="button"
              variant="ghost"
              color="primary"
              size="sm"
              className="!mt-0"
              onClick={addItem}
            >
              <Plus className="w-4 h-4 mr-1" /> Agregar Producto
            </Button>
          )}
        </div>
        {!edit && formState.items.length > 0 && (
          <div className="border rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="text-center p-2 w-1/4 font-medium">
                    Producto
                  </th>
                  <th className="text-center p-2 w-1/4 font-medium">Código</th>
                  <th className="text-center p-2 w-1/4 font-medium">Cant.</th>
                  <th className="text-center p-2 w-1/4 font-medium">
                    Precio unitario
                  </th>
                  <th className="text-center p-2 w-1/4 font-medium">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {formState.items.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`h-12 ${
                      index % 2 === 0 ? "bg-background" : "bg-muted/50"
                    }`}
                  >
                    <td className="p-2 text-center">{item.product.name}</td>
                    <td className="p-2 text-center">
                      {item.product.product_code}
                    </td>
                    <td className="p-2 text-center">{item.quantity}</td>
                    <td className="p-2 text-center whitespace-nowrap">
                      {`$ ${parseFloat(item.unit_price).toFixed(2)}`}
                    </td>
                    <td className="p-2 text-center font-medium whitespace-nowrap">
                      {`$ ${parseFloat(item.subtotal).toFixed(2)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {edit && (
          <>
            {newProducts.map((item, index) => {
              const selectedProduct = item.product
                ? getProductById(item.product.id)
                : null;

              return (
                <div
                  key={item.id ?? index}
                  className="grid grid-cols-2 gap-2 items-end"
                >
                  <ProductSearchCombobox
                    products={products}
                    selectedProduct={selectedProduct}
                    onSelect={(product) => updateItemProduct(index, product)}
                  />

                  <div className="flex items-end gap-2">
                    <div>
                      <label className="text-xs">Cantidad:</label>
                      <InputField
                        type="number"
                        value={item.quantity}
                        min={0}
                        onChange={(e) =>
                          updateItemQuantity(
                            index,
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        className={
                          item.quantity === 0 ? "border-yellow-500" : ""
                        }
                      />
                    </div>

                    <div>
                      <label className="text-xs">Precio:</label>
                      <InputField
                        type="number"
                        value={item.unit_price}
                        min={0}
                        onChange={(e) => updateItemPrice(index, e.target.value)}
                      />
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
          </>
        )}

        <div className="text-right text-lg font-semibold pt-2 border-t">
          Total: $
          {edit
            ? calculateTotal().toFixed(2)
            : parseFloat(quote.total_amount || "0").toFixed(2)}
        </div>
        {user?.is_superuser && (
          <div className="flex justify-between items-center pt-2">
            <Button
              variant={edit ? "secondary" : "primary"}
              size="sm"
              className="gap-2"
              onClick={() => (edit ? handleCancel() : setEdit(true))}
              disabled={isLoading}
            >
              {edit ? "Cancelar" : "Editar"}
              {!edit && <PencilIcon size={15} />}
            </Button>
            {edit && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? "Guardando..." : "Guardar cambios"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuotePreviewDialog;
