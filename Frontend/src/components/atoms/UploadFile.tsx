import { toast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";

interface UploadFileProps {
  onFileChange: (file: File | null) => void;
  allowedTypes?: string[];
  label?: string;
  helpText?: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/svg+xml"];

const UploadFile: React.FC<UploadFileProps> = ({
  onFileChange,
  allowedTypes = ["image/jpeg", "image/png", "image/svg+xml"],
  label = "Adjuntar Archivo (opcional)",
  helpText,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const getErrorMessage = () => {
    const types = allowedTypes
      .map((type) => {
        const [category, format] = type.split("/");
        return format.toUpperCase();
      })
      .join(", ");

    return `Solo se permiten archivos: ${types}`;
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0] ?? null;
    if (!file) return;

    const isValidType =
  allowedTypes.includes(file.type) ||
  file.name.toLowerCase().endsWith(".svg");

if (!isValidType) {      toast({
        title: getErrorMessage(),
        variant: "destructive",
      });
      return;
    }

    onFileChange(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    if (!file) {
      onFileChange(null);
      return;
    }

    const isValidType =
  allowedTypes.includes(file.type) ||
  file.name.toLowerCase().endsWith(".svg");

if (!isValidType) {      toast({
        title: getErrorMessage(),
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    onFileChange(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
          ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary"
          }
        `}
      >
        <Upload
          className={`w-8 h-8 mx-auto mb-2 ${
            dragActive ? "text-primary" : "text-muted-foreground"
          }`}
        />

        <p className="text-sm text-muted-foreground">
          {dragActive
            ? "Soltá el archivo para cargarlo"
            : helpText || "Click para cargar o arrastra el archivo aquí"}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={allowedTypes.join(",")}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default UploadFile;
