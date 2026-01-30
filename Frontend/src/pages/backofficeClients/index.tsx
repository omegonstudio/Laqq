import { ServiceTicketGrid } from "@/components/organisms/TicketsGrid";
import { RootState } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTickets } from "@/store/ticketsSlice";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

export default function PageTicket() {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  const { list, loading } = useAppSelector(
    (state: RootState) => state.ticketsService
  );

  useEffect(() => {
    if (email) {
      dispatch(
        fetchTickets({
          email: email,
        })
      );
    }
  }, [dispatch, email]);

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
          {email
            ? `Mostrando tickets para: ${email}`
            : "Gestiona y visualiza todos los tickets de soporte técnico."}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">Cargando tickets...</div>
      ) : list.length > 0 ? (
        <ServiceTicketGrid tickets={list} />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No se encontraron tickets para este email.
        </div>
      )}
    </main>
  );
}
