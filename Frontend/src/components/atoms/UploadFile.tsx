import { Upload } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";

interface UploadFileProps {
  onFileChange: (file: File | null) => void;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png"];

const UploadFile: React.FC<UploadFileProps> = ({ onFileChange }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

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

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Solo se permiten imágenes JPG o PNG");
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

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Solo se permiten imágenes JPG o PNG");
      e.target.value = "";
      return;
    }

    onFileChange(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Adjuntar Archivo (opcional)
      </label>

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
            ? "Soltá la imagen para cargarla"
            : "Click para cargar o arrastra el archivo aquí"}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default UploadFile;
