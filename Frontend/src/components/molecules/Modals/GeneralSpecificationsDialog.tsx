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
import { useEffect, useState } from "react";
import { SpecificationsForm } from "@/types/api";

const CUSTOM_VALUE = "__custom__";

const PRECIOS_OPTIONS = [
  { value: "lista", label: "Lista" },
  { value: "especial", label: "Especial" },
];

const FORMA_PAGO_OPTIONS = [
  { value: "transferencia", label: "Transferencia" },
  { value: "cheque", label: "Cheque" },
  { value: "contado", label: "Contado" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: SpecificationsForm) => void;
  initialData: SpecificationsForm;
}

function isPreset(value: string, options: { value: string }[]) {
  return options.some((option) => option.value === value);
}

const SelectOrCustom = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) => {
  const [forceCustom, setForceCustom] = useState(
    Boolean(value) && !isPreset(value, options)
  );
  const usingCustom = forceCustom || (Boolean(value) && !isPreset(value, options));
  const selectValue = usingCustom ? CUSTOM_VALUE : value;

  return (
    <div>
      <label>{label}</label>
      <Select
        value={selectValue || undefined}
        onValueChange={(next) => {
          if (next === CUSTOM_VALUE) {
            setForceCustom(true);
            if (isPreset(value, options)) onChange("");
            return;
          }
          setForceCustom(false);
          onChange(next);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Seleccionar" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM_VALUE}>Otro</SelectItem>
        </SelectContent>
      </Select>
      {usingCustom && (
        <Input
          className="mt-2"
          value={isPreset(value, options) ? "" : value}
          placeholder="Escribir valor personalizado"
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
};

const GeneralSpecificationsDialog = ({
  open,
  onOpenChange,
  onSave,
  initialData,
}: Props) => {
  const [form, setForm] = useState(initialData);

  useEffect(() => {
    if (open) setForm(initialData);
  }, [open, initialData]);

  const handleChange = (field: keyof SpecificationsForm, value: string) => {
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
          <SelectOrCustom
            key={`precios-${open}`}
            label="Precios"
            value={form.precios}
            options={PRECIOS_OPTIONS}
            onChange={(v) => handleChange("precios", v)}
          />

          <SelectOrCustom
            key={`forma-pago-${open}`}
            label="Forma de pago"
            value={form.forma_pago}
            options={FORMA_PAGO_OPTIONS}
            onChange={(v) => handleChange("forma_pago", v)}
          />

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
