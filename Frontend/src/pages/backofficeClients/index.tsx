import { ServiceTicketGrid } from "@/components/organisms/TicketsGrid";
import { ServiceTicket } from "@/types/api";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

// Datos de ejemplo para demostración
const sampleTickets: ServiceTicket[] = [
  {
    id: "1",
    ticket_number: "TKT-001",
    contact: "Juan Pérez",
    product: "PROD-001",
    product_name: "Sistema de Facturación",
    description:
      "El sistema no genera correctamente los reportes mensuales. Al intentar exportar a PDF, la aplicación se congela y no responde.",
    attachment: "https://example.com/screenshot.png",
    state: "in_progress",
    priority: "high",
    assigned_user: "María García",
    created_at: "2026-01-15T10:30:00Z",
    assigned_at: "2026-01-15T11:00:00Z",
    started_at: "2026-01-15T14:00:00Z",
    resolved_at: null,
    closed_at: null,
    updated_at: "2026-01-20T09:15:00Z",
    resolution_notes: null,
  },
  {
    id: "2",
    ticket_number: "TKT-002",
    contact: "Ana López",
    product: "PROD-002",
    product_name: "CRM Empresarial",
    description:
      "No puedo acceder al módulo de clientes. Aparece un error 403 al intentar cargar la página.",
    attachment: null,
    state: "open",
    priority: "critical",
    assigned_user: null,
    created_at: "2026-01-20T08:00:00Z",
    assigned_at: null,
    started_at: null,
    resolved_at: null,
    closed_at: null,
    updated_at: "2026-01-20T08:00:00Z",
    resolution_notes: null,
  },
  {
    id: "3",
    ticket_number: "TKT-003",
    contact: "Carlos Rodríguez",
    product: "PROD-001",
    product_name: "Sistema de Facturación",
    description:
      "Solicito agregar un nuevo campo personalizado para el número de orden de compra del cliente.",
    attachment: null,
    state: "resolved",
    priority: "low",
    assigned_user: "Pedro Sánchez",
    created_at: "2026-01-10T14:20:00Z",
    assigned_at: "2026-01-10T15:00:00Z",
    started_at: "2026-01-11T09:00:00Z",
    resolved_at: "2026-01-18T16:30:00Z",
    closed_at: null,
    updated_at: "2026-01-18T16:30:00Z",
    resolution_notes:
      "Se agregó el campo 'Número de OC' en la sección de datos del cliente. El campo es opcional y acepta hasta 50 caracteres alfanuméricos.",
  },
  {
    id: "4",
    ticket_number: "TKT-004",
    contact: "Laura Martínez",
    product: "PROD-003",
    product_name: "Portal de Empleados",
    description:
      "Las notificaciones por email no están llegando cuando se aprueba una solicitud de vacaciones.",
    attachment: "https://example.com/logs.txt",
    state: "closed",
    priority: "medium",
    assigned_user: "María García",
    created_at: "2026-01-05T11:45:00Z",
    assigned_at: "2026-01-05T12:00:00Z",
    started_at: "2026-01-06T08:30:00Z",
    resolved_at: "2026-01-08T15:00:00Z",
    closed_at: "2026-01-09T10:00:00Z",
    updated_at: "2026-01-09T10:00:00Z",
    resolution_notes:
      "El problema estaba en la configuración del servidor SMTP. Se corrigieron los parámetros de autenticación y se verificó el envío correcto de notificaciones.",
  },
  {
    id: "5",
    ticket_number: "TKT-005",
    contact: "Roberto Fernández",
    product: "PROD-002",
    product_name: "CRM Empresarial",
    description:
      "Necesito que se agregue la funcionalidad de exportar contactos a formato CSV con campos personalizados.",
    attachment: null,
    state: "in_progress",
    priority: "medium",
    assigned_user: "Pedro Sánchez",
    created_at: "2026-01-18T09:00:00Z",
    assigned_at: "2026-01-18T10:30:00Z",
    started_at: "2026-01-19T08:00:00Z",
    resolved_at: null,
    closed_at: null,
    updated_at: "2026-01-22T14:00:00Z",
    resolution_notes: null,
  },
  {
    id: "6",
    ticket_number: "TKT-006",
    contact: "Sofia Morales",
    product: "PROD-003",
    product_name: "Portal de Empleados",
    description:
      "El calendario de ausencias muestra fechas incorrectas para los feriados nacionales del 2026.",
    attachment: null,
    state: "open",
    priority: "low",
    assigned_user: null,
    created_at: "2026-01-22T16:20:00Z",
    assigned_at: null,
    started_at: null,
    resolved_at: null,
    closed_at: null,
    updated_at: "2026-01-22T16:20:00Z",
    resolution_notes: null,
  },
];

export default function PageTicket() {
  return (
    <main className="container mx-auto py-8 px-4">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al home
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Tickets de Servicio
        </h1>
        <p className="text-muted-foreground mt-2">
          Gestiona y visualiza todos los tickets de soporte técnico.
        </p>
      </div>
      <ServiceTicketGrid tickets={sampleTickets} />
    </main>
  );
}
