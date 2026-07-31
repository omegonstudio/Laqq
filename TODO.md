# TODO

Pendientes y notas surgidas durante el trabajo en `clean-users-and-permissions`.

---

## Front — UsersTable: tipo de usuario en el dropdown de creación

**Problema**
Al crear usuarios desde el front, el `<Select>` de "Tipo" aparecía vacío. Causa: en `Frontend/src/components/modules/UsersTable.tsx:117` el `useMemo` de `userTypeOptions` mapeaba `t.first_name` como label. El tipo `UserType` (en `Frontend/src/types/api.ts:458`) tiene `name` como campo legible, no `first_name` (que es del `User`).

**Fix aplicado**
```ts
const userTypeOptions = useMemo(() => {
  const items = userTypesData?.results ?? [];
  return [
    { value: "", label: "Sin tipo" },
    ...items.map((t) => ({ value: t.id, label: t.name })),
  ];
}, [userTypesData?.results]);
```

---

## Back — Endurecer `user_type` en creación de usuarios staff/superuser

**Contexto**
- `user_type` es nullable en el modelo (`Backend/users/models.py:31`).
- El serializer acepta crearlo `null` (`Backend/users/serializers.py:23-25`, `required=False`, `allow_null=True`).
- Los permisos de quotes/products/tickets se basan en `user.user_type_id in ['admin','back']` → un usuario sin tipo queda silenciosamente degradado a casi-readonly.

**Pendiente**
- Auditar usuarios existentes sin tipo en producción (query de solo lectura ya propuesta en chat).
- Asignarles tipo por SQL según flag (`is_superuser` → `admin`, `is_staff` → `back`, resto → `client`), previa revisión manual de quién debería ser `admin`.
- Considerar bloquear en backend la creación de usuarios con `is_staff=True` o `is_superuser=True` y `user_type_id=null`, para que no vuelva a pasar.

Query propuesta:
```sql
SELECT
  COUNT(*) FILTER (WHERE user_type_id IS NULL) AS sin_tipo_total,
  COUNT(*) FILTER (WHERE user_type_id IS NULL AND is_superuser) AS sin_tipo_superuser,
  COUNT(*) FILTER (WHERE user_type_id IS NULL AND is_staff)       AS sin_tipo_staff,
  COUNT(*) FILTER (WHERE user_type_id IS NULL AND NOT is_staff AND NOT is_superuser) AS sin_tipo_cliente_potencial
FROM users;
```

---

## Front — Topbar: usuario y tipo debajo del icono (RESUELTO)

**Petición**
Mostrar el username del usuario logueado junto al icono, y debajo el tipo legible (`Administrador` / `Backoffice` / `Cliente` / `Sin tipo`).

**Problema encontrado**
El `Topbar` (`Frontend/src/components/layout/Topbar.tsx`) leía de `useAuth` (`AuthContext`), que solo guarda `{ username, role: "administrator" }` hardcodeado y no expone `user_type_id` ni `is_superuser`. Por eso siempre mostraba "Sin tipo".

**Fix aplicado**
- El Topbar ahora lee `authUser` del slice de Redux (`state.auth.user`), que sí contiene `user_type_id` / `is_superuser` (hidratado por `loginThunk` en `Frontend/src/store/authSlice.ts:130-140`).
- El logout sigue usando `useAuth().logout()` para limpiar `localStorage`, más `dispatch(logoutAction())` para limpiar el slice.
- Mapeo local `USER_TYPE_LABEL` con `admin`/`back`/`client`. Si `is_superuser`, se fuerza "Administrador" (alineado con `usePermissions.ts`).

**Acción para que se vea**
Hacer logout y volver a entrar: el `user_type_id` solo se hidrata al ejecutar `loginThunk`. Si no se reloguea, queda con el estado anterior al fix.

---

## Front — Deuda técnica: dos sistemas de auth conviviendo

**Estado actual**
- `AuthContext` (`Frontend/src/components/auth/useAuth.tsx`): persiste `laqq_user` en `localStorage` con forma `{ username, role }`. No tiene `user_type_id` ni `is_superuser`/`is_staff`.
- `authSlice` (`Frontend/src/store/authSlice.ts`): persiste el slice de Redux con `{ username, is_superuser, is_staff, user_type_id }`. Es el que usa `usePermissions.ts`.

**Problema**
Componentes protegidos (`ProtectedRoute`), `LoginPage`, y otros consumidores leen de uno u otro de forma inconsistente. `usePermissions` solo lee del slice.

**Pendiente**
- Migrar todos los consumidores de `useAuth` al slice de Redux (o agregar `user_type_id` al `AuthContext`).
- Decidir una única fuente de verdad y eliminar el otro sistema.
- Mientras convivan, cualquier nuevo consumidor debe usar el slice (es el que tiene los datos reales que devuelve el backend).
