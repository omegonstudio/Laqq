import { useEffect, useState } from "react";
import { FileText, Search } from "lucide-react";
import Button from "../atoms/Button";
import TicketForm from "../molecules/TicketForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Modal from "../common/Modal";
import { useNavigate } from "react-router-dom";
import { Input } from "../ui/input";

const SupportCenter = () => {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [contact, setContac] = useState("");
  const navigate = useNavigate();

  const handleConsultarTickets = () => {
    if (contact.trim()) {
      navigate(`/tickets?email=${encodeURIComponent(contact)}`);
      setIsOpen(false);
    }
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Servicio Técnico</h1>
            <p className="text-xl text-muted-foreground">
              Soporte especializado para tus equipos de laboratorio
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-card border border-border rounded-2xl p-8 text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Abrir Nuevo Ticket</h3>
              <p className="text-muted-foreground mb-4">
                Reporta un problema o solicita asistencia técnica
              </p>
              <Button onClick={() => setIsTicketModalOpen(true)}>
                Crear Ticket
              </Button>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Consultar Estado</h3>
              <p className="text-muted-foreground mb-4">
                Revisa el estado de tus tickets existentes
              </p>
              <Button variant="outline" onClick={() => setIsOpen(true)}>
                Ver Mis Tickets
              </Button>
            </div>
          </div>

          <div className="bg-muted/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Guía Rápida</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                <strong className="text-foreground">1. Crea un ticket:</strong>{" "}
                Describe el problema con el mayor detalle posible e incluye el
                modelo del equipo.
              </p>
              <p>
                <strong className="text-foreground">
                  2. Adjunta evidencia:
                </strong>{" "}
                Si es posible, incluye fotos o documentos relevantes.
              </p>
              <p>
                <strong className="text-foreground">
                  3. Recibe respuesta:
                </strong>{" "}
                Nuestro equipo técnico revisará tu solicitud y te contactará en
                breve.
              </p>
              <p>
                <strong className="text-foreground">4. Seguimiento:</strong>{" "}
                Podrás consultar el estado de tu ticket en cualquier momento.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Ticket de Soporte</DialogTitle>
          </DialogHeader>
          <TicketForm onClose={() => setIsTicketModalOpen(false)} />
        </DialogContent>
      </Dialog>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Consultar Tickets"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Ingresá tu email para ver tus tickets de servicios
          </p>
          <Input
            type="email"
            placeholder="ejemplo@mail.com"
            value={contact}
            onChange={(e) => setContac(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleConsultarTickets}
              disabled={!contact.trim()}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default SupportCenter;
