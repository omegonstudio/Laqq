# Lógica de Negocio - Sistema de Tickets de Servicio Técnico

**Fecha:** 2025-11-25
**Versión:** 1.0

---

## Resumen

Sistema completo de gestión de tickets de servicio técnico para empresa química, con:

- ✅ Estados específicos del ciclo de vida del ticket
- ✅ Sistema de prioridades (Baja, Media, Alta, Urgente)
- ✅ Seguimiento automático de fechas clave
- ✅ Relación con productos del catálogo
- ✅ Asignación a técnicos
- ✅ Transiciones automáticas de estado
- ✅ Endpoints personalizados para acciones comunes
- ✅ Estadísticas de tickets

---

## Modelos

### 1. TicketState - Estados del Ticket

Estados del ciclo de vida de un ticket de servicio técnico.

**Archivo:** [tickets/models.py:8-22](tickets/models.py#L8-L22)

```python
class TicketState(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=20)
    description = models.TextField()
    is_final = models.BooleanField(default=False)  # True para 'closed'
    created_at = models.DateTimeField(auto_now_add=True)
```

**Estados predefinidos:**

| ID | Nombre | Color | Descripción | Final |
|----|--------|-------|-------------|-------|
| `new` | Nuevo | #3498db (Azul) | Ticket recién creado, sin asignar | No |
| `open` | Abierto | #f39c12 (Naranja) | Ticket asignado a un técnico | No |
| `in_progress` | En progreso | #9b59b6 (Púrpura) | Técnico trabajando en el ticket | No |
| `waiting_parts` | Esperando repuestos | #e74c3c (Rojo) | En espera de repuestos o materiales | No |
| `resolved` | Resuelto | #1abc9c (Verde agua) | Problema resuelto, esperando confirmación | No |
| `closed` | Cerrado | #27ae60 (Verde) | Ticket cerrado y finalizado | Sí |

---

### 2. TicketPriority - Prioridades del Ticket

Niveles de prioridad para tickets de servicio técnico.

**Archivo:** [tickets/models.py:24-38](tickets/models.py#L24-L38)

```python
class TicketPriority(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    level = models.IntegerField(default=0)  # 1-4
    color = models.CharField(max_length=20)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
```

**Prioridades predefinidas:**

| ID | Nombre | Nivel | Color | Descripción |
|----|--------|-------|-------|-------------|
| `low` | Baja | 1 | #95a5a6 (Gris) | Problema menor sin urgencia |
| `medium` | Media | 2 | #3498db (Azul) | Problema estándar con prioridad normal |
| `high` | Alta | 3 | #f39c12 (Naranja) | Problema importante que requiere atención pronta |
| `urgent` | Urgente | 4 | #e74c3c (Rojo) | Problema crítico que requiere atención inmediata |

---

### 3. ServiceTicket - Ticket de Servicio Técnico

**Archivo:** [tickets/models.py:40-76](tickets/models.py#L40-L76)

```python
class ServiceTicket(models.Model):
    # Identificación
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    ticket_number = models.CharField(max_length=100, unique=True)  # T-2025-00001
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE)

    # Información del producto
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    product_name = models.CharField(max_length=120)

    # Descripción del problema
    description = models.TextField()
    attachment = models.ForeignKey(Attachment, on_delete=models.SET_NULL, null=True, blank=True)

    # Estado y prioridad
    state = models.ForeignKey(TicketState, on_delete=models.PROTECT, default='new')
    priority = models.ForeignKey(TicketPriority, on_delete=models.PROTECT, default='medium')

    # Asignación
    assigned_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    # Seguimiento de fechas (todas automáticas excepto created_at)
    created_at = models.DateTimeField(auto_now_add=True)      # Cuando llegó
    assigned_at = models.DateTimeField(null=True, blank=True)  # Cuando se asignó
    started_at = models.DateTimeField(null=True, blank=True)   # Cuando empezó el trabajo
    resolved_at = models.DateTimeField(null=True, blank=True)  # Cuando se resolvió
    closed_at = models.DateTimeField(null=True, blank=True)    # Cuando se cerró
    updated_at = models.DateTimeField(auto_now=True)

    # Notas de resolución
    resolution_notes = models.TextField(null=True, blank=True)
```

---

## Lógica de Negocio Automática

### 1. Auto-generación de Número de Ticket

**Formato:** `T-YYYY-NNNNN`

- `T` = Ticket
- `YYYY` = Año actual
- `NNNNN` = Número secuencial de 5 dígitos

**Ejemplo:**
- Primer ticket de 2025: `T-2025-00001`
- Segundo ticket de 2025: `T-2025-00002`
- Primer ticket de 2026: `T-2026-00001`

**Implementación:** [tickets/serializers.py:43-77](tickets/serializers.py#L43-L77)

---

### 2. Estados y Prioridades por Defecto

Cuando se crea un ticket sin especificar estado o prioridad:

- **Estado por defecto:** `new` (Nuevo)
- **Prioridad por defecto:** `medium` (Media)

**Implementación:** [tickets/serializers.py:63-75](tickets/serializers.py#L63-L75)

---

### 3. Transiciones Automáticas de Estado

El sistema actualiza automáticamente las fechas de seguimiento según los cambios de estado:

| Acción | Cambio de estado | Fecha actualizada |
|--------|------------------|-------------------|
| Asignar técnico | `new` → `open` | `assigned_at` |
| Empezar trabajo | → `in_progress` | `started_at` |
| Resolver problema | → `resolved` | `resolved_at` |
| Cerrar ticket | → `closed` | `closed_at` y `resolved_at` (si no existe) |

**Implementación:** [tickets/serializers.py:79-122](tickets/serializers.py#L79-L122)

**Ejemplo:**

```json
// Request: Asignar ticket
PATCH /tickets/{id}/
{
  "assigned_user": 5
}

// Response: Estado cambia automáticamente
{
  "id": "...",
  "state": "open",           // ← Cambió de 'new' a 'open'
  "assigned_user": 5,
  "assigned_at": "2025-11-25T10:30:00Z"  // ← Fecha automática
}
```

---

### 4. Sincronización de Producto

Si se proporciona un `product` (FK), el `product_name` se sincroniza automáticamente:

```json
{
  "product": "uuid-del-producto",  // FK al catálogo
  "product_name": "..."            // ← Se llena automáticamente con product.name
}
```

**Implementación:** [tickets/serializers.py:35-41](tickets/serializers.py#L35-L41)

---

## Endpoints de la API

### Endpoints Base

| Endpoint | Descripción |
|----------|-------------|
| `GET /tickets/` | Listar todos los tickets |
| `POST /tickets/` | Crear nuevo ticket |
| `GET /tickets/{id}/` | Obtener ticket específico |
| `PATCH /tickets/{id}/` | Actualizar ticket |
| `DELETE /tickets/{id}/` | Eliminar ticket |
| `GET /tickets/states/` | Listar estados disponibles |
| `GET /tickets/priorities/` | Listar prioridades disponibles |

---

### Filtros Disponibles

```bash
# Filtrar por estado
GET /tickets/?state=in_progress

# Filtrar por prioridad
GET /tickets/?priority=urgent

# Filtrar por producto
GET /tickets/?product={uuid}

# Filtrar por contacto
GET /tickets/?contact={uuid}

# Filtrar por técnico asignado
GET /tickets/?assigned_user=5

# Buscar en texto
GET /tickets/?search=pipeta

# Ordenar por fecha de creación (descendente)
GET /tickets/?ordering=-created_at

# Ordenar por prioridad (más urgente primero)
GET /tickets/?ordering=-priority__level

# Combinar filtros
GET /tickets/?state=open&priority=urgent&ordering=-created_at
```

---

### Acciones Personalizadas

#### 1. Asignar ticket a técnico

```bash
POST /tickets/{id}/assign/
{
  "assigned_user": 5
}
```

**Comportamiento:**
- Establece `assigned_at` = fecha actual
- Si el estado es `new`, cambia automáticamente a `open`

---

#### 2. Iniciar trabajo en ticket

```bash
POST /tickets/{id}/start/
```

**Comportamiento:**
- Cambia estado a `in_progress`
- Establece `started_at` = fecha actual

---

#### 3. Marcar ticket como resuelto

```bash
POST /tickets/{id}/resolve/
{
  "resolution_notes": "Se reemplazó el pistón defectuoso"
}
```

**Comportamiento:**
- Cambia estado a `resolved`
- Establece `resolved_at` = fecha actual
- Guarda las notas de resolución

---

#### 4. Cerrar ticket

```bash
POST /tickets/{id}/close/
```

**Comportamiento:**
- Cambia estado a `closed`
- Establece `closed_at` = fecha actual
- Si no tiene `resolved_at`, también lo establece

---

#### 5. Obtener estadísticas

```bash
GET /tickets/statistics/
```

**Response:**
```json
{
  "total": 150,
  "by_state": {
    "Nuevo": 10,
    "Abierto": 25,
    "En progreso": 40,
    "Resuelto": 15,
    "Cerrado": 60
  },
  "by_priority": {
    "Baja": 20,
    "Media": 80,
    "Alta": 30,
    "Urgente": 20
  },
  "unassigned": 10,
  "created_last_7_days": 25
}
```

---

## Ejemplos de Uso Completos

### Ejemplo 1: Cliente crea ticket desde el carrito

```bash
POST /tickets/
Authorization: Bearer {token}
Content-Type: application/json

{
  "contact": "uuid-del-contacto",
  "product": "uuid-del-producto-en-catalogo",
  "description": "La pipeta automática no dispensa el volumen correcto. Al intentar dispensar 100ml, solo dispensa aproximadamente 85ml. El equipo tiene 2 años de uso.",
  "attachment": "uuid-del-adjunto"  // Opcional: foto del problema
}
```

**Response:**
```json
{
  "id": "abc123...",
  "ticket_number": "T-2025-00123",
  "contact": "uuid-del-contacto",
  "product": "uuid-del-producto-en-catalogo",
  "product_name": "Pipeta Automática 100ml",  // ← Auto-sincronizado
  "description": "La pipeta automática no dispensa...",
  "attachment": "uuid-del-adjunto",
  "state": "new",                             // ← Default
  "priority": "medium",                        // ← Default
  "assigned_user": null,
  "created_at": "2025-11-25T10:00:00Z",
  "assigned_at": null,
  "started_at": null,
  "resolved_at": null,
  "closed_at": null,
  "resolution_notes": null
}
```

---

### Ejemplo 2: Administrador asigna ticket a técnico

```bash
POST /tickets/abc123.../assign/
{
  "assigned_user": 5
}
```

**Response:**
```json
{
  "id": "abc123...",
  "ticket_number": "T-2025-00123",
  "state": "open",                             // ← Cambió de 'new' a 'open'
  "priority": "medium",
  "assigned_user": 5,
  "assigned_at": "2025-11-25T11:00:00Z",       // ← Fecha automática
  ...
}
```

---

### Ejemplo 3: Técnico empieza a trabajar

```bash
POST /tickets/abc123.../start/
```

**Response:**
```json
{
  "state": "in_progress",                      // ← Cambió de 'open' a 'in_progress'
  "started_at": "2025-11-25T11:30:00Z",        // ← Fecha automática
  ...
}
```

---

### Ejemplo 4: Técnico marca como urgente y agrega nota

```bash
PATCH /tickets/abc123.../
{
  "priority": "urgent",
  "state": "waiting_parts",
  "resolution_notes": "Requiere pistón de reemplazo - Código: PST-100"
}
```

---

### Ejemplo 5: Técnico resuelve el ticket

```bash
POST /tickets/abc123.../resolve/
{
  "resolution_notes": "Se reemplazó el pistón defectuoso. Equipo calibrado y probado. Ahora dispensa 100ml ±0.5ml según especificación."
}
```

**Response:**
```json
{
  "state": "resolved",
  "resolved_at": "2025-11-25T14:00:00Z",       // ← Fecha automática
  "resolution_notes": "Se reemplazó el pistón defectuoso...",
  ...
}
```

---

### Ejemplo 6: Cliente confirma y se cierra el ticket

```bash
POST /tickets/abc123.../close/
```

**Response:**
```json
{
  "state": "closed",
  "closed_at": "2025-11-25T15:00:00Z",         // ← Fecha automática
  ...
}
```

---

## Validaciones

| Campo | Validación |
|-------|------------|
| `description` | Mínimo 20 caracteres |
| `ticket_number` | Read-only, generado automáticamente |
| `assigned_at`, `started_at`, `resolved_at`, `closed_at` | Read-only, gestionadas automáticamente |

---

## Configuración Inicial

### 1. Ejecutar migraciones

```bash
python manage.py migrate
```

### 2. Poblar estados y prioridades

```bash
python manage.py populate_ticket_data
```

Este comando crea:
- 6 estados predefinidos (new, open, in_progress, waiting_parts, resolved, closed)
- 4 prioridades predefinidas (low, medium, high, urgent)

---

## Permisos y Seguridad

### Usuarios que Pueden Gestionar Tickets

Según los requisitos del proyecto:

| Tipo de Usuario | Crear Tickets | Ver Tickets | Asignar | Cambiar Estado | Cerrar |
|-----------------|---------------|-------------|---------|----------------|--------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Backoffice** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Anónimo (sin login)** | ✅ | ❌ | ❌ | ❌ | ❌ |

### Flujo de Creación de Tickets sin Login

1. **Usuario anónimo** accede al formulario de tickets
2. Completa el formulario con:
   - Datos de contacto (nombre, email, empresa)
   - Producto afectado
   - Descripción del problema
   - Archivo adjunto (opcional)
3. Al enviar, el sistema:
   - Crea un registro en `Contact` con los datos proporcionados
   - Crea el `ServiceTicket` vinculado a ese contacto
   - Asigna estado `new` y prioridad `medium` por defecto
   - Genera número único de ticket (T-2025-00001)

**Nota:** Los usuarios anónimos NO pueden ver el estado de sus tickets después de crearlos. Esto podría implementarse en el futuro mediante:
- Sistema de tracking por email
- Token único por ticket
- Sistema de login opcional

---

## Administración Django

Todos los modelos están registrados en el admin de Django:

- `http://localhost:8000/admin/tickets/ticketstate/`
- `http://localhost:8000/admin/tickets/ticketpriority/`
- `http://localhost:8000/admin/tickets/serviceticket/`

**Funcionalidades del admin:**

- Lista con filtros por estado, prioridad, técnico
- Búsqueda por número, producto, descripción
- Visualización organizada por fieldsets
- Fechas de seguimiento en sección colapsable

---

## Próximas Mejoras (Opcional)

Funcionalidades que podrían agregarse en el futuro:

1. **Historial de cambios:** Registro de todas las transiciones de estado
2. **Notificaciones:** Emails automáticos al crear, asignar o resolver tickets
3. **SLA (Service Level Agreement):** Tiempo máximo de resolución según prioridad
4. **Comentarios:** Sistema de comentarios en el ticket
5. **Adjuntos múltiples:** Permitir varios archivos por ticket
6. **Relación con cotizaciones:** Vincular tickets con presupuestos de reparación
7. **Métricas avanzadas:** Tiempo promedio de resolución, satisfacción del cliente

---

## Tests Unitarios

Se han implementado **21 tests completos** que cubren toda la funcionalidad:

### Cobertura de Tests

✅ **CRUD básico** (8 tests)
- Listar tickets con paginación
- Crear ticket con auto-generación de número
- Actualizar ticket
- Validar descripción mínima
- Filtrar por contacto, estado, usuario asignado
- Buscar por texto

✅ **Sistema de prioridades** (2 tests)
- Crear ticket con prioridad específica
- Filtrar tickets por prioridad

✅ **Relación con productos** (3 tests)
- Crear ticket vinculado a producto del catálogo
- Crear ticket sin producto (solo texto libre)
- Filtrar tickets por producto

✅ **Transiciones de estado y fechas** (5 tests)
- Asignar ticket a técnico (auto-transición new→open)
- Iniciar trabajo (actualiza started_at)
- Resolver ticket con notas (actualiza resolved_at)
- Cerrar ticket (actualiza closed_at)
- Transiciones manuales de estado

✅ **Endpoints avanzados** (3 tests)
- Estadísticas de tickets
- Listar estados disponibles
- Listar prioridades disponibles

### Ejecutar Tests

```bash
# Todos los tests de tickets
python manage.py test tickets

# Test específico
python manage.py test tickets.tests.ServiceTicketAPITestCase.test_assign_ticket_to_user

# Con más verbosidad
python manage.py test tickets --verbosity=2
```

### Resultado

```
Ran 21 tests in 8.407s

OK - 21 tests pasaron correctamente
```

---

## Archivos Modificados

- ✅ [tickets/models.py](tickets/models.py) - Modelos TicketState, TicketPriority, ServiceTicket actualizado
- ✅ [tickets/serializers.py](tickets/serializers.py) - Serializers con lógica de negocio
- ✅ [tickets/views.py](tickets/views.py) - ViewSets con acciones personalizadas
- ✅ [tickets/urls.py](tickets/urls.py) - Rutas para todos los endpoints
- ✅ [tickets/admin.py](tickets/admin.py) - Configuración del admin
- ✅ [tickets/tests.py](tickets/tests.py) - **21 tests unitarios completos**
- ✅ [tickets/management/commands/populate_ticket_data.py](tickets/management/commands/populate_ticket_data.py) - Comando de inicialización

---

**Autor:** Claude Code
**Última actualización:** 2025-11-25
**Tests:** 21/21 pasando ✅
