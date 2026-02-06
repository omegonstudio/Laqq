import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
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
import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAllProducts } from "@/store/productSlice";
import { ProductSearchCombobox } from "./ProductSearch";
interface TicketFormData {
  contact: string;
  product: string; // ID del producto
  description: string;
  priority: string;
  attachment: File | null;
}

interface TicketFormProps {
  onClose?: () => void;
}

const TicketForm = ({ onClose }: TicketFormProps) => {
  const [formData, setFormData] = useState<TicketFormData>({
    contact: "",
    product: "",
    description: "",
    priority: "medium",
    attachment: null,
  });
  const dispatch = useAppDispatch();
  const { list: products, loading: loadingProducts } = useAppSelector(
    (state) => state.products
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAllProducts());
  }, [dispatch]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product) {
      toast({
        title: "Error",
        description: "Debes seleccionar un producto",
        variant: "destructive",
      });
      return;
    }

    // Aquí deberías crear el ticket con los datos del formulario
    // El backend debería generar automáticamente:
    // - ticket_number
    // - product_name (basado en el product ID)
    // - state (probablemente "open")
    // - created_at, updated_at
    console.log("Support ticket:", formData);

    toast({
      title: "Ticket Creado",
      description: "Tu solicitud ha sido registrada. Te contactaremos pronto.",
    });

    onClose?.();
  };

  const handleFile = (selectedFile: File | null) => {
    setFormData({ ...formData, attachment: selectedFile });
  };

  const handleProductSelect = (product: Product | null) => {
    setSelectedProduct(product);
    setFormData({ ...formData, product: product?.id || "" });
  };
  const handleRemoveImage = () => {
    setFormData({
      ...formData,
      // image_file: null,
      // image_attachment_id: null,
    });
    setImagePreview(null);
  };
  const activeProducts = products.filter((p) => p.is_active);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputField
        label="Contacto"
        value={formData.contact}
        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
        placeholder="Nombre completo o empresa"
        required
      />

      <div>
        <label className="block text-sm font-medium mb-2">
          Producto <span className="text-destructive">*</span>
        </label>
        <ProductSearchCombobox
          products={activeProducts}
          selectedProduct={selectedProduct}
          onSelect={handleProductSelect}
          placeholder="Buscar producto por nombre o código"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Descripción del Problema <span className="text-destructive">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full px-4 py-2.5 rounded-xl border border-input bg-background min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Describe el problema o solicitud con el mayor detalle posible"
          required
        />
      </div>

      <UploadFile onFileChange={handleFile} />
      {imagePreview && (
        <div className="relative inline-block mt-2">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-100"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Eliminar imagen"
          >
            ×
          </button>
        </div>
      )}
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
