import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Button from "@/components/atoms/Button";
import { useState } from "react";
import { SpecificationsForm } from "@/types/api";
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: SpecificationsForm) => void;
  initialData: SpecificationsForm;
}

const GeneralSpecificationsDialog = ({
  open,
  onOpenChange,
  onSave,
  initialData,
}: Props) => {
  const [form, setForm] = useState(initialData);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Condiciones Generales</DialogTitle>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-sm">
          <div>
            <label>Precios</label>
            <Select
              value={form.precios}
              onValueChange={(v) => handleChange("precios", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lista">Lista</SelectItem>
                <SelectItem value="especial">Especial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label>Forma de pago</label>
            <Select
              value={form.forma_pago}
              onValueChange={(v) => handleChange("forma_pago", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="contado">Contado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label>Cláusula de pago</label>
            <Textarea
              value={form.clausula_pago}
              onChange={(e) => handleChange("clausula_pago", e.target.value)}
            />
          </div>

          <div>
            <label>Validez oferta</label>
            <Input
              value={form.validez_oferta}
              onChange={(e) => handleChange("validez_oferta", e.target.value)}
            />
          </div>

          <div>
            <label>Garantía</label>
            <Input
              value={form.garantia}
              onChange={(e) => handleChange("garantia", e.target.value)}
            />
          </div>

          <div>
            <label>Orden de compra</label>
            <Input
              value={form.orden_compra}
              onChange={(e) => handleChange("orden_compra", e.target.value)}
            />
          </div>

          <div>
            <label>Observaciones</label>
            <Textarea
              value={form.observaciones}
              onChange={(e) => handleChange("observaciones", e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>

            <Button variant="primary" onClick={handleSave}>
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GeneralSpecificationsDialog;
