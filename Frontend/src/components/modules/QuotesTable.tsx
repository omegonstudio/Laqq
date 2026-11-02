import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Edit2, FileText, Trash2 } from "lucide-react";
import Table from "@/components/common/Table";
import InputField from "@/components/atoms/InputField";
import Select from "@/components/atoms/Select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  deleteQuote,
  fetchQuoteTraces,
  fetchQuotes,
  fetchQuoteStates,
  fetchQuoteTypes,
} from "@/store/quotesSlice";
import {
  QuoteLifecycle,
  QuoteRender,
  QuoteStateType,
  QuoteTrace,
  QuoteTypeEnum,
} from "@/types/api";
import QuotePreviewDialog from "../atoms/QuotePreview";
import {
  convertQuoteTraceReason,
  convertQuotesState,
  convertQuotesTypes,
  QUOTE_TRACE_VISIBLE_REASONS,
} from "@/utils/quotesConvert";
import ModalDelete from "../molecules/Modals/ModalDelete";
import { toast } from "@/hooks/use-toast";
import { useCanManageQuotes } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const QuotesTable = () => {
  const dispatch = useAppDispatch();
  const canManageQuotes = useCanManageQuotes();

  const { list: quotes, pagination } = useAppSelector((state) => state.quotes);
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typesFilters, setTypesFilters] = useState("all");
  const [lifecycle, setLifecycle] = useState<QuoteLifecycle>("received");
  const [isModalEditOpen, setIsModalEditOpen] = useState(false);

  const [previewQuote, setPreviewQuote] = useState<QuoteRender | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tracesByQuote, setTracesByQuote] = useState<Record<string, QuoteTrace[]>>(
    {}
  );
  const [loadingTraces, setLoadingTraces] = useState<string | null>(null);

  const reload = () => {
    const params: {
      page: number;
      page_size: number;
      state?: string;
      search?: string;
      quote_type?: string;
      lifecycle: QuoteLifecycle;
    } = {
      page: 1,
      page_size: 50,
      lifecycle,
    };

    if (statusFilter !== "all") params.state = statusFilter;
    if (typesFilters !== "all") params.quote_type = typesFilters;
    if (searchTerm.trim()) params.search = searchTerm.trim();

    dispatch(fetchQuotes(params));
  };

  useEffect(() => {
    dispatch(fetchQuoteStates());
    dispatch(fetchQuoteTypes());
  }, [dispatch]);

  useEffect(() => {
    reload();
    setExpandedId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, statusFilter, searchTerm, typesFilters, lifecycle]);

  const quotesStates = useAppSelector((state) => state.quotes.states);
  const quotesTypes = useAppSelector((state) => state.quotes.types);

  const filteredQuotes = quotes.map((quote) => ({
    ...quote,
    company_name: quote.contact?.company_name || "-",
    email: quote.contact?.email || "-",
  }));

  const toggleExpand = async (quote: QuoteRender) => {
    if (expandedId === quote.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(quote.id);
    if (tracesByQuote[quote.id]) return;
    setLoadingTraces(quote.id);
    try {
      const traces = await dispatch(fetchQuoteTraces(quote.id)).unwrap();
      setTracesByQuote((prev) => ({ ...prev, [quote.id]: traces }));
    } catch {
      toast({
        title: "No se pudo cargar el historial",
        variant: "destructive",
      });
    } finally {
      setLoadingTraces(null);
    }
  };

  const columns = [
    ...(lifecycle === "managed"
      ? [
          {
            key: "_expand",
            label: "",
            sortable: false,
            render: (_: unknown, row: QuoteRender) => (
              <button
                type="button"
                className="p-1 rounded hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(row);
                }}
                aria-label="Ver historial"
              >
                {expandedId === row.id ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            ),
          },
        ]
      : []),
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
    {
      key: "created_at",
      label: "Creado",
      sortable: true,
      render: (value: string) => formatDateTime(value),
    },
    {
      key: "updated_at",
      label: "Última modificación",
      sortable: true,
      render: (value: string) => formatDateTime(value),
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

  const actions = canManageQuotes
    ? [
        {
          icon: <Edit2 size={16} />,
          label: "Ver / Editar",
          onClick: handleEdit,
        },
        {
          icon: <FileText size={16} />,
          label: "PDF",
          onClick: async (quote: QuoteRender) => {
            const { generateQuotePdf } = await import("@/utils/useQuotePDF");
            generateQuotePdf(quote);
            toast({ title: "PDF generado" });
          },
        },
        {
          icon: <Trash2 size={16} />,
          label: "Eliminar",
          color: "red",
          onClick: handleOpenDeleteModal,
        },
      ]
    : [
        {
          icon: <Edit2 size={16} />,
          label: "Ver",
          onClick: handleEdit,
        },
        {
          icon: <FileText size={16} />,
          label: "PDF",
          onClick: async (quote: QuoteRender) => {
            const { generateQuotePdf } = await import("@/utils/useQuotePDF");
            generateQuotePdf(quote);
            toast({ title: "PDF generado" });
          },
        },
      ];

  const handleConfirmDelete = async () => {
    if (!previewQuote) return;

    try {
      await dispatch(deleteQuote(previewQuote.id)).unwrap();
      toast({ title: "Cotización eliminada exitosamente" });
      setIsModalDeleteOpen(false);
      reload();
    } catch (error: unknown) {
      console.error("Error eliminando cotización:", error);
      toast({
        title:
          error instanceof Error
            ? error.message
            : "Error al eliminar la cotización",
        variant: "destructive",
      });
    }
  };

  const renderTraceList = (quoteId: string) => {
    if (loadingTraces === quoteId) {
      return <p className="text-sm text-muted-foreground pl-2">Cargando historial…</p>;
    }
    const traces = (tracesByQuote[quoteId] || []).filter((t) =>
      QUOTE_TRACE_VISIBLE_REASONS.has(t.reason)
    );
    if (!tracesByQuote[quoteId]) return null;
    if (traces.length === 0) {
      return (
        <p className="text-sm text-muted-foreground pl-2">Sin eventos registrados.</p>
      );
    }
    return (
      <div className="pl-2">
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Historial de gestión
        </p>
        <ul className="space-y-2 border-l-2 border-primary/30 pl-3">
          {traces.map((trace) => {
            const changes = (trace.snapshot?.changes || {}) as Record<
              string,
              unknown
            >;
            return (
              <li
                key={trace.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm"
              >
                <span className="font-medium">
                  {convertQuoteTraceReason(trace.reason)}
                </span>
                <span className="text-muted-foreground">
                  {formatDateTime(trace.created_at)}
                </span>
                {trace.actor_name && (
                  <span className="text-muted-foreground">
                    por {trace.actor_name}
                  </span>
                )}
                {trace.reason === "state_changed" && changes.from_state && (
                  <span className="text-xs text-muted-foreground">
                    {String(changes.from_state)} → {String(changes.to_state)}
                  </span>
                )}
                {trace.reason === "sent" && trace.snapshot?.kind === "full" && (
                  <span className="text-xs text-muted-foreground">
                    Total: {String(trace.snapshot.total_amount ?? "-")}{" "}
                    {String(trace.snapshot.currency ?? "")}
                  </span>
                )}
                {trace.reason === "backfill" && (
                  <span className="text-xs text-muted-foreground">
                    Sin detalle previo al deploy de trazabilidad
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border">
        {(
          [
            { id: "received" as const, label: "Recibidas" },
            { id: "managed" as const, label: "En gestión" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setLifecycle(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              lifecycle === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
              label: item.name,
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
              label: item.name,
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
              reload();
            }
          }}
          quoteId={previewQuote.id}
        />
      )}

      <Table
        columns={columns}
        data={filteredQuotes}
        actions={actions}
        renderExpandedRow={
          lifecycle === "managed"
            ? (row: QuoteRender) =>
                expandedId === row.id ? renderTraceList(row.id) : null
            : undefined
        }
      />

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
