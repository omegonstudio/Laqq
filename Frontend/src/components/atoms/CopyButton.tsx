import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

const copyToClipboard = async (value?: string | null) => {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    toast({ title: "Copiado al portapapeles", description: value });
  } catch (e) {
    console.error("No se pudo copiar al portapapeles", e);
  }
};

export const CopyButton = ({
  value,
  title,
}: {
  value?: string | null;
  title?: string;
}) => {
  if (!value) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={() => copyToClipboard(value)}
      title={title ? title : "Copiar"}
    >
      <Copy size={14} />
    </Button>
  );
};
