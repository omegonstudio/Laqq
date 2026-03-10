// components/quotes/QuotePreviewDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createQuoteItem,
  deleteQuoteItem,
  fetchQuote,
  updateQuote,
  updateQuoteItem,
} from "@/store/quotesSlice";
import {
  QuoteRender,
  QuoteItemRender,
  QuoteStateType,
  QuoteTypeEnum,
  UserData,
} from "@/types/api";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CopyIcon, PencilIcon, Plus, Trash2 } from "lucide-react";
import Button from "./Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { convertQuotesState, convertQuotesTypes } from "@/utils/quotesConvert";
import { fetchUsers } from "@/store/usersSlice";
import { toast } from "@/hooks/use-toast";
import { ProductSearchCombobox } from "../molecules/ProductSearch";
import { Product } from "@/types/types";
import InputField from "./InputField";
import { fetchAllProducts } from "@/store/productSlice";
import { useUserAdmins } from "@/hooks/useUsers";
import { Textarea } from "../ui/textarea";
import { quotesApi } from "@/lib/api/quotes";
import { DialogDescription } from "@radix-ui/react-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
}

interface EditableData {
  state: QuoteStateType;
  quote_type: QuoteTypeEnum;
  items: (QuoteItemRender & { existing: boolean })[];
  user: UserData;
  message?: string;
  created_at?: string;
  updated_at?: string;
  observaciones: string;
}

