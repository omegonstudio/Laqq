import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/atoms/Button";

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

interface TableAction {
  icon: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick: (row: any) => void;
  color?: string;
  label?: string;
}

interface ServerPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

interface TableProps {
  columns: TableColumn[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  actions?: TableAction[];
  itemsPerPage?: number;
  // Nueva prop para paginación del servidor
  serverPagination?: ServerPagination;
}

const Table = ({
  columns,
  data,
  actions,
  itemsPerPage = 10,
  serverPagination,
}: TableProps) => {
  // Estado local solo para paginación del cliente
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  console.log(data, "DATA EN TABLEEE");
  const isServerPaginated = !!serverPagination;

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(key);
      setSortDirection("asc");
    }
  };

  // Ordenamiento solo para paginación local
  const sortedData = isServerPaginated
    ? data
    : [...data].sort((a, b) => {
        if (!sortColumn) return 0;

        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });

  // Paginación local o servidor
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let paginatedData: any[];
  let totalPages: number;
  let startIndex: number;
  let endIndex: number;
  let totalItems: number;
  let activePage: number;

  if (isServerPaginated) {
    // Modo servidor: los datos ya vienen paginados
    paginatedData = data;
    totalPages = serverPagination.totalPages;
    activePage = serverPagination.currentPage;
    totalItems = serverPagination.totalItems;
    startIndex = (activePage - 1) * serverPagination.pageSize;
    endIndex = Math.min(startIndex + data.length, totalItems);
  } else {
    // Modo cliente: paginar localmente
    totalPages = Math.ceil(sortedData.length / itemsPerPage);
    activePage = currentPage;
    totalItems = sortedData.length;
    startIndex = (activePage - 1) * itemsPerPage;
    endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    paginatedData = sortedData.slice(startIndex, endIndex);
  }

  const handlePageChange = (newPage: number) => {
    if (isServerPaginated) {
      serverPagination.onPageChange(newPage);
    } else {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="bg-primary/10 border-b border-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() =>
                    column.sortable &&
                    !isServerPaginated &&
                    handleSort(column.key)
                  }
                  className={cn(
                    "px-4 py-3 text-left text-sm font-bold text-foreground",
                    column.sortable &&
                      !isServerPaginated &&
                      "cursor-pointer hover:bg-primary/20 transition-colors"
                  )}
                >
                  {column.label}
                  {sortColumn === column.key && !isServerPaginated && (
                    <span className="ml-2">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-4 py-3 text-left text-sm font-bold text-foreground">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr
                  key={idx}
                  className={cn(
                    "border-b border-border transition-colors hover:bg-muted/50",
                    idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3 text-sm text-foreground"
                    >
                      {row[column.key]}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {actions.map((action, actionIdx) => (
                          <button
                            key={actionIdx}
                            onClick={() => action.onClick(row)}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              action.color === "red"
                                ? "hover:bg-destructive/10 text-destructive"
                                : "hover:bg-primary/10 text-primary"
                            )}
                            title={action.label}
                          >
                            {action.icon}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No hay datos disponibles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {endIndex} de {totalItems} registros
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={activePage === 1}
            >
              <ChevronsLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(activePage - 1)}
              disabled={activePage === 1}
            >
              <ChevronLeft size={16} />
            </Button>

            <span className="text-sm text-foreground px-4">
              Página {activePage} de {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(activePage + 1)}
              disabled={activePage === totalPages}
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={activePage === totalPages}
            >
              <ChevronsRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
