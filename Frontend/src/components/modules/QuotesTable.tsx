import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Edit2,
  FileText,
  Trash2,
} from "lucide-react";
import Table from "@/components/common/Table";
import InputField from "@/components/atoms/InputField";
import Select from "@/components/atoms/Select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  deleteQuote,
  fetchQuoteVersions,
  fetchQuoteStates,
  fetchQuoteTypes,
} from "@/store/quotesSlice";
import {
  QuoteLifecycle,
  QuoteRender,
  QuoteStateType,
  QuoteTrace,
  QuoteTypeEnum,
  QuoteVersion,
} from "@/types/api";
import QuotePreviewDialog from "../atoms/QuotePreview";
import {
  assigneeTraceLabel,
  convertQuoteVersionReason,
  convertQuotesState,
  convertQuotesTypes,
} from "@/utils/quotesConvert";
import ModalDelete from "../molecules/Modals/ModalDelete";
import { toast } from "@/hooks/use-toast";
import { useCanManageQuotes } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { quotesApi, QuoteListParams } from "@/lib/api/quotes";

const PAGE_SIZE = 10;

type QuoteBucket = {
  results: QuoteRender[];
  count: number;
  totalPages: number;
  page: number;
};

const emptyBucket = (): QuoteBucket => ({
  results: [],
  count: 0,
  totalPages: 1,
  page: 1,
});

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

  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typesFilters, setTypesFilters] = useState("all");
  const [lifecycle, setLifecycle] = useState<QuoteLifecycle>("received");
  const [buckets, setBuckets] = useState<Record<QuoteLifecycle, QuoteBucket>>({
    received: emptyBucket(),
    managed: emptyBucket(),
  });
  const [isModalEditOpen, setIsModalEditOpen] = useState(false);

  const [previewQuote, setPreviewQuote] = useState<QuoteRender | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyByQuote, setHistoryByQuote] = useState<
    Record<string, { versions: QuoteVersion[]; assignments: QuoteTrace[] }>
  >({});
  const [loadingVersions, setLoadingVersions] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const aborts = useRef<Partial<Record<QuoteLifecycle, AbortController>>>({});
  const tabGen = useRef<Record<QuoteLifecycle, number>>({
    received: 0,
    managed: 0,
  });

  const listParams = (
    tab: QuoteLifecycle,
    page: number
  ): QuoteListParams => {
    const params: QuoteListParams = {
      page,
      page_size: PAGE_SIZE,
      lifecycle: tab,
    };
    if (statusFilter !== "all") params.state = statusFilter;
    if (typesFilters !== "all") params.quote_type = typesFilters;
    if (searchTerm.trim()) params.search = searchTerm.trim();
    return params;
  };

  const pullBucket = async (
    tab: QuoteLifecycle,
    page: number,
    signal: AbortSignal
  ): Promise<QuoteBucket> => {
    const data = await quotesApi.list(listParams(tab, page), signal);
    return {
      results: data.results ?? [],
      count: data.count ?? 0,
      totalPages: data.total_pages || 1,
      page: data.current_page || page,
    };
  };

  const fetchTab = (tab: QuoteLifecycle, page: number) => {
    aborts.current[tab]?.abort();
    const controller = new AbortController();
    aborts.current[tab] = controller;
    const requestId = ++tabGen.current[tab];

    const run = async (targetPage: number): Promise<QuoteBucket> => {
      try {
        return await pullBucket(tab, targetPage, controller.signal);
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (status === 404 && targetPage > 1) return run(targetPage - 1);
        throw error;
      }
    };

    run(page)
      .then((bucket) => {
        if (requestId !== tabGen.current[tab]) return;
        setBuckets((prev) => ({ ...prev, [tab]: bucket }));
      })
      .catch((error: { message?: string }) => {
        if (controller.signal.aborted || requestId !== tabGen.current[tab]) {
          return;
        }
        toast({
          title: error?.message || "Error obteniendo cotizaciones",
          variant: "destructive",
        });
      });
  };

  const refreshTabs = () => {
    fetchTab("received", buckets.received.page);
    fetchTab("managed", buckets.managed.page);
  };

  useEffect(() => {
    dispatch(fetchQuoteStates());
    dispatch(fetchQuoteTypes());
  }, [dispatch]);

  useEffect(() => {
    setExpandedId(null);
    setHistoryByQuote({});
    fetchTab("received", 1);
    fetchTab("managed", 1);
    return () => {
      aborts.current.received?.abort();
      aborts.current.managed?.abort();
    };
    // fetchTab usa los filtros de este render; las deps de abajo alcanzan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchTerm, typesFilters]);

  const quotesStates = useAppSelector((state) => state.quotes.states);
  const quotesTypes = useAppSelector((state) => state.quotes.types);

  const activeBucket = buckets[lifecycle];

  const filteredQuotes = activeBucket.results.map((quote) => ({
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
    if (historyByQuote[quote.id]) return;
    setLoadingVersions(quote.id);
    try {
      const versions = await dispatch(fetchQuoteVersions(quote.id)).unwrap();
      let assignments: QuoteTrace[] = [];
      try {
        const payload = await quotesApi.listTraces(quote.id, {
          page_size: 100,
        });
        const traces = Array.isArray(payload)
          ? payload
          : payload.results ?? [];
        assignments = traces.filter(
          (trace) => trace.reason === "assignee_changed"
        );
      } catch {
        toast({
          title: "No se pudo cargar el historial de responsables",
          variant: "destructive",
        });
      }
      setHistoryByQuote((prev) => ({
        ...prev,
        [quote.id]: { versions, assignments },
      }));
    } catch {
      toast({
        title: "No se pudo cargar el historial de versiones",
        variant: "destructive",
      });
    } finally {
      setLoadingVersions(null);
    }
  };

  const handleDownloadPdf = async (quoteId: string, version: QuoteVersion) => {
    if (!version.has_pdf) {
      toast({
        title: "Esta versión no tiene PDF",
        variant: "destructive",
      });
      return;
    }
    setDownloadingId(version.id);
    try {
      const { blob, filename } = await quotesApi.downloadVersionPdf(
        quoteId,
        version.id
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `${version.version_label}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      toast({
        title: "No se pudo descargar el PDF",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
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
                aria-label="Ver versiones"
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
      key: "user_name",
      label: "Asignado",
      sortable: false,
      render: (value: string | null) => value || "—",
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

  const handleOpenDeleteModal = (row: QuoteRender) => {
    setPreviewQuote(row);
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
      refreshTabs();
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

  const renderVersionList = (quoteId: string) => {
    if (loadingVersions === quoteId) {
      return (
        <p className="text-sm text-muted-foreground pl-2">
          Cargando historial…
        </p>
      );
    }
    const history = historyByQuote[quoteId];
    if (!history) return null;
    const rows = [
      ...history.versions.map((version) => ({
        kind: "version" as const,
        at: version.created_at,
        version,
      })),
      ...history.assignments.map((trace) => ({
        kind: "assignment" as const,
        at: trace.created_at,
        trace,
      })),
    ].sort((a, b) => b.at.localeCompare(a.at));
    if (rows.length === 0) {
      return (
        <p className="text-sm text-muted-foreground pl-2">
          Sin historial. Las versiones se generan al editar la cotización.
        </p>
      );
    }
    return (
      <div className="pl-2">
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Historial
        </p>
        <ul className="space-y-2 border-l-2 border-primary/30 pl-3">
          {rows.map((row) =>
            row.kind === "version" ? (
              <li
                key={`version-${row.version.id}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
              >
                <span className="font-medium font-mono">
                  {row.version.version_label}
                </span>
                <span className="text-muted-foreground">
                  {convertQuoteVersionReason(row.version.reason)}
                </span>
                <span className="text-muted-foreground">
                  {formatDateTime(row.version.created_at)}
                </span>
                {row.version.actor_name && (
                  <span className="text-muted-foreground">
                    por {row.version.actor_name}
                  </span>
                )}
                {row.version.has_pdf && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                    disabled={downloadingId === row.version.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadPdf(quoteId, row.version);
                    }}
                  >
                    <Download size={12} />
                    {downloadingId === row.version.id
                      ? "Descargando…"
                      : "PDF"}
                  </button>
                )}
              </li>
            ) : (
              <li
                key={`trace-${row.trace.id}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
              >
                <span className="text-muted-foreground">
                  {assigneeTraceLabel(row.trace)}
                </span>
                <span className="text-muted-foreground">
                  {formatDateTime(row.trace.created_at)}
                </span>
                {row.trace.actor_name && (
                  <span className="text-muted-foreground">
                    por {row.trace.actor_name}
                  </span>
                )}
              </li>
            )
          )}
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
            onClick={() => {
              setLifecycle(tab.id);
              setExpandedId(null);
            }}
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
              setHistoryByQuote({});
              refreshTabs();
            }
          }}
          quoteId={previewQuote.id}
        />
      )}

      <Table
        columns={columns}
        data={filteredQuotes}
        actions={actions}
        serverPagination={{
          currentPage: activeBucket.page,
          totalPages: activeBucket.totalPages,
          totalItems: activeBucket.count,
          pageSize: PAGE_SIZE,
          onPageChange: (page) => {
            setExpandedId(null);
            fetchTab(lifecycle, page);
          },
        }}
        renderExpandedRow={
          lifecycle === "managed"
            ? (row: QuoteRender) =>
                expandedId === row.id ? renderVersionList(row.id) : null
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
