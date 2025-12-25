import { useState } from "react";
import { Plus, X } from "lucide-react";
import InputField from "../atoms/InputField";
import Button from "../atoms/Button";
import { QuoteFormData, QuoteItem } from "@/types/types";
import { toast } from "@/hooks/use-toast";

const QuoteForm = () => {
  const [formData, setFormData] = useState<QuoteFormData>({
    name: "",
    company: "",
    email: "",
    phone: "",
    items: [{ id: "1", product: "", quantity: 1 }],
    message: "",
  });

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { id: Date.now().toString(), product: "", quantity: 1 },
      ],
    });
  };

  const removeItem = (id: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.id !== id),
    });
  };

  const updateItem = (
    id: string,
    field: keyof QuoteItem,
    value: string | number
  ) => {
    setFormData({
      ...formData,
      items: formData.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Quote request:", formData);
    toast({
      title: "Solicitud Enviada",
      description: "Nos pondremos en contacto contigo pronto.",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <InputField
          label="Nombre"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <InputField
          label="Empresa"
          value={formData.company}
          onChange={(e) =>
            setFormData({ ...formData, company: e.target.value })
          }
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
          label="Teléfono"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Productos</label>
          <Button type="button" variant="ghost" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-1" /> Agregar Producto
          </Button>
        </div>

        {formData.items.map((item) => (
          <div key={item.id} className="flex gap-2">
            <InputField
              placeholder="Nombre del producto o código"
              value={item.product}
              onChange={(e) => updateItem(item.id, "product", e.target.value)}
              className="flex-1"
              required
            />
            <InputField
              type="number"
              placeholder="Cantidad"
              value={item.quantity}
              onChange={(e) =>
                updateItem(item.id, "quantity", parseInt(e.target.value))
              }
              className="w-24"
              min="1"
              required
            />
            {formData.items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="p-2.5 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Mensaje</label>
        <textarea
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          className="w-full px-4 py-2.5 rounded-xl border border-input bg-background min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Información adicional..."
        />
      </div>

      <Button type="submit" size="lg" className="w-full">
        Enviar Solicitud
      </Button>
    </form>
  );
};

export default QuoteForm;
