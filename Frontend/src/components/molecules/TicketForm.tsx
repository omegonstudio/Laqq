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
import { attachmentsApi } from "@/lib/api/attachments";
interface TicketFormProps {
  onClose?: () => void;
  isTicketModalOpen: boolean;
  setIsTicketModalOpen: (open: boolean) => void;
}

const TicketForm = ({
  onClose,
  isTicketModalOpen,
  setIsTicketModalOpen,
}: TicketFormProps) => {
  const [formData, setFormData] = useState<CreateTicketPayload>({
    product: "",
    description: "",
    contact_id: "facaf501-1e37-4681-9c4d-e5f276c12817",
    product_name: "",
    attachment: null,
    contact: {
      id: "",
      state: "new",
      created_at: null,
      updated_at: null,
      first_name: "",
      last_name: "",
      email: "",
      company_name: "",
      phone: "",
      country: null,
      message: "",
      assigned_user: null,
    },
  });

  const dispatch = useAppDispatch();
  const { list: products } = useAppSelector((state) => state.products);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    dispatch(fetchAllProducts());
  }, [dispatch]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product) {
      toast({
        title: "Error",
        description: "Debes seleccionar un producto",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // 1. Si hay archivo, primero subirlo y obtener el ID
      let attachmentId = null;
      if (selectedFile) {
        const attachmentResponse = await attachmentsApi.create({
          file: selectedFile,
        });
        attachmentId = attachmentResponse.id; // o el campo que retorne tu API
      }

      // 2. Crear el ticket con el ID del attachment
      const ticketPayload = {
        ...formData,
        attachment: attachmentId,
      };

      await dispatch(createTicket(ticketPayload)).unwrap();

      toast({
        title: "Ticket Creado",
        description:
          "Tu solicitud ha sido registrada. Te contactaremos pronto.",
      });

      // Limpiar el formulario
      resetForm();
      onClose?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al crear el ticket. Intentá de nuevo.",
        variant: "destructive",
      });
      console.error("Error creating ticket:", error);
    } finally {
      setIsUploading(false);
    }
  };

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
      product: product?.id || "",
      product_name: product?.name || "",
    });
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const resetForm = () => {
    setFormData({
      product: "",
      description: "",
      product_name: "",
      attachment: null,
      contact: {
        id: "",
        state: "new",
        created_at: null,
        updated_at: null,
        first_name: "",
        last_name: "",
        email: "",
        company_name: "",
        phone: "",
        country: null,
        message: "",
        assigned_user: null,
      },
    });
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
      <DialogContent className="w-[90vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Crear Ticket de Soporte</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-hidden">
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
            />
            <div className="col-span-2">
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
            </div>
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
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Descripción del Problema{" "}
              <span className="text-destructive">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
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
