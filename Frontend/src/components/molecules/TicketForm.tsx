import { useEffect, useState } from "react";
import InputField from "../atoms/InputField";
import Button from "../atoms/Button";
import { toast } from "@/hooks/use-toast";
import UploadFile from "../atoms/UploadFile";
import { Product } from "@/types/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAllProducts } from "@/store/productSlice";
import { ProductSearchCombobox } from "./ProductSearch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateTicketPayload } from "@/types/api";
import { createTicket } from "@/store/ticketsSlice";
import { FileText, File as FileIcon } from "lucide-react";
import { ticketsApi } from "@/lib/api/tickets";
import { Textarea } from "../ui/textarea";

interface TicketFormProps {
  onClose?: () => void;
  isTicketModalOpen: boolean;
  setIsTicketModalOpen: (open: boolean) => void;
  ticketInitialState?: CreateTicketPayload;
}
export interface AttachTicketFileMultipart {
  file: File;
  role?: string;
}

export interface AttachTicketFileBase64 {
  file_name: string;
  data: string;
  content_type?: string;
  role?: string;
}

const TicketForm = ({
  onClose,
  isTicketModalOpen,
  setIsTicketModalOpen,
  ticketInitialState = {
    ticket: {
      state: "open",
      product: "",
      description: "",
      product_name: "",
      attachment: null,
      attachments: [],
      priority: null,
    },
    contact: {
      first_name: "",
      last_name: "",
      email: "",
      company_name: "",
      phone: "",
      country: null,
      state: "new",
    },
  },
}: TicketFormProps) => {
  const [formData, setFormData] =
    useState<CreateTicketPayload>(ticketInitialState);

  const dispatch = useAppDispatch();
  const { list: products } = useAppSelector((state) => state.products);
  const [disabled, setDisabled] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.contact.first_name.trim()) {
      newErrors.first_name = "El nombre es obligatorio.";
    }
    if (!formData.contact.last_name.trim()) {
      newErrors.last_name = "El apellido es obligatorio.";
    }
    if (!formData.contact.email.trim()) {
      newErrors.email = "El email es obligatorio.";
    } else if (!/\S+@\S+\.\S+/.test(formData.contact.email)) {
      newErrors.email = "El email no es válido.";
    }
    if (!formData.ticket.product.trim()) {
      newErrors.product = "El producto es obligatorio.";
    }
    if (!formData.ticket.description.trim()) {
      newErrors.description = "La descripción es obligatoria.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Por favor corrige los errores en el formulario.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // 1. Crear ticket SIN archivo
      const ticket = await dispatch(createTicket(formData)).unwrap();
      // 2. Si hay archivo, adjuntarlo al ticket
      if (selectedFile) {
        await ticketsApi.attachFileMultipart(ticket.ticket.id, {
          file: selectedFile,
          role: "customer",
          detail: "Archivo adjunto desde formulario de soporte",
        });
      }
      toast({
        title: "Ticket creado",
        description: "Tu solicitud fue registrada.",
      });

      resetForm();
      onClose?.();
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo crear el ticket.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    setFormData(ticketInitialState);
  }, []);

  useEffect(() => {
    const { contact, ticket } = formData;
    const isFormValid =
      contact.first_name.trim() !== "" &&
      contact.last_name.trim() !== "" &&
      contact.email.trim() !== "" &&
      ticket.product.trim() !== "" &&
      ticket.description.trim() !== "";
    setDisabled(!isFormValid);
  }, [formData]);

  useEffect(() => {
    dispatch(fetchAllProducts({}));
  }, [dispatch]);

  const handleFile = (file: File | null) => {
    if (file) {
      setSelectedFile(file);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setFilePreview(null);
    }
  };

  const handleProductSelect = (product: Product | null) => {
    setSelectedProduct(product);
    setFormData({
      ...formData,
      ticket: {
        ...formData.ticket,
        product: product?.id || "",
        product_name: product?.name || "",
      },
    });
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const resetForm = () => {
    setFormData(ticketInitialState);
    setSelectedFile(null);
    setFilePreview(null);
    setSelectedProduct(null);
  };

  const activeProducts = products.filter((p) => p.is_active);
  const renderFilePreview = () => {
    if (!selectedFile || !filePreview) return null;

    const fileType = selectedFile.type;
    const fileName = selectedFile.name;

    // Preview para imágenes
    if (fileType.startsWith("image/")) {
      return (
        <div className="relative inline-block mt-2">
          <img
            src={filePreview}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-100"
          />
          <button
            type="button"
            onClick={handleRemoveFile}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Eliminar archivo"
          >
            ×
          </button>
        </div>
      );
    }

    // Preview para PDFs
    if (fileType === "application/pdf") {
      return (
        <div className="relative inline-block mt-2">
          <div className="w-32 h-32 flex flex-col items-center justify-center rounded-lg border-2 border-gray-100 bg-gray-50">
            <FileText className="w-12 h-12 text-red-500 mb-2" />
            <span className="text-xs text-gray-600 text-center px-2 truncate w-full">
              {fileName}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Eliminar archivo"
          >
            ×
          </button>
        </div>
      );
    }

    // Preview para Excel
    if (
      fileType === "application/vnd.ms-excel" ||
      fileType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      return (
        <div className="relative inline-block mt-2">
          <div className="w-32 h-32 flex flex-col items-center justify-center rounded-lg border-2 border-gray-100 bg-gray-50">
            <FileIcon className="w-12 h-12 text-green-600 mb-2" />
            <span className="text-xs text-gray-600 text-center px-2 truncate w-full">
              {fileName}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Eliminar archivo"
          >
            ×
          </button>
        </div>
      );
    }

    // Preview genérico
    return (
      <div className="relative inline-block mt-2">
        <div className="w-32 h-32 flex flex-col items-center justify-center rounded-lg border-2 border-gray-100 bg-gray-50">
          <FileIcon className="w-12 h-12 text-gray-500 mb-2" />
          <span className="text-xs text-gray-600 text-center px-2 truncate w-full">
            {fileName}
          </span>
        </div>
        <button
          type="button"
          onClick={handleRemoveFile}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
          title="Eliminar archivo"
        >
          ×
        </button>
      </div>
    );
  };

  return (
    <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
      <DialogContent className="h-[90%] sm:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Ticket de Soporte</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 h-[90%]">
          <div className="grid md:grid-cols-2 gap-4">
            <InputField
              label="Nombre"
              value={formData.contact.first_name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contact: { ...formData.contact, first_name: e.target.value },
                })
              }
              placeholder="Nombre"
            />
            <InputField
              label="Apellido"
              value={formData.contact.last_name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contact: { ...formData.contact, last_name: e.target.value },
                })
              }
              placeholder="Apellido"
              error={errors.last_name}
            />
            <InputField
              label="Email"
              type="email"
              value={formData.contact.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contact: { ...formData.contact, email: e.target.value },
                })
              }
              placeholder="Email asociado al ticket"
              required
            />
            <InputField
              label="Teléfono"
              value={formData.contact.phone}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contact: { ...formData.contact, phone: e.target.value },
                })
              }
              placeholder="Teléfono asociado al ticket"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-sm font-medium mb-2">
              Producto <span className="text-destructive">*</span>
            </label>
            <div className="z-1000">
              <ProductSearchCombobox
                products={activeProducts}
                selectedProduct={selectedProduct}
                onSelect={handleProductSelect}
                placeholder="Buscar producto por nombre o código"
              />
              {errors.product && (
                <p className="text-sm text-destructive mt-1">
                  {errors.product}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Descripción del Problema{" "}
              <span className="text-destructive">*</span>
            </label>
            <Textarea
              error={errors.description}
              value={formData.ticket.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ticket: { ...formData.ticket, description: e.target.value },
                })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe el problema o solicitud con el mayor detalle posible"
            />
          </div>

          <UploadFile
            onFileChange={handleFile}
            allowedTypes={["image/jpeg", "image/png", "application/pdf"]}
            label="Subir imagen o PDF"
            helpText="Formatos aceptados: JPG, PNG, PDF"
          />

          {renderFilePreview()}

          <div className="flex gap-3">
            {onClose && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isUploading}
              >
                Cancelar
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={isUploading}>
              {isUploading ? "Enviando..." : "Enviar Ticket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TicketForm;
