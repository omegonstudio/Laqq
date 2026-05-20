"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function DescriptionEditor({ value, onChange }: Props) {
  const [preview, setPreview] = useState(false);

  const hasHtml = useMemo(() => {
    return /<\/?[a-z][\s\S]*>/i.test(value);
  }, [value]);
  const TABLE_TEMPLATE = `
  <table border="1">
    <thead>
      <tr>
        <th>Columna 1</th>
        <th>Columna 2</th>
        <th>Columna 3</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Dato 1</td>
        <td>Dato 2</td>
        <td>Dato 3</td>
      </tr>
    </tbody>
  </table>
  `;

  const insertTable = () => {
    // Evitar insertar dos veces seguidas el template vacío
    if (value.includes(TABLE_TEMPLATE.trim())) {
      return;
    }

    const nextValue = value.trim()
      ? `${value}\n\n${TABLE_TEMPLATE}`
      : TABLE_TEMPLATE;

    onChange(nextValue);
  };
  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        {hasHtml && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setPreview((p) => !p)}
          >
            {preview ? "Editar HTML" : "Visualizar"}
          </Button>
        )}
        <Button type="button" variant="outline" onClick={insertTable}>
          Insertar tabla
        </Button>
      </div>

      {/* Preview */}
      {preview && hasHtml ? (
        <div
          className="
            min-h-[200px]
            rounded-md
            border
            p-4
            prose
            max-w-none
            [&_table]:w-full
            [&_table]:border-collapse
            [&_th]:border
            [&_td]:border
            [&_th]:p-2
            [&_td]:p-2
          "
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Descripción del producto"
          className="min-h-[220px] font-mono"
        />
      )}
    </div>
  );
}
