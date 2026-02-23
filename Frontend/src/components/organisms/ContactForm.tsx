import { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import InputField from "../atoms/InputField";
import Button from "../atoms/Button";
import { toast } from "@/hooks/use-toast";
import { useAppDispatch } from "@/store/hooks";
import { createContact, createMessage } from "@/store/contacts";
import { MessageCreate } from "@/types/api";
const ContactForm = () => {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<MessageCreate>({
    company_name: "",
    first_name: "",
    last_name: "",
    country: "Argentina",
    message: "",
    state: "new",
    email: "",
  });
  const [messageError, setMessageError] = useState<string>("");

  const validateMessage = (message: string): boolean => {
    if (!message.trim()) {
      setMessageError("El mensaje es obligatorio");
      return false;
    }
    if (message.trim().length < 10) {
      setMessageError("El mensaje debe tener al menos 10 caracteres");
      return false;
    }
    setMessageError("");
    return true;
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setFormData({ ...formData, message: newMessage });
    validateMessage(newMessage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar el mensaje antes de enviar
    if (!validateMessage(formData.message)) {
      return;
    }

    try {
      await dispatch(createMessage(formData)).unwrap();
      toast({
        title: "Mensaje Enviado",
        description: "Te responderemos a la brevedad posible.",
        variant: "default",
      });
      // Limpiar el formulario después del éxito
      setFormData({
        company_name: "",
        first_name: "",
        last_name: "",
        country: "Argentina",
        message: "",
        state: "new",
        email: "",
      });
      setMessageError(""); // Limpiar el error
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      toast({
        title: "Error al enviar mensaje",
        description: "Por favor, intenta de nuevo más tarde.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Contacto</h1>
            <p className="text-xl text-muted-foreground">
              Estamos aquí para ayudarte
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">
                Información de Contacto
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Email</h3>
                    <p className="text-muted-foreground">contacto@laqq.com</p>
                    <p className="text-muted-foreground">ventas@laqq.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Teléfono</h3>
                    <p className="text-muted-foreground">+54 (11) 5277-7200</p>
                    {/* <p className="text-muted-foreground">+52 (55) 8765 4321</p> */}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Dirección</h3>
                    <p className="text-muted-foreground">
                      Saavedra 247
                      <br />
                      C1083ACE
                      <br />
                      Buenos Aires | Argentina
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-muted/30 rounded-2xl">
                <h3 className="font-bold mb-2">Horario de Atención</h3>
                <p className="text-muted-foreground">
                  Lunes a Viernes: 9:00 - 18:00
                  <br />
                  Sábados: 9:00 - 14:00
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">Envíanos un Mensaje</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Nombre"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    required
                  />
                  <InputField
                    label="Apellido"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Empresa"
                    value={formData.company_name}
                    onChange={(e) =>
                      setFormData({ ...formData, company_name: e.target.value })
                    }
                  />
                  <InputField
                    label="País"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    required
                  />
                </div>
                <InputField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  // required
                />

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mensaje <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={handleMessageChange}
                    className={`w-full px-4 py-2.5 rounded-xl border ${
                      messageError ? "border-red-500" : "border-input"
                    } bg-background min-h-[150px] focus:outline-none focus:ring-2 focus:ring-primary`}
                    required
                  />
                  {messageError && (
                    <p className="text-sm text-red-500 mt-1">{messageError}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.message.length}/10 caracteres mínimo
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={!!messageError || !formData.message.trim()}
                >
                  Enviar Mensaje
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
