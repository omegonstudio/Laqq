"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface VariantColumn {
  id: string;
  name: string;
}

export interface VariantRow {
  id: string;
  values: Record<string, string>;
}

export interface ProductVariantsData {
  columns: VariantColumn[];
  rows: VariantRow[];
}

interface ProductVariantsTableProps {
  onChange?: (data: ProductVariantsData) => void;
  initialData?: ProductVariantsData;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const defaultColumns: VariantColumn[] = [
  { id: generateId(), name: "Código" },
  { id: generateId(), name: "Volumen" },
  { id: generateId(), name: "Precio" },
];

const ProductVariantsTable: React.FC<ProductVariantsTableProps> = ({
  onChange,
  initialData,
}) => {
  const [columns, setColumns] = useState<VariantColumn[]>(
    initialData?.columns ?? defaultColumns
  );
  const [rows, setRows] = useState<VariantRow[]>(
    initialData?.rows ?? [{ id: generateId(), values: {} }]
  );

  const notifyChange = useCallback(
    (newColumns: VariantColumn[], newRows: VariantRow[]) => {
      onChange?.({ columns: newColumns, rows: newRows });
    },
    [onChange]
  );

  const handleAddColumn = () => {
    const newColumn: VariantColumn = {
      id: generateId(),
      name: `Columna ${columns.length + 1}`,
    };
    const newColumns = [...columns, newColumn];
    setColumns(newColumns);
    notifyChange(newColumns, rows);
  };

  const handleRemoveColumn = (columnId: string) => {
    if (columns.length <= 1) return;
    const newColumns = columns.filter((col) => col.id !== columnId);
    const newRows = rows.map((row) => {
      const { [columnId]: _, ...restValues } = row.values;
      return { ...row, values: restValues };
    });
    setColumns(newColumns);
    setRows(newRows);
    notifyChange(newColumns, newRows);
  };

  const handleColumnNameChange = (columnId: string, newName: string) => {
    const newColumns = columns.map((col) =>
      col.id === columnId ? { ...col, name: newName } : col
    );
    setColumns(newColumns);
    notifyChange(newColumns, rows);
  };

  const handleAddRow = () => {
    const newRow: VariantRow = { id: generateId(), values: {} };
    const newRows = [...rows, newRow];
    setRows(newRows);
    notifyChange(columns, newRows);
  };

  const handleRemoveRow = (rowId: string) => {
    if (rows.length <= 1) return;
    const newRows = rows.filter((row) => row.id !== rowId);
    setRows(newRows);
    notifyChange(columns, newRows);
  };

  const handleCellChange = (rowId: string, columnId: string, value: string) => {
    const newRows = rows.map((row) =>
      row.id === rowId
        ? { ...row, values: { ...row.values, [columnId]: value } }
        : row
    );
    setRows(newRows);
    notifyChange(columns, newRows);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Tabla de Variedades</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAddColumn}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar columna
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddRow}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar fila
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header - Column Names (Editable) */}
            <thead>
              <tr className="bg-muted/50">
                <th className="w-10 p-2 border-b border-border">
                  <span className="sr-only">Acciones</span>
                </th>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className="p-2 border-b border-border min-w-[120px]"
                  >
                    <div className="flex items-center gap-1">
                      <Input
                        value={column.name}
                        onChange={(e) =>
                          handleColumnNameChange(column.id, e.target.value)
                        }
                        className="h-8 text-sm font-medium text-center bg-transparent border-dashed hover:border-solid focus:border-solid"
                        placeholder="Nombre columna"
                      />
                      {columns.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveColumn(column.id)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          title="Eliminar columna"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="w-10 p-2 border-b border-border">
                  <span className="sr-only">Eliminar fila</span>
                </th>
              </tr>
            </thead>

            {/* Body - Rows (Variants) */}
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="p-2 border-b border-border text-center">
                    <span className="text-muted-foreground text-sm">
                      <GripVertical className="w-4 h-4 inline-block opacity-50" />
                    </span>
                  </td>
                  {columns.map((column) => (
                    <td
                      key={`${row.id}-${column.id}`}
                      className="p-2 border-b border-border"
                    >
                      <Input
                        value={row.values[column.id] ?? ""}
                        onChange={(e) =>
                          handleCellChange(row.id, column.id, e.target.value)
                        }
                        className="h-8 text-sm"
                        placeholder={`${column.name}...`}
                      />
                    </td>
                  ))}
                  <td className="p-2 border-b border-border text-center">
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        title="Eliminar fila"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground">
        {rows.length} variedad{rows.length !== 1 ? "es" : ""} · {columns.length}{" "}
        columna{columns.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
};

export default ProductVariantsTable;
