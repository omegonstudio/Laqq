"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

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
      toast({
        title: "Ya has insertado una tabla.",
        description:
          " Edita el HTML para modificarla o eliminarla antes de insertar otra.",
        variant: "destructive",
      });
      return;
    }

    const nextValue = value.trim()
      ? `${value}\n\n${TABLE_TEMPLATE}`
      : TABLE_TEMPLATE;

    onChange(nextValue);
  };

  const formatDescription = (description: string) => {
    if (!description) return "";

    // Separar tablas temporalmente
    const tables: string[] = [];

    let content = description.replace(/<table[\s\S]*?<\/table>/gi, (match) => {
      tables.push(match);
      return `__TABLE_${tables.length - 1}__`;
    });

    // Convertir saltos de línea SOLO fuera de tablas
    content = content.replace(/\n/g, "<br />");

    // Restaurar tablas originales
    content = content.replace(
      /__TABLE_(\d+)__/g,
      (_, index) => tables[Number(index)]
    );

    return content;
  };
  const formattedDescription = formatDescription(value);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div>
          {hasHtml && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreview((p) => !p)}
            >
              {preview ? "Editar HTML" : "Visualizar"}
            </Button>
          )}
        </div>
        <Button type="button" variant="outline" onClick={insertTable}>
          Insertar tabla
        </Button>
      </div>

      {/* Preview */}
      {preview && hasHtml ? (
        <div
          className="
          border rounded-md p-4
prose prose-sm max-w-none text-muted-foreground
whitespace-normal
[&_table]:w-full
[&_table]:border-collapse
[&_table]:my-2
[&_th]:border
[&_td]:border
[&_th]:p-2
[&_td]:p-2
"
          dangerouslySetInnerHTML={{
            __html: formattedDescription,
          }}
        />
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Descripción del producto"
          className="min-h-[320px] font-mono"
        />
      )}
    </div>
  );
}
