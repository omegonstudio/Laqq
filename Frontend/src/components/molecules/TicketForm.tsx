import { useEffect, useState } from "react";
import InputField from "../atoms/InputField";
import Button from "../atoms/Button";
import { toast } from "@/hooks/use-toast";
import UploadFile from "../atoms/UploadFile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Product } from "@/types/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAllProducts } from "@/store/productSlice";
import { ProductSearchCombobox } from "./ProductSearch";
import { ticketsApi } from "@/lib/api/tickets";
import { attachmentsApi } from "@/lib/api/attachments";

interface TicketFormProps {
  onClose?: () => void;
}

const TicketForm = ({ onClose }: TicketFormProps) => {
  const dispatch = useAppDispatch();
  const { list: products } = useAppSelector((state) => state.products);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Contact fields
    email: "",
    first_name: "",
    last_name: "",
    company_name: "",
    phone: "",
    // Ticket fields
    description: "",
    product: "",
    priority: "medium",
  });

  useEffect(() => {
    dispatch(fetchAllProducts());
  }, [dispatch]);

  const activeProducts = products.filter((p) => p.is_active);

  const handleProductSelect = (product: Product | null) => {
    setSelectedProduct(product);
    setFormData((prev) => ({ ...prev, product: product?.id || "" }));
  };

  const handleFile = (file: File | null) => {
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.first_name || !formData.last_name) {
      toast({
        title: "Error",
        description: "Por favor completá los datos de contacto",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description || formData.description.trim().length < 20) {
      toast({
        title: "Error",
        description: "La descripción debe tener al menos 20 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        contact: {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          company_name: formData.company_name || undefined,
          phone: formData.phone || undefined,
        },
        ticket: {
          description: formData.description,
          product: formData.product || undefined,
          priority: formData.priority,
        },
      };

      const result = await ticketsApi.createFromPackage(payload);

      // Si hay un archivo adjunto, subirlo al ticket creado
      if (selectedFile && result.ticket.id) {
        try {
          await attachmentsApi.create({
            file: selectedFile,
            role: "other",
            attachable_type: "ServiceTicket",
            attachable_id: result.ticket.id,
          });
        } catch {
          // No cancelar el flujo si falla el adjunto
          toast({
            title: "Advertencia",
            description:
              "El ticket fue creado pero no se pudo adjuntar el archivo.",
          });
        }
      }

      toast({
        title: "Ticket Creado",
        description: `Tu ticket ${result.ticket.ticket_number} fue registrado. Revisá tu email para las credenciales de acceso.`,
      });

      onClose?.();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error al crear el ticket. Intentá de nuevo.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Datos de contacto
        </p>
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Nombre"
            value={formData.first_name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, first_name: e.target.value }))
            }
            placeholder="Juan"
            required
          />
          <InputField
            label="Apellido"
            value={formData.last_name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, last_name: e.target.value }))
            }
            placeholder="Pérez"
            required
          />
        </div>
        <InputField
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          placeholder="juan@example.com"
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Empresa"
            value={formData.company_name}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                company_name: e.target.value,
              }))
            }
            placeholder="Empresa SA (opcional)"
          />
          <InputField
            label="Teléfono"
            value={formData.phone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="+54 11 (opcional)"
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          Datos del ticket
        </p>

        <div>
          <label className="block text-sm font-medium mb-2">
            Producto (opcional)
          </label>
          <ProductSearchCombobox
            products={activeProducts}
            selectedProduct={selectedProduct}
            onSelect={handleProductSelect}
            placeholder="Buscar producto por nombre o código"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Prioridad</label>
          <Select
            value={formData.priority}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, priority: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona la prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Descripción del Problema{" "}
            <span className="text-destructive">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Describe el problema o solicitud con el mayor detalle posible (mínimo 20 caracteres)"
            required
          />
        </div>

        <UploadFile onFileChange={handleFile} />
      </div>

      <div className="flex gap-3">
        {onClose && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Enviar Ticket"}
        </Button>
      </div>
    </form>
  );
};

export default TicketForm;
