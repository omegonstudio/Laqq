"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ============================
// TYPES
// ============================

export interface TecnicalSpecs {
  id?: string;
  key: string;
  value: string;
}

export interface Variants {
  id?: string;
  code: string;
  name: string;
  product: string;
  tecnical_specs?: TecnicalSpecs[];
}

export interface VariantColumn {
  id: string;
  name: string;
}

interface VariantRow {
  id: string;
  code: string;
  name: string;
  tecnical_specs: TecnicalSpecs[];
}

interface ProductVariantsTableProps {
  onChange?: (variants: Variants[]) => void;
  initialData?: Variants[];
}

// ============================
// HELPERS
// ============================

const generateId = () => Math.random().toString(36).substring(2, 9);

// Construye columnas desde variantes iniciales
const extractColumns = (variants: Variants[]): VariantColumn[] => {
  const keys = new Set<string>();

  variants.forEach((v) => {
    v.tecnical_specs?.forEach((s) => {
      if (s.key) keys.add(s.key);
    });
  });

  return Array.from(keys).map((key) => ({
    id: generateId(),
    name: key,
  }));
};

// Convierte variants → rows
const variantsToRows = (
  variants: Variants[],
  columns: VariantColumn[]
): VariantRow[] => {
  return variants.map((v) => ({
    id: v.id || generateId(),
    code: v.code || "",
    name: v.name || "",
    tecnical_specs: columns.map((col) => {
      const found = v.tecnical_specs?.find((s) => s.key === col.name);
      return {
        key: col.name,
        value: found?.value || "",
        id: found?.id,
      };
    }),
  }));
};

// ============================
// COMPONENT
// ============================

const ProductVariantsTable: React.FC<ProductVariantsTableProps> = ({
  onChange,
  initialData,
}) => {
  const initialColumns =
    initialData && initialData.length > 0 ? extractColumns(initialData) : [];

  const [columns, setColumns] = useState<VariantColumn[]>(initialColumns);

  const [rows, setRows] = useState<VariantRow[]>(
    initialData && initialData.length > 0
      ? variantsToRows(initialData, initialColumns)
      : [
          {
            id: generateId(),
            code: "",
            name: "",
            tecnical_specs: [],
          },
        ]
  );

  // ============================
  // SYNC con parent
  // ============================

  const notifyChange = useCallback(
    (cols: VariantColumn[], rows: VariantRow[]) => {
      const variants: Variants[] = rows.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        product: "", // lo setea el padre
        tecnical_specs: row.tecnical_specs.filter((s) => s.key && s.value),
      }));

      onChange?.(variants);
    },
    [onChange]
  );

  useEffect(() => {
    notifyChange(columns, rows);
  }, [columns, rows]);

  // ============================
  // HELPERS
  // ============================

  const syncSpecsWithColumns = (
    rows: VariantRow[],
    columns: VariantColumn[]
  ): VariantRow[] => {
    return rows.map((row) => {
      const map = new Map(row.tecnical_specs.map((s) => [s.key, s]));

      return {
        ...row,
        tecnical_specs: columns.map((col) => ({
          key: col.name,
          value: map.get(col.name)?.value || "",
          id: map.get(col.name)?.id,
        })),
      };
    });
  };

  // ============================
  // COLUMN HANDLERS
  // ============================

  const handleAddColumn = () => {
    const newColumn: VariantColumn = {
      id: generateId(),
      name: `Columna ${columns.length + 1}`,
    };

    const newColumns = [...columns, newColumn];
    const newRows = syncSpecsWithColumns(rows, newColumns);

    setColumns(newColumns);
    setRows(newRows);
  };

  const handleRemoveColumn = (columnId: string) => {
    const col = columns.find((c) => c.id === columnId);
    if (!col) return;

    const newColumns = columns.filter((c) => c.id !== columnId);

    const newRows = rows.map((row) => ({
      ...row,
      tecnical_specs: row.tecnical_specs.filter((s) => s.key !== col.name),
    }));

    setColumns(newColumns);
    setRows(newRows);
  };

  const handleColumnNameChange = (columnId: string, newName: string) => {
    const old = columns.find((c) => c.id === columnId);
    if (!old) return;

    const newColumns = columns.map((col) =>
      col.id === columnId ? { ...col, name: newName } : col
    );

    const newRows = rows.map((row) => ({
      ...row,
      tecnical_specs: row.tecnical_specs.map((spec) =>
        spec.key === old.name ? { ...spec, key: newName } : spec
      ),
    }));

    setColumns(newColumns);
    setRows(newRows);
  };

  // ============================
  // ROW HANDLERS
  // ============================

  const handleAddRow = () => {
    const newRow: VariantRow = {
      id: generateId(),
      code: "",
      name: "",
      tecnical_specs: columns.map((col) => ({
        key: col.name,
        value: "",
      })),
    };

    setRows([...rows, newRow]);
  };

  const handleRemoveRow = (rowId: string) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((r) => r.id !== rowId));
  };

  const handleRowChange = (
    rowId: string,
    field: "code" | "name",
    value: string
  ) => {
    setRows(
      rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  const handleSpecChange = (
    rowId: string,
    columnName: string,
    value: string
  ) => {
    setRows(
      rows.map((row) => {
        if (row.id !== rowId) return row;

        return {
          ...row,
          tecnical_specs: row.tecnical_specs.map((spec) =>
            spec.key === columnName ? { ...spec, value } : spec
          ),
        };
      })
    );
  };

  // ============================
  // RENDER
  // ============================

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="text-xl font-bold">Tabla de Variantes</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleAddColumn}>
            <Plus className="w-4 h-4 mr-1" />
            Columna
          </Button>
          <Button size="sm" variant="outline" onClick={handleAddRow}>
            <Plus className="w-4 h-4 mr-1" />
            Fila
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th></th>
              <th>Código</th>
              <th>Nombre</th>
              {columns.map((col) => (
                <th key={col.id}>
                  <div className="flex gap-1">
                    <Input
                      value={col.name}
                      onChange={(e) =>
                        handleColumnNameChange(col.id, e.target.value)
                      }
                    />
                    <button onClick={() => handleRemoveColumn(col.id)}>
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
                <td>
                  <GripVertical className="w-4 h-4 opacity-50" />
                </td>

                <td>
                  <Input
                    value={row.code}
                    onChange={(e) =>
                      handleRowChange(row.id, "code", e.target.value)
                    }
                  />
                </td>

                <td>
                  <Input
                    value={row.name}
                    onChange={(e) =>
                      handleRowChange(row.id, "name", e.target.value)
                    }
                  />
                </td>

                {columns.map((col) => (
                  <td key={col.id}>
                    <Input
                      value={
                        row.tecnical_specs.find((s) => s.key === col.name)
                          ?.value || ""
                      }
                      onChange={(e) =>
                        handleSpecChange(row.id, col.name, e.target.value)
                      }
                    />
                  </td>
                ))}

                <td>
                  <button onClick={() => handleRemoveRow(row.id)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted-foreground">
        {rows.length} variantes · {columns.length} columnas dinámicas
      </p>
    </div>
  );
};

export default ProductVariantsTable;
