import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/atoms/Button";

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

interface TableAction {
  icon: React.ReactNode;
  onClick: (row: any) => void;
  color?: string;
  label?: string;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  actions?: TableAction[];
  itemsPerPage?: number;
}

const Table = ({ columns, data, actions, itemsPerPage = 10 }: TableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(key);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="bg-primary/10 border-b border-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => column.sortable && handleSort(column.key)}
                  className={cn(
                    "px-4 py-3 text-left text-sm font-bold text-foreground",
                    column.sortable && "cursor-pointer hover:bg-primary/20 transition-colors"
                  )}
                >
                  {column.label}
                  {sortColumn === column.key && (
                    <span className="ml-2">{sortDirection === "asc" ? "↑" : "↓"}</span>
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
            {paginatedData.map((row, idx) => (
              <tr
                key={idx}
                className={cn(
                  "border-b border-border transition-colors hover:bg-muted/50",
                  idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                )}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-foreground">
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
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, data.length)} de {data.length} registros
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            
            <span className="text-sm text-foreground px-4">
              Página {currentPage} de {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
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
