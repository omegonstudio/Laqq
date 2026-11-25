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
import {
  CLAUSULA_PAGO_OPTIONS,
  FORMA_PAGO_OPTIONS,
  GARANTIA_OPTIONS,
  ORDEN_COMPRA_OPTIONS,
  PRECIOS_OPTIONS,
  VALIDEZ_OFERTA_OPTIONS,
} from "@/utils/quoteConditionsDefaults";

const CUSTOM_VALUE = "__custom__";

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
  multiline = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  multiline?: boolean;
}) => {
  const [forceCustom, setForceCustom] = useState(
    Boolean(value) && !isPreset(value, options)
  );
  const usingCustom =
    forceCustom || (Boolean(value) && !isPreset(value, options));
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
              <span className="whitespace-pre-wrap text-left">
                {option.label}
              </span>
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM_VALUE}>Otro</SelectItem>
        </SelectContent>
      </Select>
      {usingCustom &&
        (multiline ? (
          <Textarea
            className="mt-2 min-h-[120px]"
            value={isPreset(value, options) ? "" : value}
            placeholder="Escribir valor personalizado"
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <Input
            className="mt-2"
            value={isPreset(value, options) ? "" : value}
            placeholder="Escribir valor personalizado"
            onChange={(e) => onChange(e.target.value)}
          />
        ))}
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
            label="Precio"
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

          <SelectOrCustom
            key={`clausula-pago-${open}`}
            label="Cláusula de pago"
            value={form.clausula_pago}
            options={CLAUSULA_PAGO_OPTIONS}
            multiline
            onChange={(v) => handleChange("clausula_pago", v)}
          />

          <SelectOrCustom
            key={`validez-oferta-${open}`}
            label="Validez de oferta"
            value={form.validez_oferta}
            options={VALIDEZ_OFERTA_OPTIONS}
            onChange={(v) => handleChange("validez_oferta", v)}
          />

          <SelectOrCustom
            key={`orden-compra-${open}`}
            label="Orden de compra"
            value={form.orden_compra}
            options={ORDEN_COMPRA_OPTIONS}
            onChange={(v) => handleChange("orden_compra", v)}
          />

          <div>
            <label>Observaciones</label>
            <Textarea
              value={form.observaciones}
              onChange={(e) => handleChange("observaciones", e.target.value)}
            />
          </div>

          <div className="border-t pt-4 mt-2 space-y-2">
            <SelectOrCustom
              key={`garantia-${open}`}
              label="Garantía"
              value={form.garantia}
              options={GARANTIA_OPTIONS}
              multiline
              onChange={(v) => handleChange("garantia", v)}
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
