import { useEffect, useState } from "react";
import { Edit2, Trash2, Eye } from "lucide-react";
import Table from "@/components/common/Table";
import InputField from "@/components/atoms/InputField";
import Select from "@/components/atoms/Select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store";
import { convertStateTicket, stateEnum } from "@/utils/quotesConvert";
import { ServiceTicket } from "@/types/api";
import { EditTicketsService } from "../molecules/Modals/editTicket";
import { formatDate } from "@/utils/formatDate";
import ModalDelete from "../molecules/Modals/ModalDelete";
import { toast } from "@/hooks/use-toast";
import {
  deleteTicket,
  fetchTicketPriorities,
  fetchTickets,
  fetchTicketStates,
} from "@/store/ticketsSlice";
import { fetchUsers } from "@/store/usersSlice";
import { ViewTicketModal } from "../molecules/Modals/ViewTicketService";
import { useUserAdmins } from "@/hooks/useUsers";
import { fetchAllProducts } from "@/store/productSlice";

const TicketsABM = () => {
  // const [contacts] = useState<Contact[]>(mockContacts);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(
    null
  );
  const { user } = useAppSelector((state) => state.auth);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);

  // const { list: contacts, pagination } = useAppSelector(
  //   (state: RootState) => state.contacts
  // );
  const {
    list: tickets,
    pagination,
    states,
    priorities,
  } = useAppSelector((state: RootState) => state.ticketsService);
  const {
    data: users,
    isLoading,
    error,
  } = useUserAdmins({
    page: 1,
    page_size: 100,
  });
  //const { list: users } = useAppSelector((state: RootState) => state.users);

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchTickets({ page: 1, page_size: 10 }));
    dispatch(fetchTicketStates({}));
    dispatch(fetchTicketPriorities({}));
    dispatch(fetchUsers({}));
    dispatch(fetchAllProducts({}));
  }, [dispatch]);

  const [searchTerm, setSearchTerm] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const params: {
      page: number;
      page_size: number;
      search?: string;
      state?: string;
    } = {
      page: 1,
      page_size: 10,
    };
    if (statusFilter !== "all") {
      params.state = statusFilter;
    }

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    dispatch(fetchTickets(params));
  }, [dispatch, debouncedSearch, statusFilter]);

  const handleView = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setViewModalOpen(true);
  };

  const handleEdit = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setEditModalOpen(true);
  };
  const handleOpenDeleteModal = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setIsModalDeleteOpen(true);
  };
  const handleDelete = async () => {
    if (!selectedTicket) return;

    try {
      await dispatch(deleteTicket(selectedTicket.id)).unwrap();
      toast({ title: "Contacto eliminado exitosamente", variant: "default" });
      setIsModalDeleteOpen(false);
    } catch (error: unknown) {
      console.error("Error eliminando categoría:", error);
      if (error instanceof Error) {
        toast({
          title: "Error al eliminar el contacto",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error al eliminar el contacto",
          variant: "destructive",
        });
      }
    }
  };
  const filteredTickets = tickets.map((ticket) => ({
    ...ticket,
    company_name: ticket.contact?.company_name || "-",
    first_name: ticket.contact?.first_name || "-",
    last_name: ticket.contact?.last_name || "-",
    email: ticket.contact?.email || "-",
    phone: ticket.contact?.phone || "-",
  }));
  const columns = [
    { key: "ticket_number", label: "N° Ticket", sortable: true },
    {
      key: "company_name",
      label: "Empresa",
      sortable: true,
    },
    { key: "first_name", label: "Nombre", sortable: true },
    { key: "last_name", label: "Apellido", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "phone", label: "Teléfono", sortable: false },
    // { key: "country", label: "País", sortable: true },
    {
      key: "created_at",
      label: "Fecha",
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: "state",
      label: "Estado",
      sortable: true,
      render: (value) => convertStateTicket(value),
    },
  ];
  const actions = [
    { icon: <Eye size={16} />, onClick: handleView, label: "Ver" },
    {
      icon: <Edit2 size={16} />,
      onClick: handleEdit,
      label: "Editar",
      disabled: !user.is_superuser,
    },
    {
      icon: <Trash2 size={16} />,
      onClick: handleOpenDeleteModal,
      color: "red",
      label: "Eliminar",
      disabled: !user.is_superuser,
    },
  ];
  const handlePageChange = (newPage: number) => {
    const params: {
      page: number;
      page_size: number;
      search?: string;
      state?: string;
    } = {
      page: newPage,
      page_size: pagination.page_size,
    };

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }
    if (statusFilter !== "all") {
      params.state = null;
    }

    dispatch(fetchTickets(params));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <InputField
          placeholder="Buscar por empresa, nombre, apellido o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Select
          options={[
            { value: "all", label: "Todos los estados" },
            ...states.map((item) => ({
              value: item.id,
              label: convertStateTicket(item.name),
            })),
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
      </div>
      <Table
        columns={columns}
        data={filteredTickets}
        actions={actions}
        serverPagination={{
          currentPage: pagination.current_page,
          totalPages: pagination.total_pages,
          totalItems: pagination.count,
          pageSize: pagination.page_size,
          onPageChange: handlePageChange,
        }}
      />

      <ViewTicketModal
        ticket={selectedTicket}
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
      />

      <EditTicketsService
        ticket={selectedTicket}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        states={states}
        users={users?.results ?? []}
        priorities={priorities}
        // users={users} // Pasá la lista de usuarios si la tenés disponible
      />
      <ModalDelete
        isOpen={isModalDeleteOpen}
        onClose={() => {
          setIsModalDeleteOpen(false);
          setSelectedTicket(null);
        }}
        itemName={`${selectedTicket?.ticket_number || ""} de ${
          selectedTicket?.contact?.first_name || ""
        }  ${selectedTicket?.contact?.last_name || ""}`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default TicketsABM;
