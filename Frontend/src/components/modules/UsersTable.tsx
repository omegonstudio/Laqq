import { useEffect, useMemo, useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import Table from "@/components/common/Table";
import InputField from "@/components/atoms/InputField";
import Button from "@/components/atoms/Button";
import Select from "@/components/atoms/Select";
import Modal from "@/components/common/Modal";
import ModalDelete from "@/components/molecules/Modals/ModalDelete";
import {
  useCreateUser,
  useDeleteUser,
  usePatchUser,
  useUserAdmins,
  useUsersList,
  useUserStates,
  useUserTypes,
} from "@/hooks/useUsers";
import type { NormalizedApiError } from "@/lib/api/client";
import type { UserCreate, UserData } from "@/types/api";
import { toast } from "@/hooks/use-toast";
import { useAppSelector } from "@/store/hooks";
import { RootState } from "@/store";

type UserRow = {
  id: string;
  nombre: string;
  apellido: string;
  nick: string;
  email: string;
  tipo: string;
  estado: string;
  raw: UserData;
};

type UserFormState = {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  user_type_id: string; // "" => null
  state_id: string; // "" => null
  is_active: "true" | "false";
};

const PAGE_SIZE = 200;

const UsersTable = () => {
  const {
    data: usersData,
    isLoading,
    error,
  } = useUserAdmins({
    page: 1,
    page_size: PAGE_SIZE,
  });
  const { data: userTypesData } = useUserTypes();
  const { data: userStatesData } = useUserStates();
  const createUserMutation = useCreateUser();
  const patchUserMutation = usePatchUser();
  const deleteUserMutation = useDeleteUser();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [upsertMode, setUpsertMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [form, setForm] = useState<UserFormState>({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    user_type_id: "",
    state_id: "",
    is_active: "true",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (error?.message) {
      toast({ title: error.message, variant: "destructive" });
    }
  }, [error?.message]);

  const tableRows: UserRow[] = useMemo(() => {
    const results = usersData?.results ?? [];
    return results.map((u) => ({
      id: u.id,
      nombre: u.first_name || "",
      apellido: u.last_name || "",
      nick: u.username || "",
      email: u.email || "",
      tipo: u.user_type?.name ?? "-",
      estado: u.state?.name ?? (u.is_active ? "Activo" : "Inactivo"),
      raw: u,
    }));
  }, [usersData?.results]);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return tableRows;
    return tableRows.filter(
      (user) =>
        user.nombre.toLowerCase().includes(q) ||
        user.apellido.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q)
    );
  }, [searchTerm, tableRows]);
  const userTypeOptions = useMemo(() => {
    const items = userTypesData?.results ?? [];
    return [
      { value: "", label: "Sin tipo" },
      ...items.map((t) => ({ value: t.id, label: t.first_name })),
    ];
  }, [userTypesData?.results]);

  const userStateOptions = useMemo(() => {
    const items = userStatesData?.results ?? [];
    return [
      { value: "", label: "Sin estado" },
      ...items.map((s) => ({ value: s.id, label: s.name })),
    ];
  }, [userStatesData?.results]);

  const normalizeMutationError = (err: unknown) => {
    const e = err as NormalizedApiError | undefined;
    const errors = e?.errors ?? {};
    const next: Record<string, string> = {};
    Object.entries(errors).forEach(([key, value]) => {
      if (!value?.length) return;
      next[key] = value[0];
    });
    setFormErrors(next);
    toast({
      title: e?.message || "Error en la operación",
      variant: "destructive",
    });
  };

  const openCreateModal = () => {
    setUpsertMode("create");
    setSelectedUser(null);
    setFormErrors({});
    setForm({
      first_name: "",
      last_name: "",
      username: "",
      email: "",
      password: "",
      user_type_id: "",
      state_id: "",
      is_active: "true",
    });
    setIsUpsertOpen(true);
  };

  const openEditModal = (user: UserData) => {
    setUpsertMode("edit");
    setSelectedUser(user);
    setFormErrors({});
    setForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      username: user.username || "",
      email: user.email || "",
      password: "",
      user_type_id: user.user_type?.id ?? "",
      state_id: user.state?.id ?? "",
      is_active: user.is_active ? "true" : "false",
    });
    setIsUpsertOpen(true);
  };

  const openDeleteModal = (user: UserData) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleSubmitUpsert = async () => {
    setFormErrors({});

    try {
      if (upsertMode === "create") {
        const createPayload: UserCreate = {
          email: form.email.trim(),
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          username: form.username.trim(),
          password: form.password,
          user_type_id: form.user_type_id || null,
          state_id: form.state_id || null,
          is_active: form.is_active === "true",
        };

        await createUserMutation.mutateAsync(createPayload);

        toast({ title: "Usuario creado exitosamente" });
        setIsUpsertOpen(false);
        return;
      }

      if (!selectedUser?.id) return;

      const patchPayload: Partial<UserCreate> = {
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim(),
        user_type_id: form.user_type_id || null,
        state_id: form.state_id || null,
        is_active: form.is_active === "true",
      };

      if (form.password.trim()) {
        patchPayload.password = form.password;
      }

      await patchUserMutation.mutateAsync({
        id: selectedUser.id,
        payload: patchPayload,
      });

      toast({ title: "Usuario actualizado exitosamente" });
      setIsUpsertOpen(false);
    } catch (err) {
      normalizeMutationError(err);
    }
  };

  const handleEdit = (row: UserRow) => openEditModal(row.raw);
  const handleDelete = (row: UserRow) => openDeleteModal(row.raw);

  const handleConfirmDelete = () => {
    if (!selectedUser?.id) return;

    void deleteUserMutation
      .mutateAsync(selectedUser.id)
      .then(() => {
        toast({ title: "Usuario eliminado exitosamente" });
      })
      .catch((err) => {
        const e = err as NormalizedApiError | undefined;
        toast({
          title: e?.message || "Error al eliminar el usuario",
          variant: "destructive",
        });
      });
  };

  const columns = [
    { key: "nombre", label: "Nombre", sortable: true },
    { key: "apellido", label: "Apellido", sortable: true },
    { key: "nick", label: "Nick", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "tipo", label: "Tipo", sortable: true },
    { key: "estado", label: "Estado", sortable: true },
  ];

  const actions = [
    {
      icon: <Edit2 size={16} />,
      onClick: handleEdit,
      label: "Editar",
      disabled: !user?.is_superuser,
    },
    {
      icon: <Trash2 size={16} />,
      onClick: handleDelete,
      color: "red",
      label: "Eliminar",
      disabled: !user?.is_superuser, // Solo superusuarios pueden eliminar
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-1">
        <InputField
          placeholder="Buscar por nombre, apellido o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Button
          variant="primary"
          className="whitespace-nowrap w-fit"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Nuevo Usuario
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">
          Cargando usuarios...
        </div>
      ) : (
        <Table columns={columns} data={filteredUsers} actions={actions} />
      )}

      <Modal
        isOpen={isUpsertOpen}
        onClose={() => setIsUpsertOpen(false)}
        title={upsertMode === "create" ? "Nuevo Usuario" : "Editar Usuario"}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Nombre"
              value={form.first_name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, first_name: e.target.value }))
              }
              error={formErrors.first_name}
            />
            <InputField
              label="Apellido"
              value={form.last_name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, last_name: e.target.value }))
              }
              error={formErrors.last_name}
            />
            <InputField
              label="Nick"
              value={form.username}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, username: e.target.value }))
              }
              error={formErrors.username}
            />
            <InputField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              error={formErrors.email}
            />

            <Select
              label="Tipo"
              value={form.user_type_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, user_type_id: e.target.value }))
              }
              options={userTypeOptions}
              error={formErrors.user_type_id}
            />

            <Select
              label="Estado (workflow)"
              value={form.state_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, state_id: e.target.value }))
              }
              options={userStateOptions}
              error={formErrors.state_id}
            />

            <Select
              label="Activo"
              value={form.is_active}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  is_active: e.target.value as "true" | "false",
                }))
              }
              options={[
                { value: "true", label: "Activo" },
                { value: "false", label: "Inactivo" },
              ]}
              error={formErrors.is_active}
            />

            <InputField
              label={
                upsertMode === "create" ? "Contraseña" : "Contraseña (opcional)"
              }
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
              error={formErrors.password}
            />
          </div>

          {formErrors.non_field_errors && (
            <p className="text-sm text-destructive">
              {formErrors.non_field_errors}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsUpsertOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitUpsert}
              disabled={
                createUserMutation.isPending ||
                patchUserMutation.isPending ||
                deleteUserMutation.isPending
              }
            >
              {upsertMode === "create" ? "Crear" : "Guardar"}
            </Button>
          </div>
        </div>
      </Modal>

      <ModalDelete
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedUser(null);
        }}
        itemName={
          selectedUser
            ? `${selectedUser.first_name || ""} ${
                selectedUser.last_name || ""
              }`.trim() || selectedUser.username
            : ""
        }
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default UsersTable;

/**
 * ## TODO – Pendientes de integración
 * - [ ] Paginación server-side (si el backend lo soporta)
 * - [ ] Filtros avanzados (tipo, estado)
 * - [ ] Ordenamiento desde backend
 * - [ ] Manejo de permisos/roles en acciones (si aplica)
 * - [ ] Tests (unitarios o de integración)
 */
