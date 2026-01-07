import { Upload } from "lucide-react";
import { ChangeEvent, useRef } from "react";

interface UploadFileProps {
  onFileChange: (file: File | null) => void;
}

const UploadFile: React.FC<UploadFileProps> = ({ onFileChange }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onFileChange(file);
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Adjuntar Archivo (opcional)
      </label>

      <div
        onClick={handleClick}
        className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer"
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />

        <p className="text-sm text-muted-foreground">
          Click para cargar o arrastra el archivo aquí
        </p>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default UploadFile;
