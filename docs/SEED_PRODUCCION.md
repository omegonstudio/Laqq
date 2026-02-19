# Seed de Datos de Referencia — Producción

Documento que registra qué datos se inyectaron en producción, cuáles se omitieron y el SQL utilizado.

---

## Qué se inyectó

Datos de referencia que el sistema necesita para funcionar. Sus IDs están hardcodeados en el código (serializers, models, views).

| Tabla | Registros | IDs |
|---|---|---|
| `ticket_states` | 6 | `new`, `open`, `in_progress`, `waiting_parts`, `resolved`, `closed` |
| `ticket_priorities` | 4 | `low`, `medium`, `high`, `urgent` |
| `contacts_contactstate` | 4 | `new`, `in_progress`, `responded`, `closed` |
| `quotes_quotetype` | 2 | `standard`, `express` |
| `quotes_quotestate` | 5 | `pending`, `sent`, `confirmed`, `rejected`, `expired` |
| `users_userstate` | 3 | `active`, `inactive`, `suspended` |
| `notes_notetype` | 5 | `product`, `company`, `event`, `promotion`, `training` |
| `notes_notestate` | 3 | `draft`, `published`, `archived` |

---

## Qué se omitió y por qué

| Tabla | Motivo |
|---|---|
| `users_usertype` | Ya existía en producción (`admin`, `back`, `client`) |
| Usuario admin inicial | Ya estaba creado manualmente en producción |
| Productos / Categorías | Son datos de negocio, no datos de referencia del sistema |

---

## SQL utilizado

El script es idempotente: usa `ON CONFLICT (id) DO NOTHING`, por lo que es seguro ejecutarlo múltiples veces sin generar errores ni duplicados.

```sql
BEGIN;

INSERT INTO ticket_states (id, name, color, description, is_final, created_at)
VALUES
    ('new',           'Nuevo',                '#3498db', 'Ticket recién creado, sin asignar',              FALSE, NOW()),
    ('open',          'Abierto',              '#f39c12', 'Ticket asignado a un técnico',                   FALSE, NOW()),
    ('in_progress',   'En progreso',          '#9b59b6', 'Técnico trabajando en el ticket',                FALSE, NOW()),
    ('waiting_parts', 'Esperando repuestos',  '#e74c3c', 'En espera de repuestos o materiales',            FALSE, NOW()),
    ('resolved',      'Resuelto',             '#1abc9c', 'Problema resuelto, esperando confirmación',      FALSE, NOW()),
    ('closed',        'Cerrado',              '#27ae60', 'Ticket cerrado y finalizado',                    TRUE,  NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO ticket_priorities (id, name, level, color, description, created_at)
VALUES
    ('low',    'Baja',    1, '#95a5a6', 'Problema menor sin urgencia',                          NOW()),
    ('medium', 'Media',   2, '#3498db', 'Problema estándar con prioridad normal',               NOW()),
    ('high',   'Alta',    3, '#f39c12', 'Problema importante que requiere atención pronta',     NOW()),
    ('urgent', 'Urgente', 4, '#e74c3c', 'Problema crítico que requiere atención inmediata',     NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO contacts_contactstate (id, name, color, description, created_at)
VALUES
    ('new',         'Nuevo',       '#3498db', NULL, NOW()),
    ('in_progress', 'En progreso', '#f39c12', NULL, NOW()),
    ('responded',   'Respondido',  '#9b59b6', NULL, NOW()),
    ('closed',      'Cerrado',     '#27ae60', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO quotes_quotetype (id, name, description, created_at)
VALUES
    ('standard', 'Estándar', 'Cotización estándar',          NOW()),
    ('express',  'Express',  'Cotización con entrega rápida', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO quotes_quotestate (id, name, color, description, created_at)
VALUES
    ('pending',   'Pendiente',  '#f39c12', 'Cotización recibida, pendiente de revisión', NOW()),
    ('sent',      'Enviada',    '#3498db', 'Cotización enviada al cliente',              NOW()),
    ('confirmed', 'Confirmada', '#27ae60', 'Cotización aceptada por el cliente',         NOW()),
    ('rejected',  'Rechazada',  '#e74c3c', 'Cotización rechazada por el cliente',        NOW()),
    ('expired',   'Vencida',    '#95a5a6', 'Cotización vencida por tiempo',              NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO users_userstate (id, name, description, created_at)
VALUES
    ('active',    'Activo',     'Usuario activo con acceso al sistema',   NOW()),
    ('inactive',  'Inactivo',   'Usuario inactivo sin acceso al sistema', NOW()),
    ('suspended', 'Suspendido', 'Usuario temporalmente suspendido',       NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO notes_notetype (id, name, description, created_at)
VALUES
    ('product',   'Producto',     NULL, NOW()),
    ('company',   'Empresa',      NULL, NOW()),
    ('event',     'Evento',       NULL, NOW()),
    ('promotion', 'Promoción',    NULL, NOW()),
    ('training',  'Capacitación', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO notes_notestate (id, name, color, description, created_at)
VALUES
    ('draft',     'Borrador',  '#95a5a6', NULL, NOW()),
    ('published', 'Publicado', '#27ae60', NULL, NOW()),
    ('archived',  'Archivado', '#7f8c8d', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

COMMIT;
```

---

## Cómo ejecutarlo

Conectado a la DB de producción desde psql:

```bash
# Desde fuera del contenedor
docker exec -i laqq-db psql -U postgres -d laqq_db < seed_production.sql

# Desde dentro del contenedor (PowerShell)
Get-Content seed_production.sql | docker exec -i laqq-db psql -U postgres -d laqq_db

# Si ya estás dentro del contenedor en psql
\c laqq_db
# Pegar el contenido del bloque SQL de arriba directamente
```

> **Nota:** El script original no incluía `created_at` en los inserts de `ticket_states` y `ticket_priorities`,
> lo que generó un error `null value in column "created_at" violates not-null constraint`.
> La versión de este documento ya lo tiene corregido.