const QuotePreviewDialog = ({ open, onOpenChange, quoteId }: Props) => {
  const dispatch = useAppDispatch();
  const { data: users, error } = useUserAdmins({
    page: 1,
    page_size: 50,
  });
  const { user } = useAppSelector((state) => state.auth);
  const { list: products, loading: loadingProducts } = useAppSelector(
    (state) => state.products
  );

  const [newProducts, setNewProducts] = useState<
    (QuoteItemRender & { existing: boolean })[]
  >([]);
  const [edit, setEdit] = useState(false);
  const [userError, setUserError] = useState(false);
  const [formState, setFormState] = useState<EditableData | null>(null);
  const [quote, setQuote] = useState<QuoteRender | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const calculateTotal = (): number => {
    return newProducts.reduce((total, item) => {
      return total + parseFloat(item.subtotal || "0");
    }, 0);
  };
  useEffect(() => {
    const fetchQuoteData = async () => {
      const quoteRequest = await dispatch(fetchQuote(quoteId)).unwrap();
      console.log(quoteRequest, "AAAAA");
      setQuote(quoteRequest);
    };
    fetchQuoteData();
  }, [dispatch, quoteId]);

  useEffect(() => {
    setTotal(calculateTotal());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newProducts]);
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
      setTotal(Number(quote.total_amount));
      setFormState({
        state: quote.state, // Convertir de vuelta a valor real
        quote_type: quote.quote_type, // Convertir de vuelta a valor real
        items: quote.items
          ? quote.items.map((item) => ({ ...item, existing: true }))
          : [],
        user: users.results.find((item) => item.id === quote.user) as UserData,
        observaciones: quote.observaciones,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote]);

  const quotesTypes = useAppSelector((state) => state.quotes.types);
  const quotesStates = useAppSelector((state) => state.quotes.states);

  useEffect(() => {
    if (quote) {
      const items = quote.items
        ? quote.items.map((item) => ({ ...item, existing: true }))
        : [];

      setTotal(Number(quote.total_amount));
      setFormState({
        state: quote.state,
        quote_type: quote.quote_type,
        items,
        user: users.results.find((item) => item.id === quote.user) as UserData,
        observaciones: quote.observaciones,
      });
      setNewProducts(items); // ← inicializa aquí, una sola vez
    }
  }, [quote]);

  if (!quote || !formState) {
    return null;
  }
  const contact = quote.contact;
  if (!quote) {
    return;
  }
  const handleCancel = () => {
    setFormState({
      state: quote.state,
      quote_type: quote.quote_type,
      items: quote.items
        ? quote.items.map((item) => ({ ...item, existing: true }))
        : [],
      user: users.results.find((item) => item.id === quote.user) as UserData,
      observaciones: "",
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
      prev.map((item, i) => {
        if (i !== index) return item;
        const safeQty = quantity < 0 ? 0 : quantity;
        const subtotal = (parseFloat(item.unit_price) * safeQty).toFixed(2);
        return { ...item, quantity: safeQty, subtotal };
      })
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
        existing: false,
      },
    ]);
  };
  console.log(quote);
  const handleSave = async () => {
    if (formState.user === null || formState.user === undefined) {
      toast({
        title: "El usuario es obligatorio",
        variant: "destructive",
      });
      setUserError(true);
      return;
    }

    if (!formState || !contact) return;

    setIsLoading(true);

    try {
      // 1️⃣ Update quote
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
            observaciones: formState.observaciones,
          },
        })
      ).unwrap();

      const allItems = newProducts;
      const existingItems = formState.items ?? [];

      const itemsToCreate = allItems.filter((i) => i.id.startsWith("new-"));
      const itemsToUpdate = allItems.filter(
        (i) =>
          !i.id.startsWith("new-") &&
          existingItems.some((orig) => orig.id === i.id)
      );
      const itemsToDelete = existingItems.filter(
        (orig) => !allItems.some((i) => i.id === orig.id)
      );

      await Promise.all([
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
        ...itemsToDelete.map((item) =>
          dispatch(deleteQuoteItem(item.id)).unwrap()
        ),
      ]);

      // 🔄 4️⃣ REFRESH TOTAL
      const updatedQuote = await dispatch(fetchQuote(quote.id)).unwrap();
      console.log(updatedQuote, "UPDATED QUOTE");
      setFormState({
        state: updatedQuote.state,
        quote_type: updatedQuote.quote_type,
        items:
          updatedQuote.items?.map((item) => ({ ...item, existing: true })) ??
          [],
        user:
          users.results.find((u) => u.id === updatedQuote.user) ??
          formState.user,
        message: updatedQuote.message,
        created_at: updatedQuote.created_at,
        updated_at: updatedQuote.updated_at,
        observaciones: updatedQuote.observaciones,
      });

      toast({ title: "Cotización actualizada correctamente" });
      setEdit(false);
      setUserError(false);
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

  const handleSendClient = async () => {
    setIsLoading(true);

    try {
      await handleSave(); // ⬅️ espera a que termine todo el flujo

      const res = await quotesApi.sendClient(quote.id, {
        contact: quote.contact,
        contact_id: quote.contact.id,
      });
      toast({ title: "Correo enviado al cliente" });
      console.log(res);
    } catch (error) {
      toast({ title: "Error al enviar el correo", variant: "destructive" });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cotización #{quote.quote_number}</DialogTitle>
          <DialogDescription>
            Información y detalle de la cotización.
          </DialogDescription>
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
          <p>{formState.message ?? "Sin mensaje"}</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm h-[4rem] m-h-fit">
          <div>
            <label>Estado</label>
            {edit ? (
              <Select
                value={formState.state || ""} // Valor real
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
                    <SelectItem key={state.id} value={state.id}>
                      {state.name}
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
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
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
              <>
                <Select
                  value={formState?.user?.id ?? ""}
                  onValueChange={(userId) => {
                    const selectedUser = users.results.find(
                      (u) => u.id === userId
                    );
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
                    {users.results.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {userError && (
                  <p className="text-muted-foreground text-red-500">
                    El usuario es obligatorio
                  </p>
                )}
              </>
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
            <p className="text-muted-foreground">{formState.created_at}</p>
          </div>
          <div>
            <p className="font-medium mb-1">Actualización</p>
            <p className="text-muted-foreground">{formState.updated_at}</p>{" "}
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
                  {!item.existing ? (
                    <ProductSearchCombobox
                      products={products}
                      selectedProduct={selectedProduct}
                      onSelect={(product) => updateItemProduct(index, product)}
                    />
                  ) : (
                    <p>{`${item.product?.name} (${item.product?.product_code})`}</p>
                  )}

                  <div className="flex items-end gap-2">
                    <div>
                      <label className="text-xs">Cantidad:</label>
                      <InputField
                        aria-description="Cantidad"
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
                        aria-description="Precio unitario del producto"
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
          Total: ${total}
        </div>
        <label>Observaciones</label>
        <Textarea
          aria-description="Observaciones de la cotización"
          placeholder="Observaciones"
          value={formState.observaciones}
          onChange={(e) =>
            setFormState((prev) =>
              prev ? { ...prev, observaciones: e.target.value } : null
            )
          }
        />
        {user?.is_superuser && (
          <div className="flex grid grid-cols-3 gap-20">
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendClient}
              disabled={isLoading}
            >
              {isLoading ? "Enviando al client..." : "Enviar al cliente"}
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
