import { useState } from "react";
import { Upload } from "lucide-react";
import InputField from "../atoms/InputField";
import Button from "../atoms/Button";
import { TicketFormData } from "@/types/types";
import { toast } from "@/hooks/use-toast";
import UploadFile from "../atoms/UploadFile";

interface TicketFormProps {
  onClose?: () => void;
}

const TicketForm = ({ onClose }: TicketFormProps) => {
  const [formData, setFormData] = useState<TicketFormData>({
    name: "",
    email: "",
    product: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Support ticket:", formData);
    toast({
      title: "Ticket Creado",
      description: "Tu solicitud ha sido registrada. Te contactaremos pronto.",
    });
    onClose?.();
  };
  const [file, setFile] = useState<File | null>(null);

  const handleFile = (selectedFile: File | null) => {
    setFile(selectedFile);
    console.log("Archivo recibido:", selectedFile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputField
        label="Nombre"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <InputField
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />

      <InputField
        label="Producto"
        value={formData.product}
        onChange={(e) => setFormData({ ...formData, product: e.target.value })}
        placeholder="Modelo o número de serie"
        required
      />

      <div>
        <label className="block text-sm font-medium mb-2">
          Descripción del Problema
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full px-4 py-2.5 rounded-xl border border-input bg-background min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
      </div>

      <UploadFile onFileChange={handleFile} />

      <div className="flex gap-3">
        {onClose && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" className="flex-1">
          Enviar Ticket
        </Button>
      </div>
    </form>
  );
};

export default TicketForm;
