// components/quotes/QuotePreviewDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useCanManageQuotes } from "@/hooks/usePermissions";
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
  QuoteCurrency,
  UserData,
  SpecificationsForm,
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
import {
  allowedNextQuoteStates,
  convertQuoteCurrency,
  convertQuotesState,
  convertQuotesTypes,
  currencySymbol,
  formatQuoteAmount,
  QUOTE_CURRENCIES,
} from "@/utils/quotesConvert";
import { getMaxEstimatedDeliveryLabel } from "@/utils/estimatedDelivery";
import { resolveQuoteSpecsForPreview } from "@/utils/quoteConditionsDefaults";
import { fetchUsers } from "@/store/usersSlice";
import { toast } from "@/hooks/use-toast";
import { ProductSearchCombobox } from "../molecules/ProductSearch";
import { Product, Variants } from "@/types/types";
import InputField from "./InputField";
import { fetchAllProducts } from "@/store/productSlice";
import { useUserAdmins } from "@/hooks/useUsers";
import { Textarea } from "../ui/textarea";
import { quotesApi } from "@/lib/api/quotes";
import { DialogDescription } from "@radix-ui/react-dialog";
import GeneralSpecificationsDialog from "../molecules/Modals/GeneralSpecificationsDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
}

interface EditableData {
  state: QuoteStateType;
  quote_type: QuoteTypeEnum;
  currency: QuoteCurrency;
  items: (QuoteItemEditable & { existing: boolean })[];
  user: UserData;
  message?: string;
  created_at?: string;
  updated_at?: string;
  observaciones: string;
}
type QuoteItemEditable = QuoteItemRender & {
  existing: boolean;
  variant?: Variants | null; // 👈 nuevo campo normalizado
};

