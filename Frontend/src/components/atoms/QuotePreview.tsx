// components/quotes/QuotePreviewDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateQuote, updateQuoteItem } from "@/store/quotesSlice";
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
import { CopyIcon, PencilIcon } from "lucide-react";
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
  }, [quote]);

  const quotesTypes = useAppSelector((state) => state.quotes.types);
  const quotesStates = useAppSelector((state) => state.quotes.states);

  if (!quote || !formState) {
    return null;
  }

  const contact = quote.contact;

  const handleUnitPriceChange = (itemId: string, newPrice: string) => {
    setFormState((prev) => {
      if (!prev) return null;

      const updatedItems = prev.items.map((item) => {
        if (item.id === itemId) {
          const quantity = item.quantity;
          const unitPrice = parseFloat(newPrice) || 0;
          const subtotal = (quantity * unitPrice).toFixed(2);

          return {
            ...item,
            unit_price: newPrice,
            subtotal,
          };
        }
        return item;
      });

      return {
        ...prev,
        items: updatedItems,
      };
    });
  };

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

  const handleSave = async () => {
    if (!formState || !contact) return;

    setIsLoading(true);

    try {
      const quotePayload: QuoteUpdatePayload = {
        contact: {
          id: contact.id,
          company_name: contact.company_name,
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          country: contact.country,
          message: contact.message,
          state: contact.state,
          assigned_user: contact.assigned_user,
        },
        contact_id: contact.id,
        message: quote.message,
        total_amount: calculateTotal().toFixed(2),
        user: formState.user.id,
        quote_type: formState.quote_type, // Ya está en valor real
        state: formState.state, // Ya está en valor real
      };

      await dispatch(
        updateQuote({ id: quote.id, data: quotePayload })
      ).unwrap();

      const itemsToUpdate = formState.items.filter((item, index) => {
        const originalItem = quote.items?.[index];
        return (
          originalItem &&
          (item.unit_price !== originalItem.unit_price ||
            item.subtotal !== originalItem.subtotal)
        );
      });

      await Promise.all(
        itemsToUpdate.map((item) =>
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
        )
      );

      toast({ title: "Cotización actualizada correctamente" });
      setEdit(false);
    } catch (error) {
      console.error("Error al actualizar cotización:", error);
      toast({
        title: "Error al actualizar la cotización",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  console.log(users, "AAAAAAAAAAAAAA");
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
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium mb-1">Estado</p>
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
            <p className="font-medium mb-1">Tipo</p>
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
            <p className="font-medium mb-1">Usuario asignado</p>
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

        {formState.items.length > 0 && (
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
                    <td className="p-2 text-center">
                      {edit ? (
                        <span className="inline-flex items-center justify-center gap-1">
                          $
                          <Input
                            value={item.unit_price}
                            type="number"
                            step="0.01"
                            min="0"
                            className="h-8 py-1 px-2 w-24 text-center text-xs"
                            onChange={(e) =>
                              handleUnitPriceChange(item.id, e.target.value)
                            }
                          />
                        </span>
                      ) : (
                        `$${parseFloat(item.unit_price).toFixed(2)}`
                      )}
                    </td>
                    <td className="p-2 text-center font-medium">
                      ${parseFloat(item.subtotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="text-right text-lg font-semibold pt-2 border-t">
          Total: $
          {edit
            ? calculateTotal().toFixed(2)
            : parseFloat(quote.total_amount || "0").toFixed(2)}
        </div>

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
      </DialogContent>
    </Dialog>
  );
};

export default QuotePreviewDialog;
