import { useEffect, useState } from "react";
import { Edit2, Trash2, Eye, Plus } from "lucide-react";
import Table from "@/components/common/Table";
import InputField from "@/components/atoms/InputField";
import Select from "@/components/atoms/Select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store";
import {
  deleteContact,
  fetchContacts,
  fetchContactStates,
} from "@/store/contacts";
import { convertStateContact, stateEnum } from "@/utils/quotesConvert";
import { Contact } from "@/types/api";
import { ViewContactModal } from "../molecules/Modals/viewContact";
import { EditContactModal } from "../molecules/Modals/editContact";
import { formatDate } from "@/utils/formatDate";
import { fetchUsers } from "@/store/usersSlice";
import ModalDelete from "../molecules/Modals/ModalDelete";
import { toast } from "@/hooks/use-toast";
import Button from "../atoms/Button";
import { useCanManageContacts, useCanCreateContacts } from "@/hooks/usePermissions";

const contactInitialData: Contact = {
  id: "",
  company_name: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  country: "",
  state: "NEW",
  assigned_user: "",
  message: "",
};

const ContactsABM = () => {
  // const [contacts] = useState<Contact[]>(mockContacts);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(
    contactInitialData
  );
  const canManageContacts = useCanManageContacts();
  const canCreateContacts = useCanCreateContacts();
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const { list: contacts, pagination } = useAppSelector(
    (state: RootState) => state.contacts
  );
  const { list: users } = useAppSelector((state: RootState) => state.users);

  const { states } = useAppSelector((state: RootState) => state.contacts);
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchContactStates({}));
    dispatch(fetchUsers({ page: 1, page_size: 1000 }));
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

    dispatch(fetchContacts(params));
  }, [dispatch, debouncedSearch, statusFilter]);

  const handleView = (contact: Contact) => {
    setSelectedContact(contact);
    setViewModalOpen(true);
  };
  const handleCreate = () => {
    setIsNew(true);
    setSelectedContact(contactInitialData);
    setEditModalOpen(true);
  };
  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setEditModalOpen(true);
  };
  const handleOpenDeleteModal = (product: Contact) => {
    setSelectedContact(product);
    setIsModalDeleteOpen(true);
  };
  const handleDelete = async () => {
    if (!selectedContact) return;

    try {
      await dispatch(deleteContact(selectedContact.id)).unwrap();
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

  const columns = [
    {
      key: "company_name",
      label: "Empresa",
      sortable: true,
    },
    { key: "first_name", label: "Nombre", sortable: true },
    { key: "last_name", label: "Apellido", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "phone", label: "Teléfono", sortable: false },
    { key: "country", label: "País", sortable: true },
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
      render: (value: stateEnum) => convertStateContact(value),
    },
  ];

  const actions = [
    { icon: <Eye size={16} />, onClick: handleView, label: "Ver" },
    { icon: <Edit2 size={16} />, onClick: handleEdit, label: "Editar" },
    {
      icon: <Trash2 size={16} />,
      onClick: handleOpenDeleteModal,
      color: "red",
      label: "Eliminar",
      disabled: !canManageContacts, // Solo admin puede eliminar
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

    dispatch(fetchContacts(params));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-4 flex-1">
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
                label: item.name,
              })),
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="max-w-xs"
          />
        </div>
        {canCreateContacts && (
          <Button
            className="flex items-center gap-2"
            variant="primary"
            onClick={handleCreate}
          >
            <Plus size={18} />
            Crear contacto
          </Button>
        )}
      </div>
      <Table
        columns={columns}
        data={contacts}
        actions={actions}
        serverPagination={{
          currentPage: pagination.current_page,
          totalPages: pagination.total_pages,
          totalItems: pagination.count,
          pageSize: pagination.page_size,
          onPageChange: handlePageChange,
        }}
      />

      <ViewContactModal
        contact={selectedContact}
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        users={users}
      />

      <EditContactModal
        isNew={isNew}
        contact={selectedContact}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        states={states}
        users={users}
        // users={users} // Pasá la lista de usuarios si la tenés disponible
      />
      <ModalDelete
        isOpen={isModalDeleteOpen}
        onClose={() => {
          setIsModalDeleteOpen(false);
          setSelectedContact(null);
        }}
        itemName={`${selectedContact?.first_name || ""} ${
          selectedContact?.last_name || ""
        } Empresa: ${selectedContact?.company_name || ""}`}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ContactsABM;
