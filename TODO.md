# TODO

Pendientes y notas surgidas durante el trabajo en `clean-users-and-permissions`.

---

## Back — Restricciones del usuario `back` (backoffice) — APLICADO

**Cambios aplicados en este commit (no commiteado aún):**

### Permisos (matriz final)

| Módulo | Método | admin | back | client | anónimo |
|---|---|:-:|:-:|:-:|:-:|
| `BrandViewSet` | GET | ✓ | ✓ | ✓ | ✓ |
| | POST / PUT / PATCH / DELETE | ✓ | ✗ | ✗ | ✗ |
| `CategoryViewSet` | GET | ✓ | ✓ | ✓ | ✓ |
| | POST / PUT / PATCH / DELETE | ✓ | ✗ | ✗ | ✗ |
| `ServiceTicketViewSet` | GET | ✓ | ✓ | ✓ (propios) | ✓ (con ?email=) |
| | POST | ✓ | ✓ | ✓ | ✓ |
| | PUT / PATCH / DELETE | ✓ | ✗ | ✗ | ✗ |
| `QuoteViewSet` | POST público | ✓ | ✓ | ✓ | ✓ |
| | GET / PUT / PATCH / DELETE | ✓ | ✓ | ✗ | ✗ |
| | `attach_file` | ✓ | ✓ | ✓ (propios) | ✗ |
| | `assign / start / resolve / close` | ✓ | ✗ | ✗ | ✗ |
| | `statistics` | ✓ | ✓ | ✗ | ✗ |
| `TicketStateViewSet` y `TicketPriorityViewSet` | GET | ✓ | ✓ | ✓ | ✓ |
| | POST / PUT / PATCH / DELETE | ✓ | ✗ | ✗ | ✗ |
| `AttachmentViewSet` (galería) | GET | ✓ | ✓ | ✓ | ✓ |
| | POST / PUT / PATCH / DELETE | ✓ | ✗ | ✗ | ✗ |

`ProductViewSet.upload_attachment*` y `delete_attachment` NO se tocan (siguen siendo `IsAuthenticatedOrReadOnly`).

### Archivos modificados

- `Backend/products/permissions.py` — sin permisos nuevos; `IsReadOnlyOrAdmin` ya cumplía para marcas.
- `Backend/products/views.py` — `BrandViewSet` usa `[IsReadOnlyOrAdmin]` (antes `[AllowAny]`).
- `Backend/tickets/permissions.py` — `CanCreateTicketOrStaff` ahora rechaza PUT/PATCH/DELETE del `back`; agregada clase `IsAdminOnly`.
- `Backend/tickets/views.py` — 4 acciones (assign/start/resolve/close) usan `[IsAuthenticated, IsAdminOnly]`; `TicketStateViewSet` y `TicketPriorityViewSet` usan `[IsAuthenticated, IsAdminOnly]` para escritura.
- `Backend/attachments/permissions.py` — nuevo archivo con `IsAdminOrAttachmentReadOnly`.
- `Backend/attachments/views.py` — `AttachmentViewSet` usa `[IsAdminOrAttachmentReadOnly]` (antes `[AllowAny]`).
- `Frontend/src/hooks/usePermissions.ts` — agregados `useCanManageBrands`, `useCanManageAttachments`, `useCanRunTicketActions`. `useCanManageQuotes` vuelve a "admin o back" (era la función principal del backoffice). **Cambio de semántica**: `useCanManageTickets` pasó de "admin+back" a "solo admin".
- `Frontend/src/components/modules/BrandsABM.tsx` — el back solo ve la tabla y la búsqueda; botones editar/eliminar y "Nueva marca" solo visibles para admin. Pasa `canManageAttachments` al modal.
- `Frontend/src/components/modules/TicketsABM.tsx` — usa `useCanManageTickets` (ya solo admin); pasa `canRunTicketActions` al modal de edición.
- `Frontend/src/components/molecules/Modals/editTicket.tsx` — prop `canRunTicketActions` deshabilita "Cerrar ticket" y "Guardar cambios" para `back`.
- `Frontend/src/components/molecules/Modals/editBrand.tsx` — prop `canManageAttachments` deshabilita la subida de logo; el `back` puede seguir editando nombre/descripción.
- `Frontend/src/pages/LibreriaPage.tsx` — botón "Cargar archivos" y "Eliminar" por tarjeta solo visibles para admin.

### Pendiente (verificación en local)

- Correr `python manage.py test products.tests tickets.tests attachments.tests quotes.tests` (los archivos de tests están fuera del alcance del cambio; los existentes deberían pasar con `admin`). **No se pudo correr acá** porque el entorno no tiene el venv de Django instalado (el check rápido de sintaxis sí pasó en los 6 archivos modificados).
- Considerar agregar nuevos tests:
  - `BackOfficeRestrictionsTestCase` en `Backend/tickets/tests.py`: `back` recibe 403 en PUT/PATCH/DELETE y en `assign/start/resolve/close`; `back` SÍ puede GET y `attach_file`.
  - `BackOfficeRestrictionsTestCase` en `Backend/attachments/tests.py`: solo admin puede POST/PUT/PATCH/DELETE; GET público.
  - `BackOfficeRestrictionsTestCase` en `Backend/products/tests.py`: `back` puede POST/PUT/PATCH en marcas pero NO DELETE; `back` recibe 403 en categorías.

### Bug preexistente (no introducido por este cambio)

`Backend/products/tests.py:346` (`BulkUploadBackofficeTestCase`) crea un `UserType` con `id='BACKOFFICE'` (mayúsculas). Las permissions de este cambio usan `id='back'`. Si ese test ya fallaba antes, debería corregirse a `id='back'`. **Verificar antes de tocar**: si el test está fallando, arreglarlo; si pasa por casualidad, dejar y anotar.

### Cambio de semántica para tener en cuenta

`useCanManageTickets` pasó de "admin+back" a "solo admin". Solo se consume en `TicketsABM.tsx`. Verificado por grep que no haya otros consumidores.

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

## Back — Quotes: backoffice perdió PATCH/PUT/DELETE en el commit `clean-users-and-permissions` (RESUELTO)

**Problema**
Después del commit `bb5a5dc`, el usuario `back` no podía editar cotizaciones en el backoffice (el flujo de "Guardar y Enviar" se cortaba: `updateQuote` (PUT/PATCH) y `deleteQuoteItem`/`updateQuoteItem` retornaban 403).

**Causa**
En `Backend/quotes/permissions.py`, el commit cambió `user.user_type_id in ['ADMIN', 'admin']` por `user.user_type_id == 'admin'`, dejando a `back` sin permisos de escritura tanto en `QuoteViewSet` como en `QuoteItemViewSet`.

**Fix aplicado**
- `CanCreateOrAdmin.has_permission` (QuoteViewSet): PUT/PATCH/DELETE → `['admin', 'back']` (en vez de `=='admin'`).
- `AllowPublicQuoteItems.has_permission` (QuoteItemViewSet): misma corrección.
- Docstrings de ambas clases actualizados para reflejar el cambio.

`send-updated` NO estaba afectado (siempre usó `IsAuthenticated`).

**Pendiente**
- Verificar que `Backend/quotes/tests.py` use `user_type` con `id in {'admin', 'back'}` para los tests de PATCH/DELETE.

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