const QuotePreviewDialog = ({ open, onOpenChange, quoteId }: Props) => {
  const dispatch = useAppDispatch();
  const { data: users, error } = useUserAdmins({
    page: 1,
    page_size: 50,
  });
  const canManageQuotes = useCanManageQuotes();
  const { list: products, loading: loadingProducts } = useAppSelector(
    (state) => state.products
  );
  const [specs, setSpecs] = useState<SpecificationsForm>();
  const [openSpecs, setOpenSpecs] = useState(false);
  const [originalSpecs, setOriginalSpecs] = useState<SpecificationsForm>();
  const [newProducts, setNewProducts] = useState<
    (QuoteItemEditable & { existing: boolean })[]
  >([]);

  const [edit, setEdit] = useState(false);
  const [userError, setUserError] = useState(false);
  const [formState, setFormState] = useState<EditableData | null>(null);
  const [quote, setQuote] = useState<QuoteRender | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const isBusy = isSaving || isSending;
  const [total, setTotal] = useState(0);
  const calculateTotal = (): number => {
    return newProducts.reduce((total, item) => {
      return total + parseFloat(item.subtotal || "0");
    }, 0);
  };
  useEffect(() => {
    if (!quote) return;
    // Defaults Tito solo en recibidas; misma ref lógica en specs/originalSpecs → sin dirty ni auto-save.
    const resolved = resolveQuoteSpecsForPreview(
      quote.specs,
      quote.lifecycle,
      quote.managed_at
    );
    setSpecs(resolved);
    setOriginalSpecs(resolved);
  }, [quote]);

  useEffect(() => {
    if (!specs || !originalSpecs) return;

    const hasChanges = JSON.stringify(specs) !== JSON.stringify(originalSpecs);

    setEdit(hasChanges);
  }, [specs, originalSpecs]);

  useEffect(() => {
    const fetchQuoteData = async () => {
      const quoteRequest = await dispatch(fetchQuote(quoteId)).unwrap();
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
        state: quote.state,
        quote_type: quote.quote_type,
        currency: quote.currency ?? "ARS",
        items: quote.items
          ? quote.items.map((item) => ({ ...item, existing: true }))
          : [],
        user: users?.results?.find(
          (item) => item.id === quote.user
        ) as UserData,
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
        ? quote.items.map((item) => ({
            ...item,
            existing: true,
            variant: item.variant ?? null,
          }))
        : [];

      setTotal(Number(quote.total_amount));
      setFormState({
        state: quote.state,
        quote_type: quote.quote_type,
        currency: quote.currency ?? "ARS",
        items,
        user: users?.results?.find(
          (item) => item.id === quote.user
        ) as UserData,
        observaciones: quote.observaciones,
      });
      setNewProducts(items);
    }
  }, [quote, users]);

  if (!quote || !formState) {
    return null;
  }

  const contact = quote.contact;
  const maxDeliveryLabel = getMaxEstimatedDeliveryLabel(
    formState.items.map((item) => item.estimated_delivery)
  );

  if (!quote) {
    return;
  }
  const handleCancel = () => {
    setFormState({
      state: quote.state,
      quote_type: quote.quote_type,
      currency: quote.currency ?? "ARS",
      items: quote.items
        ? quote.items.map((item) => ({ ...item, existing: true }))
        : [],
      user: users?.results?.find((item) => item.id === quote.user) as UserData,
      observaciones: quote.observaciones,
    });
    setEdit(false);
  };

  const getProductById = (productId: string) =>
    products.find((p) => p.id === productId) ?? null;

  // ✅ CAMBIO: auto-asigna fixed_spec si el producto tiene exactamente 1
  const updateItemProduct = (index: number, product: Product | null) => {
    const autoVariant =
      product?.variants?.length === 1 ? product.variants[0] : null;

    setNewProducts((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              product: product
                ? { ...product, created_at: "", updated_at: "" }
                : null,
              variant: autoVariant, // 👈 clave
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
        return { ...item, unit_price: value, subtotal };
      })
    );
  };

  const updateItemEstimatedDelivery = (index: number, value: string) => {
    setNewProducts((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, estimated_delivery: value } : item
      )
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
        estimated_delivery: "",
        existing: false,
        variant: null, // 👈 cambio
      },
    ]);
  };
  const handleSaveSpecs = (values: SpecificationsForm) => {
    setSpecs(values);
  };

  const updateItemVariant = (index: number, variant: Variants | null) => {
    setNewProducts((prev) =>
      prev.map((item, i) => (i === index ? { ...item, variant } : item))
    );
  };

  const handleSave = async (options?: {
    manageLoading?: boolean;
    versionReason?: "saved" | "sent";
  }): Promise<QuoteRender | null> => {
    if (formState.user === null || formState.user === undefined) {
      toast({
        title: "El usuario es obligatorio",
        variant: "destructive",
      });
      setUserError(true);
      return;
    }

    if (!formState || !contact) return;

    const manageLoading = options?.manageLoading !== false;
    if (manageLoading) setIsSaving(true);

    try {
      await dispatch(
        updateQuote({
          id: quote.id,
          data: {
            contact_id: contact.id,
            message: quote.message,
            total_amount: calculateTotal().toFixed(2),
            user: formState.user.id,
            quote_type: formState.quote_type,
            currency: formState.currency,
            state_id: formState.state,
            observaciones: formState.observaciones,
            specs: specs,
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
              variant: item.variant?.id,
              estimated_delivery: item.estimated_delivery ?? "",
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
                variant: item.variant?.id,
                estimated_delivery: item.estimated_delivery ?? "",
              },
            })
          ).unwrap()
        ),
        ...itemsToDelete.map((item) =>
          dispatch(deleteQuoteItem(item.id)).unwrap()
        ),
      ]);

      const updatedQuote = await dispatch(fetchQuote(quote.id)).unwrap();
      setQuote(updatedQuote);
      setFormState({
        state: updatedQuote.state,
        quote_type: updatedQuote.quote_type,
        currency: updatedQuote.currency ?? "ARS",
        items:
          updatedQuote.items?.map((item) => ({ ...item, existing: true })) ??
          [],
        user:
          users?.results?.find((u) => u.id === updatedQuote.user) ??
          formState.user,
        message: updatedQuote.message,
        created_at: updatedQuote.created_at,
        updated_at: updatedQuote.updated_at,
        observaciones: updatedQuote.observaciones,
      });

      // Versión inmutable + PDF del navegador (primera versión = primer save BO)
      try {
        const next = await quotesApi.nextVersion(updatedQuote.id);
        const { generateQuotePdfBlob } = await import("@/utils/useQuotePDF");
        const pdfBlob = await generateQuotePdfBlob(
          updatedQuote,
          next.version_label
        );
        const formData = new FormData();
        formData.append(
          "pdf_file",
          pdfBlob,
          `${next.version_label}.pdf`
        );
        formData.append("reason", options?.versionReason || "saved");
        await quotesApi.createVersion(updatedQuote.id, formData);
      } catch (versionError) {
        console.error(versionError);
        toast({
          title: "Cotización guardada, pero no se pudo crear la versión PDF",
          variant: "destructive",
        });
      }

      toast({ title: "Cotización actualizada correctamente" });
      setEdit(false);

      setUserError(false);
      return updatedQuote;
    } catch (error) {
      console.error(error);
      toast({
        title: "Error al actualizar la cotización",
        variant: "destructive",
      });
      return null;
    } finally {
      if (manageLoading) setIsSaving(false);
    }
  };

  const handleSendClient = async () => {
    setIsSending(true);
    try {
      const updatedQuote = await handleSave({
        manageLoading: false,
        versionReason: "sent",
      });

      if (!updatedQuote) {
        return;
      }

      // Usar el número de la última versión creada en el save
      const versions = await quotesApi.listVersions(updatedQuote.id);
      const versionList = Array.isArray(versions)
        ? versions
        : versions.results ?? [];
      const latestLabel =
        versionList[0]?.version_label ?? updatedQuote.quote_number;

      const { generateQuotePdfBlob } = await import("@/utils/useQuotePDF");
      const pdfBlob = await generateQuotePdfBlob(updatedQuote, latestLabel);

      const formData = new FormData();

      formData.append(
        "pdf_file",
        pdfBlob,
        `${latestLabel}.pdf`
      );

      await quotesApi.sendClient(updatedQuote.id, formData);

      const refreshed = await dispatch(fetchQuote(updatedQuote.id)).unwrap();
      setQuote(refreshed);

      toast({ title: "Correo enviado al cliente" });
    } catch (error) {
      toast({ title: "Error al enviar el correo", variant: "destructive" });
      console.error(error);
    } finally {
      setIsSending(false);
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

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label>Estado</label>
            {edit && canManageQuotes ? (
              <Select
                value={formState.state}
                onValueChange={(value: QuoteStateType) => {
                  setFormState((prev) =>
                    prev ? { ...prev, state: value } : null
                  );
                  setEdit(true);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(quotesStates.length
                    ? quotesStates.map((s) => s.id)
                    : allowedNextQuoteStates(formState.state)
                  ).map((stateId) => {
                    const fromApi = quotesStates.find((s) => s.id === stateId);
                    return (
                      <SelectItem key={stateId} value={stateId}>
                        {fromApi?.name ??
                          convertQuotesState(stateId as QuoteStateType)}
                      </SelectItem>
                    );
                  })}
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
                value={formState.quote_type}
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
            <label>Moneda</label>
            {edit ? (
              <Select
                value={formState.currency}
                onValueChange={(value: QuoteCurrency) =>
                  setFormState((prev) =>
                    prev ? { ...prev, currency: value } : null
                  )
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUOTE_CURRENCIES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} ({currencySymbol(option.value)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-muted-foreground">
                {`${convertQuoteCurrency(formState.currency)} (${currencySymbol(formState.currency)})`}
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
                    const selectedUser = users?.results?.find(
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
                    {users?.results?.map((user) => (
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
                  ? `${formState.user.first_name} ${formState.user.last_name}
                  ${formState.user.username}`
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
            <p className="text-muted-foreground">{formState.updated_at}</p>
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
          <div className="border rounded overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="text-center p-2 font-medium">Producto</th>
                  <th className="text-center p-2 font-medium">
                    Variedad (Modelo)
                  </th>
                  <th className="text-center p-2 font-medium">
                    Código producto
                  </th>
                  <th className="text-center p-2 font-medium">Cant.</th>
                  <th className="text-center p-2 font-medium">
                    Precio unitario
                  </th>
                  <th className="text-center p-2 font-medium">Subtotal</th>
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
                      {item.variant?.code || "-"}
                    </td>
                    <td className="p-2 text-center">
                      {item.product.product_code}
                    </td>
                    <td className="p-2 text-center">{item.quantity}</td>
                    <td className="p-2 text-center whitespace-nowrap">
                      {formatQuoteAmount(
                        item.unit_price,
                        formState.currency
                      )}
                    </td>
                    <td className="p-2 text-center font-medium whitespace-nowrap">
                      {formatQuoteAmount(item.subtotal, formState.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {edit && (
          <div className="space-y-3">
            {newProducts.map((item, index) => {
              const selectedProduct = item.product
                ? getProductById(item.product.id)
                : null;

              // ✅ CAMBIO: cantidad de specs del producto seleccionado
              const specsCount = selectedProduct?.variants?.length ?? 0;

              return (
                <div
                  key={item.id ?? index}
                  className="border rounded-md p-3 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-2">
                      {!item.existing ? (
                        <>
                          <ProductSearchCombobox
                            products={products}
                            selectedProduct={selectedProduct}
                            onSelect={(product) =>
                              updateItemProduct(index, product)
                            }
                          />

                          {specsCount === 1 && (
                            <p className="text-xs text-muted-foreground">
                              Variedad:{" "}
                              <span className="font-medium">
                                {item.variant?.code ??
                                  selectedProduct?.variants?.[0]?.code}
                              </span>
                            </p>
                          )}

                          {specsCount > 1 && (
                            <Select
                              value={item.variant?.id || ""}
                              onValueChange={(value) => {
                                const spec = selectedProduct?.variants.find(
                                  (s) => s.id === value
                                );
                                updateItemVariant(index, spec || null);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar variedad" />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedProduct?.variants.map((spec) => (
                                  <SelectItem key={spec.id} value={spec.id}>
                                    {spec.code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-snug">
                            {item.product?.name}
                            {item.product?.product_code
                              ? ` (${item.product.product_code})`
                              : ""}
                          </p>
                          {item.variant?.code ? (
                            <p className="text-xs text-muted-foreground">
                              Variedad:{" "}
                              <span className="font-medium">
                                {item.variant.code}
                              </span>
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      className="shrink-0 bg-transparent text-red-600 hover:bg-red-600 hover:text-white"
                      onClick={() => removeItem(index)}
                      aria-label="Eliminar producto"
                    >
                      <Trash2 size={20} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="min-w-0">
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

                    <div className="min-w-0">
                      <label className="text-xs">
                        Precio ({currencySymbol(formState.currency)}):
                      </label>
                      <InputField
                        aria-description="Precio unitario del producto"
                        type="number"
                        value={item.unit_price}
                        min={0}
                        onChange={(e) => updateItemPrice(index, e.target.value)}
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="text-xs">
                        Tiempo estimado de entrega:
                      </label>
                      <InputField
                        aria-description="Tiempo estimado de entrega"
                        type="text"
                        value={item.estimated_delivery ?? ""}
                        onChange={(e) =>
                          updateItemEstimatedDelivery(index, e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-right text-lg font-semibold pt-2 border-t">
          Total: {formatQuoteAmount(total, formState.currency)}
        </div>

        {!edit && maxDeliveryLabel ? (
          <p className="text-right text-sm font-medium pt-1">
            Plazo de entrega: {maxDeliveryLabel}
          </p>
        ) : null}

        <label>Observaciones</label>
        {!edit ? (
          <p>{formState.observaciones ?? "No hay observaciones"}</p>
        ) : (
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
        )}

        <Button
          type="button"
          variant="outline"
          className="mt-2"
          onClick={() => setOpenSpecs(true)}
        >
          CONDICIONES GENERALES
        </Button>

        <GeneralSpecificationsDialog
          open={openSpecs}
          onOpenChange={setOpenSpecs}
          onSave={handleSaveSpecs}
          initialData={specs!}
        />

        {canManageQuotes && (
          <div className="flex grid grid-cols-3 gap-20">
            <Button
              variant={edit ? "secondary" : "primary"}
              size="sm"
              className="gap-2"
              onClick={() => (edit ? handleCancel() : setEdit(true))}
              disabled={isBusy}
            >
              {edit ? "Cancelar" : "Editar"}
              {!edit && <PencilIcon size={15} />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSendClient}
              disabled={isBusy}
            >
              {isSending ? "Enviando al cliente..." : "Enviar al cliente"}
            </Button>

            {edit && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSave()}
                disabled={isBusy}
              >
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuotePreviewDialog;
