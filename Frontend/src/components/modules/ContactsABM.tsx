import { useEffect, useState } from "react";
import { Edit2, Trash2, Eye } from "lucide-react";
import Table from "@/components/common/Table";
import InputField from "@/components/atoms/InputField";
import Select from "@/components/atoms/Select";
import { Contact } from "@/utils/mockData/contacts";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store";
import { fetchContacts, fetchContactStates } from "@/store/contacts";

type stateEnum = "CLOSED" | "IN_PROGRESS" | "NEW" | "RESPONDED";

const convertState = (state: stateEnum): string => {
  switch (state) {
    case "CLOSED":
      return "cerrado";
    case "IN_PROGRESS":
      return "En progreso";
    case "NEW":
      return "Nuevo";
    case "RESPONDED":
      return "Respondido";
    default:
      return "Desconocido";
  }
};
const ContactsABM = () => {
  // const [contacts] = useState<Contact[]>(mockContacts);
  const [statusFilter, setStatusFilter] = useState("todos");
  const { list: contacts, pagination } = useAppSelector(
    (state: RootState) => state.contacts
  );

  const { states } = useAppSelector((state: RootState) => state.contacts);
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchContactStates({}));
  }, [dispatch]);
  const [searchTerm, setSearchTerm] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);
  console.log(pagination, "AAAAAAAAAAAA PAGINATION");
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
    if (statusFilter !== "todos") {
      params.state = statusFilter;
    }

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    dispatch(fetchContacts(params));
  }, [dispatch, debouncedSearch, statusFilter]);

  const handleView = (contact: Contact) => {
    console.log("Ver contacto:", contact);
  };

  const handleEdit = (contact: Contact) => {
    console.log("Editar contacto:", contact);
  };

  const handleDelete = (contact: Contact) => {
    console.log("Eliminar contacto:", contact);
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
    { key: "fecha", label: "Fecha", sortable: true },
    {
      key: "state",
      label: "Estado",
      sortable: true,
      render: (value: stateEnum) => convertState(value),
    },
  ];

  const actions = [
    { icon: <Eye size={16} />, onClick: handleView, label: "Ver" },
    { icon: <Edit2 size={16} />, onClick: handleEdit, label: "Editar" },
    {
      icon: <Trash2 size={16} />,
      onClick: handleDelete,
      color: "red",
      label: "Eliminar",
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
    if (statusFilter !== "todos") {
      params.state = statusFilter;
    }

    dispatch(fetchContacts(params));
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
              label: convertState(item.name as stateEnum),
            })),
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
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
    </div>
  );
};

export default ContactsABM;
