import { useEffect, useState } from "react";
import { Eye, FileText, Trash2 } from "lucide-react";
import Table from "@/components/common/Table";
import InputField from "@/components/atoms/InputField";
import Select from "@/components/atoms/Select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  deleteQuote,
  fetchQuotes,
  fetchQuoteStates,
  fetchQuoteTypes,
} from "@/store/quotesSlice";
import { QuoteRender, QuoteStateType, QuoteTypeEnum } from "@/types/api";
import { generateQuotePdf } from "@/utils/useQuotePDF";
import QuotePreviewDialog from "../atoms/QuotePreview";
import { convertQuotesState, convertQuotesTypes } from "@/utils/quotesConvert";
import ModalDelete from "../molecules/Modals/ModalDelete";
import { toast } from "@/hooks/use-toast";

const QuotesTable = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const { list: quotes, pagination } = useAppSelector((state) => state.quotes);
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typesFilters, setTypesFilters] = useState("all");
  const [isModalEditOpen, setIsModalEditOpen] = useState(false);

  const [previewQuote, setPreviewQuote] = useState<QuoteRender | null>(null);
  useEffect(() => {
    dispatch(fetchQuotes({ page: 1, page_size: 50 }));
    dispatch(fetchQuoteStates());
    dispatch(fetchQuoteTypes());
  }, [dispatch]);

  useEffect(() => {
    const params: {
      page: number;
      page_size: number;
      state?: string;
      search?: string;
      quote_type?: string;
    } = {
      page: 1,
      page_size: 50,
    };

    if (statusFilter !== "all") {
      params.state = statusFilter;
    }
    if (typesFilters !== "all") {
      params.quote_type = typesFilters;
    }

    if (searchTerm.trim()) {
      params.search = searchTerm;
    }

    dispatch(fetchQuotes(params));
  }, [dispatch, statusFilter, searchTerm, typesFilters]);

  const quotesStates = useAppSelector((state) => state.quotes.states);
  const quotesTypes = useAppSelector((state) => state.quotes.types);

  const filteredQuotes = quotes.map((quote) => ({
    ...quote,
    company_name: quote.contact?.company_name || "-",
    email: quote.contact?.email || "-",
  }));

  const columns = [
    { key: "quote_number", label: "N° Cotización", sortable: true },
    { key: "company_name", label: "Empresa", sortable: true },
    { key: "email", label: "Email", sortable: true },
    {
      key: "quote_type",
      label: "Tipo",
      sortable: true,
      render: (value: QuoteTypeEnum) => convertQuotesTypes(value),
    },
    {
      key: "state",
      label: "Estado",
      sortable: true,
      render: (value: QuoteStateType) => convertQuotesState(value),
    },
  ];
  const handleOpenDeleteModal = (product: QuoteRender) => {
    setPreviewQuote(product);
    setIsModalDeleteOpen(true);
  };
  const handleEdit = (quote: QuoteRender) => {
    setPreviewQuote(quote);
    setIsModalEditOpen(true);
  };

  const actions = [
    {
      icon: <Eye size={16} />,
      label: "Ver",
      onClick: handleEdit,
    },
    {
      icon: <FileText size={16} />,
      label: "PDF",
      onClick: (quote: QuoteRender) => {
        generateQuotePdf(quote);
        toast({ title: "PDF generado" });
      },
    },
    {
      icon: <Trash2 size={16} />,
      label: "Eliminar",
      color: "red",
      onClick: handleOpenDeleteModal,
      disabled: !user?.is_superuser, // Solo superusuarios pueden eliminar
    },
  ];

  const handleConfirmDelete = async () => {
    if (!previewQuote) return;

    try {
      await dispatch(deleteQuote(previewQuote.id)).unwrap();
      toast({ title: "Cotización eliminada exitosamente" });
      setIsModalDeleteOpen(false);

      // Recargar con los filtros actuales
      const params: {
        page: number;
        page_size: number;
        search?: string;
        brand?: string;
      } = {
        page: pagination.current_page,
        page_size: pagination.page_size,
      };

      dispatch(fetchQuotes(params));
    } catch (error: unknown) {
      console.error("Error eliminando cotización:", error);
      if (error instanceof Error) {
        toast({
          title: error.message || "Error al eliminar la cotización",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error al eliminar la cotización",
          variant: "destructive",
        });
      }
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <InputField
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select
          value={typesFilters}
          onChange={(e) => setTypesFilters(e.target.value)}
          options={[
            { value: "all", label: "Todos los tipos" },
            ...quotesTypes.map((item) => ({
              value: item.id,
              label: convertQuotesTypes(item.name),
            })),
          ]}
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "all", label: "Todos los estados" },
            ...quotesStates.map((item) => ({
              value: item.id,
              label: convertQuotesState(item.name),
            })),
          ]}
        />
      </div>

      {previewQuote && (
        <QuotePreviewDialog
          open={isModalEditOpen}
          onOpenChange={(open) => {
            setIsModalEditOpen(open);
            if (!open) {
              setPreviewQuote(null);
            }
          }}
          quoteId={previewQuote.id}
        />
      )}

      <Table columns={columns} data={filteredQuotes} actions={actions} />
      <ModalDelete
        isOpen={isModalDeleteOpen}
        onClose={() => {
          setIsModalDeleteOpen(false);
          setPreviewQuote(null);
        }}
        itemName={previewQuote?.quote_number || ""}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default QuotesTable;
