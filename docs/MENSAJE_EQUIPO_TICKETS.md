# Actualización: Flujo de Tickets de Servicio 🎫

**Fecha:** 2026-02-20

---

## 📋 Resumen de Cambios

Hemos implementado **notificaciones automáticas por email** en el sistema de tickets de servicio. Ahora, cada vez que un ticket cambia de estado, el cliente recibe un email notificándole la actualización.

Además, el flujo de asignación ha sido mejorado: cuando se asigna un ticket a un técnico, el estado cambia automáticamente de `new` a `open` y se notifica al cliente.

---

## ✨ Nuevas Funcionalidades

### 1. Emails Automáticos de Cambio de Estado

El cliente recibirá un email cuando el ticket cambie a cualquiera de estos estados:

| Acción del Backend | Estado Nuevo | Email al Cliente |
|--------------------|--------------|------------------|
| Asignar técnico (`POST /tickets/{id}/assign/`) | `open` | ✅ Sí |
| Iniciar trabajo (`POST /tickets/{id}/start/`) | `in_progress` | ✅ Sí |
| Resolver ticket (`POST /tickets/{id}/resolve/`) | `resolved` | ✅ Sí (incluye notas de resolución) |
| Cerrar ticket (`POST /tickets/{id}/close/`) | `closed` | ✅ Sí |

**Contenido del email al cliente:**
- Estado actual del ticket (con color)
- Número de ticket
- Producto y descripción del problema
- Prioridad
- Fecha de última actualización
- Notas de resolución (cuando aplica)
- Datos de contacto del negocio

---

### 2. Transición Automática `new` → `open`

**Antes:**
```
POST /tickets/{id}/assign/
{
  "assigned_user": 5
}
→ Solo asignaba el usuario, estado quedaba en 'new'
```

**Ahora:**
```
POST /tickets/{id}/assign/
{
  "assigned_user": 5
}
→ Asigna el usuario Y cambia el estado a 'open'
→ Envía email al cliente notificando que su ticket está siendo atendido
```

---

## 🔧 Cambios Técnicos (Backend)

### Archivos Modificados

1. **`Backend/tickets/templates/emails/ticket_status_change.html`** (nuevo)
   - Template HTML del email de cambio de estado

2. **`Backend/tickets/templates/emails/ticket_status_change.txt`** (nuevo)
   - Template texto plano del email de cambio de estado

3. **`Backend/tickets/emails.py`**
   - Nueva función: `send_ticket_status_change_email(ticket)`
   - Envía email al cliente cuando cambia el estado

4. **`Backend/tickets/views.py`**
   - Endpoint `assign` ahora cambia estado `new` → `open` automáticamente
   - Todos los endpoints de cambio de estado (`assign`, `start`, `resolve`, `close`) envían email

5. **`Backend/docs/TICKETS_LOGIC.md`** (actualizado)
   - Documentación completa del nuevo flujo
   - Sección de "Notificaciones por Email" agregada

---

## 📖 Documentación Completa

Para entender el flujo completo de tickets y cómo funcionan los endpoints, consultar:

**📄 [Backend/docs/TICKETS_LOGIC.md](Backend/docs/TICKETS_LOGIC.md)**

Este documento incluye:
- ✅ Descripción de todos los estados y transiciones
- ✅ Endpoints disponibles con ejemplos completos
- ✅ Lógica de negocio automática (fechas, emails, etc.)
- ✅ Ejemplos de uso paso a paso
- ✅ Validaciones y permisos

---

## 🚀 Uso para el Frontend

### Endpoint de Asignación

**Antes de este cambio:**
```javascript
// Frontend solo asignaba usuario, estado quedaba en 'new'
POST /api/tickets/{id}/assign/
{
  "assigned_user": 5
}
```

**Ahora:**
```javascript
// Frontend llama al mismo endpoint, pero:
// - El backend cambia el estado a 'open' automáticamente
// - El backend envía email al cliente
// NO hace falta que el frontend haga nada adicional
POST /api/tickets/{id}/assign/
{
  "assigned_user": 5
}

// Response incluye el nuevo estado:
{
  "id": "...",
  "state": "open",  // ← Ahora es 'open', antes era 'new'
  "assigned_user": { ... },
  "assigned_at": "2026-02-20T10:30:00Z"
}
```

### Otros Endpoints de Cambio de Estado

Todos funcionan igual que antes, pero **ahora envían email automáticamente**:

```javascript
// Iniciar trabajo (email automático al cliente)
POST /api/tickets/{id}/start/

// Resolver (email automático con notas de resolución)
POST /api/tickets/{id}/resolve/
{
  "resolution_notes": "Se reemplazó el componente defectuoso"
}

// Cerrar (email automático)
POST /api/tickets/{id}/close/
```

---

## ⚠️ Puntos Importantes

1. **Los emails se envían automáticamente** desde el backend — el frontend **no necesita** hacer nada especial

2. **El endpoint `assign` ahora cambia el estado** — si el frontend muestra el estado, se actualizará en la respuesta

3. **No hay cambios breaking** — todos los endpoints siguen funcionando igual, solo que ahora hacen más cosas (cambiar estado + enviar email)

4. **Logs en desarrollo** — cuando se envían emails en desarrollo, se imprime el contenido en consola (útil para debugging)

5. **Tests pasando** — 12/12 tests de tickets pasan correctamente con los nuevos cambios

---

## 🧪 Testing en Desarrollo

Al trabajar en desarrollo local, los emails **no se envían realmente**, sino que se guardan en `mail.outbox` (memoria).

Para verificar que funcionan:
1. Crear un ticket
2. Asignarlo a un técnico → Verificar que el estado cambia a `open`
3. Llamar a `/start/`, `/resolve/`, `/close/` → Verificar que funcionan
4. Los logs en consola mostrarán el contenido de los emails

---

## ❓ Preguntas Frecuentes

**Q: ¿El cliente recibe email cuando se crea el ticket?**
A: Sí, ese email ya existía. Ahora además recibe emails cuando el estado cambia.

**Q: ¿Se pueden deshabilitar los emails?**
A: Los emails solo se envían en producción (con `RESEND_API_KEY` configurada). En desarrollo van a `mail.outbox`.

**Q: ¿Qué pasa si falla el envío del email?**
A: Se loguea el error pero el ticket se actualiza igual. Los emails no bloquean la operación.

**Q: ¿El frontend tiene que hacer algo nuevo?**
A: No, los endpoints funcionan igual. Solo que ahora hacen más cosas automáticamente.

---

## 📞 Dudas

Si tienen dudas sobre el flujo completo, revisar primero la documentación en:
- **[Backend/docs/TICKETS_LOGIC.md](Backend/docs/TICKETS_LOGIC.md)** (flujo completo con ejemplos)
- **[Backend/docs/SEED_PRODUCCION.md](Backend/docs/SEED_PRODUCCION.md)** (datos de referencia necesarios)

Si quedan preguntas después de revisar la doc, consultar en el grupo.

---

**Happy coding! 🚀**
