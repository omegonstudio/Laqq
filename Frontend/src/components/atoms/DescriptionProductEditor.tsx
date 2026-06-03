"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {Table} from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import {
  Bold,
  Italic,
  List,
  Table as TableIcon,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function DescriptionEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    onUpdate({ editor }) {
      // Emit empty string instead of Tiptap's empty-doc HTML
      const html = editor.isEmpty ? "" : editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[280px] px-4 py-3 focus:outline-none prose prose-sm max-w-none " +
          "[&_table]:w-full [&_table]:border-collapse " +
          "[&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted [&_th]:font-semibold " +
          "[&_td]:border [&_td]:border-border [&_td]:p-2 " +
          "[&_ul]:list-disc [&_ul]:pl-5 " +
          "[&_ol]:list-decimal [&_ol]:pl-5 " +
          "[&_strong]:font-bold [&_em]:italic",
      },
    },
  });

  // Sync external value changes (e.g. when modal opens with existing product)
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (value !== current) {
editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  const isInTable = editor.isActive("table");

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">Descripción</label>

      <div className="border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring">
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-2 py-1.5">
          {/* Text format */}
          <ToolbarToggle
            title="Negrita"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </ToolbarToggle>

          <ToolbarToggle
            title="Cursiva"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </ToolbarToggle>

          <Divider />

          {/* Lists */}
          <ToolbarToggle
            title="Lista con viñetas"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </ToolbarToggle>

          <Divider />

          {/* Table controls */}
          {!isInTable ? (
            <ToolbarButton
              title="Insertar tabla"
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
            >
              <TableIcon className="w-4 h-4" />
              <span className="text-xs ml-1 hidden sm:inline">
                Insertar tabla
              </span>
            </ToolbarButton>
          ) : (
            <>
              <ToolbarButton
                title="Agregar columna"
                onClick={() =>
                  editor.chain().focus().addColumnAfter().run()
                }
              >
                <Plus className="w-3 h-3" />
                <span className="text-xs ml-1">Col</span>
              </ToolbarButton>

              <ToolbarButton
                title="Eliminar columna"
                onClick={() =>
                  editor.chain().focus().deleteColumn().run()
                }
              >
                <Minus className="w-3 h-3" />
                <span className="text-xs ml-1">Col</span>
              </ToolbarButton>

              <ToolbarButton
                title="Agregar fila"
                onClick={() => editor.chain().focus().addRowAfter().run()}
              >
                <Plus className="w-3 h-3" />
                <span className="text-xs ml-1">Fila</span>
              </ToolbarButton>

              <ToolbarButton
                title="Eliminar fila"
                onClick={() => editor.chain().focus().deleteRow().run()}
              >
                <Minus className="w-3 h-3" />
                <span className="text-xs ml-1">Fila</span>
              </ToolbarButton>

              <ToolbarButton
                title="Eliminar tabla"
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </ToolbarButton>
            </>
          )}
        </div>

        {/* ── Editor area ── */}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// ── Small reusable toolbar pieces ────────────────────────────────────────────

function ToolbarToggle({
  children,
  title,
  active,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Toggle
      size="sm"
      title={title}
      pressed={active}
      onPressedChange={onClick}
      className="h-7 w-7 p-0 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
    >
      {children}
    </Toggle>
  );
}

function ToolbarButton({
  children,
  title,
  onClick,
  className,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      title={title}
      onClick={onClick}
      className={cn("h-7 px-2 text-muted-foreground hover:text-foreground", className)}
    >
      {children}
    </Button>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-border" />;
}