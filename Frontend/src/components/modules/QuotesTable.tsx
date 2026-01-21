import { useEffect, useMemo, useState } from "react";
import { Eye, FileText, Trash2 } from "lucide-react";
import Table from "@/components/common/Table";
import InputField from "@/components/atoms/InputField";
import Select from "@/components/atoms/Select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchQuotes } from "@/store/quotesSlice";
import { Quote, QuoteWithContact } from "@/types/api";
import { toast } from "sonner";
import { generateQuotePdf } from "@/utils/useQuotePDF";
import QuotePreviewDialog from "../atoms/QuotePreview";
import { fetchContacts } from "@/store/contacts";

const QuotesTable = () => {
  const dispatch = useAppDispatch();

  const { list: quotes } = useAppSelector((state) => state.quotes);
  const { list: contacts } = useAppSelector((state) => state.contacts);
  const { list: products } = useAppSelector((state) => state.products);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewQuote, setPreviewQuote] = useState<QuoteWithContact | null>(
    null
  );

  useEffect(() => {
    dispatch(fetchQuotes({ page: 1, page_size: 50 }));
    dispatch(fetchContacts({ page: 1, page_size: 50 }));
  }, [dispatch]);

  // 👉 Mapa de contactos por ID
  const contactsById = useMemo(() => {
    return new Map(contacts.map((c) => [c.id, c]));
  }, [contacts]);

  const productsById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  // 👉 Quotes enriquecidas con contacto
  const enrichedQuotes: QuoteWithContact[] = useMemo(() => {
    return quotes.map((quote) => {
      const contact = contactsById.get(quote.contact);

      return {
        ...quote,
        contactInfo: contact
          ? {
              first_name: contact.first_name,
              last_name: contact.last_name,
              email: contact.email,
              company_name: contact.company_name,
            }
          : undefined,

        items: quote.items?.map((item) => {
          const product = productsById.get(item.product);

          return {
            ...item,
            productName: product?.name ?? "Producto desconocido",
          };
        }),
      };
    });
  }, [quotes, contactsById, productsById]);
  const filteredQuotes = enrichedQuotes.filter((quote) => {
    const matchesStatus =
      statusFilter === "all" || quote.state === statusFilter;
    return matchesStatus;
  });

  const columns = [
    { key: "quote_number", label: "N° Cotización", sortable: true },
    { key: "contactInfo.company_name", label: "Empresa", sortable: true },
    { key: "contactInfo.email", label: "Email", sortable: true },
    { key: "quote_type", label: "Tipo", sortable: true },
    { key: "state", label: "Estado", sortable: true },
  ];

  const actions = [
    {
      icon: <Eye size={16} />,
      label: "Ver",
      onClick: (quote: QuoteWithContact) => setPreviewQuote(quote),
    },
    {
      icon: <FileText size={16} />,
      label: "PDF",
      onClick: (quote: QuoteWithContact) => {
        generateQuotePdf(quote);
        toast.success("PDF generado");
      },
    },
    {
      icon: <Trash2 size={16} />,
      label: "Eliminar",
      color: "red",
      onClick: (quote: QuoteWithContact) => console.log("Eliminar", quote),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <InputField
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "all", label: "Todos" },
            { value: "NEW", label: "Nueva" },
            { value: "CONFIRMED", label: "Confirmada" },
          ]}
        />
      </div>

      <QuotePreviewDialog
        open={!!previewQuote}
        onOpenChange={(open) => !open && setPreviewQuote(null)}
        quote={previewQuote}
      />

      <Table columns={columns} data={filteredQuotes} actions={actions} />
    </div>
  );
};

export default QuotesTable;
