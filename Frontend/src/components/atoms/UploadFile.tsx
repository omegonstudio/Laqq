import { toast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";

interface UploadFileProps {
  onFileChange: (files: File[] | File | null) => void;
  allowedTypes?: string[];
  label?: string;
  helpText?: string;
  multiple?: boolean; // 👈 nueva prop
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "application/pdf",
];

const UploadFile: React.FC<UploadFileProps> = ({
  onFileChange,
  allowedTypes = ALLOWED_TYPES,
  label = "Adjuntar Archivo (opcional)",
  helpText,
  multiple = false,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const getErrorMessage = () => {
    const types = allowedTypes
      .map((type) => type.split("/")[1].toUpperCase())
      .join(", ");
    return `Solo se permiten archivos: ${types}`;
  };

  const isValidFile = (file: File) => {
    return (
      allowedTypes.includes(file.type) ||
      file.name.toLowerCase().endsWith(".svg") ||
      file.name.toLowerCase().endsWith(".pdf")
    );
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

  const processFiles = (fileList: FileList) => {
    const filesArray = Array.from(fileList);

    const validFiles: File[] = [];
    const invalidFiles: File[] = [];

    filesArray.forEach((file) => {
      if (isValidFile(file)) validFiles.push(file);
      else invalidFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      toast({
        title: getErrorMessage(),
        variant: "destructive",
      });
    }

    if (validFiles.length === 0) return;

    if (multiple) {
      onFileChange(validFiles);
    } else {
      onFileChange(validFiles[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);

    if (!e.dataTransfer.files?.length) return;
    processFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files || files.length === 0) {
      onFileChange(null);
      return;
    }

    processFiles(files);

    // reset input para permitir subir el mismo archivo otra vez
    e.target.value = "";
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
            ? "Soltá los archivos"
            : helpText ||
              (multiple
                ? "Click o arrastrá múltiples archivos"
                : "Click o arrastrá un archivo")}
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple={multiple} // 👈 clave
          accept={allowedTypes.join(",") + ",.pdf,.svg"}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default UploadFile;
