import { useCallback, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductSpecTable } from "@/types/types";

interface ColumnState {
  id: string;
  name: string;
}

interface RowState {
  id: string;
  cells: string[];
}

interface ProductSpecTableEditorProps {
  value?: ProductSpecTable | null;
  onChange?: (table: ProductSpecTable) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const tableToColumns = (table?: ProductSpecTable | null): ColumnState[] =>
  (table?.columns ?? []).map((name) => ({ id: generateId(), name }));

const tableToRows = (table?: ProductSpecTable | null): RowState[] => {
  const colCount = table?.columns?.length ?? 0;
  return (table?.rows ?? []).map((row) => {
    const cells = [...row];
    if (colCount > cells.length) {
      cells.push(...Array(colCount - cells.length).fill(""));
    }
    return { id: generateId(), cells: cells.slice(0, colCount) };
  });
};

const toSpecTable = (columns: ColumnState[], rows: RowState[]): ProductSpecTable => ({
  columns: columns.map((col) => col.name),
  rows: rows.map((row) => {
    const cells = [...row.cells];
    while (cells.length < columns.length) cells.push("");
    return cells.slice(0, columns.length);
  }),
});

const ProductSpecTableEditor: React.FC<ProductSpecTableEditorProps> = ({
  value,
  onChange,
}) => {
  const [columns, setColumns] = useState<ColumnState[]>(() =>
    tableToColumns(value)
  );
  const [rows, setRows] = useState<RowState[]>(() => tableToRows(value));

  const emit = useCallback(
    (nextColumns: ColumnState[], nextRows: RowState[]) => {
      onChange?.(toSpecTable(nextColumns, nextRows));
    },
    [onChange]
  );

  const handleAddColumn = () => {
    const nextColumns = [
      ...columns,
      { id: generateId(), name: `Columna ${columns.length + 1}` },
    ];
    const nextRows = rows.map((row) => ({
      ...row,
      cells: [...row.cells, ""],
    }));
    setColumns(nextColumns);
    setRows(nextRows);
    emit(nextColumns, nextRows);
  };

  const handleRemoveColumn = (columnId: string) => {
    const index = columns.findIndex((col) => col.id === columnId);
    if (index < 0) return;
    const nextColumns = columns.filter((col) => col.id !== columnId);
    const nextRows = rows.map((row) => ({
      ...row,
      cells: row.cells.filter((_, i) => i !== index),
    }));
    setColumns(nextColumns);
    setRows(nextRows);
    emit(nextColumns, nextRows);
  };

  const handleColumnNameChange = (columnId: string, name: string) => {
    const nextColumns = columns.map((col) =>
      col.id === columnId ? { ...col, name } : col
    );
    setColumns(nextColumns);
    emit(nextColumns, rows);
  };

  const handleAddRow = () => {
    const nextRows = [
      ...rows,
      {
        id: generateId(),
        cells: columns.map(() => ""),
      },
    ];
    setRows(nextRows);
    emit(columns, nextRows);
  };

  const handleRemoveRow = (rowId: string) => {
    const nextRows = rows.filter((row) => row.id !== rowId);
    setRows(nextRows);
    emit(columns, nextRows);
  };

  const handleCellChange = (rowId: string, colIndex: number, cellValue: string) => {
    const nextRows = rows.map((row) => {
      if (row.id !== rowId) return row;
      const cells = [...row.cells];
      cells[colIndex] = cellValue;
      return { ...row, cells };
    });
    setRows(nextRows);
    emit(columns, nextRows);
  };

  const isEmpty = columns.length === 0 && rows.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="text-xl font-bold">Especificaciones técnicas</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" type="button" onClick={handleAddColumn}>
            <Plus className="w-4 h-4 mr-1" />
            Columna
          </Button>
          <Button size="sm" variant="outline" type="button" onClick={handleAddRow}>
            <Plus className="w-4 h-4 mr-1" />
            Fila
          </Button>
        </div>
      </div>

      {isEmpty ? (
        <p className="text-sm text-muted-foreground">
          Agregá columnas y filas para armar la tabla. Si queda vacía, no se
          muestra en la ficha pública.
        </p>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <table className="w-full">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.id}>
                    <div className="flex gap-1 px-1">
                      <Input
                        className="my-2"
                        value={col.name}
                        onChange={(e) =>
                          handleColumnNameChange(col.id, e.target.value)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveColumn(col.id)}
                        aria-label="Eliminar columna"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((col, colIndex) => (
                    <td key={col.id}>
                      <Input
                        className="my-2"
                        value={row.cells[colIndex] ?? ""}
                        onChange={(e) =>
                          handleCellChange(row.id, colIndex, e.target.value)
                        }
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(row.id)}
                      aria-label="Eliminar fila"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {rows.length} filas · {columns.length} columnas
      </p>
    </div>
  );
};

export default ProductSpecTableEditor;
