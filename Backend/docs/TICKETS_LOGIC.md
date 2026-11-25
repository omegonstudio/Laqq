# Lógica de Negocio - Sistema de Tickets de Servicio Técnico

**Versión:** 2.0 (Ticket 9)  
**Rama de referencia:** `feature/T9-servicio-tecnico`

---

## Resumen

Gestión de tickets de servicio técnico con:

- Estados operativos: `received` → `diagnosed` → `quoted` → `closed`
- Estados legacy conservados para consulta histórica
- Asignación de técnicos (sin cambio de estado) + correo al técnico
- Notas internas privadas (`internal_notes`)
- Exportación Excel para roles autorizados
- Prioridad/urgencia retirada de la UI operativa (catálogo histórico conservado)
- Serie obligatoria en creación; empresa opcional vía `Contact.company_name`
- Correos de creación T10/T12 (soporte + cliente) independientes del assign

---

## Estados

### Operativos (workflow actual)

| ID | Nombre | Final |
|----|--------|-------|
| `received` | Recibido | No |
| `diagnosed` | Diagnosticado | No |
| `quoted` | Presupuestado | No |
| `closed` | Cerrado | Sí |

Flujo normal: `received → diagnosed → quoted → closed`  
Cierre temprano permitido desde cualquier operativo no final.  
Sin retrocesos en acciones normales.

### Legacy (solo consulta / classify)

`new`, `open`, `in_progress`, `waiting_parts`, `resolved`

No avanzan automáticamente por el workflow nuevo.

---

## Acciones de API

| Acción | Método | Transición | Permiso |
|--------|--------|------------|---------|
| `assign` | POST | no cambia estado | `TICKET_MANAGE` |
| `diagnose` / `start` | POST | received → diagnosed (+ `diagnosed_at`) | `TICKET_MANAGE` |
| `quote` / `resolve` | POST | diagnosed → quoted (+ `quoted_at`) | `TICKET_MANAGE` |
| `close` | POST | received\|diagnosed\|quoted → closed | `TICKET_MANAGE` |
| `reopen` | POST | closed → received (conserva fechas) | admin / superuser |
| `classify` | POST | legacy → operativo (sin inventar fechas) | admin / superuser |
| `export` | GET | Excel | `TICKET_MANAGE` |
| `from-package` | POST | crea en `received` | público |

`TICKET_MANAGE` = `admin` + `servicio_tecnico` (+ superuser).

PUT/PATCH **no** modifican `state` ni `priority`. Los cambios de estado solo vía acciones.

---

## Permisos (matriz)

| Rol | Consultar | Crear público | Editar | Workflow | Reopen/Classify | Notas internas | Export |
|-----|-----------|---------------|--------|----------|-----------------|----------------|--------|
| anónimo | propios (`?email=`) | sí | no | no | no | no | no |
| client | propios | sí | no | no | no | no | no |
| back / back_full | todos | — | no | no | no | no | no |
| servicio_tecnico | todos | — | sí | sí | no | sí | sí |
| admin / superuser | todos | — | sí | sí | sí | sí | sí |

`UserType.permissions` es descriptivo; la API usa `tickets/permissions.py`.

---

## Campos relevantes

- `numero_de_serie`: obligatorio en creación; históricos vacíos siguen OK
- Empresa: `Contact.company_name` (opcional en formulario; contacto existente no se muta)
- `internal_notes`: solo admin / servicio_tecnico; no correos cliente; no API pública
- `resolution_notes`: pueden llegar al cliente
- `diagnosed_at` / `quoted_at`: set en diagnose/quote; classify no inventa fechas
- `priority`: conservado en DB; no expuesto ni editable en flujo ST

---

## Exportación

`GET /tickets/export/` → Excel (`tickets.xlsx`), patrón productos.  
Incluye `internal_notes` solo si el usuario tiene `TICKET_MANAGE`.

---

## Migraciones T9

- `0005_t9_c1_operational_states`: catálogo operativo, remap `new→received` auditado, `diagnosed_at`/`quoted_at`
- `0006_serviceticket_internal_notes`: campo `internal_notes`

**DEV:** si `0005` ya estaba aplicada con una versión anterior, alinear requiere procedimiento autorizado (no reaplicar a ciegas).

---

## T10 / T12

Creación: exactamente un mail a soporte + uno al cliente.  
Supresión de mails de Contact en `from-package` vía ContextVar.  
No modificar esa lógica al tocar assign/workflow.
