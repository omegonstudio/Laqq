# Documentación LAQQ

Índice completo de toda la documentación técnica del proyecto.

---

## 📦 Infraestructura y Deployment

### [DOCKER.md](DOCKER.md)
Guía completa de Docker y Docker Compose para desarrollo y producción.

**Contenido:**
- Configuración de Docker Desktop
- Diferencias entre modo desarrollo y producción
- Comandos útiles de Docker
- Troubleshooting común
- Manejo de volúmenes y networks

---

### [DEPLOY.md](DEPLOY.md)
Guía de deployment en producción con diferentes estrategias.

**Contenido:**
- Deployment manual (sin Docker)
- Deployment con Docker Compose
- Configuración de Nginx
- SSL/HTTPS con Let's Encrypt
- Variables de entorno de producción
- Backup y restore de base de datos

---

### [ARCHITECTURE.md](ARCHITECTURE.md)
Diseño técnico, patrones arquitectónicos y estructura del proyecto.

**Contenido:**
- Arquitectura general del sistema
- Estructura de carpetas
- Patrones de diseño utilizados
- Flujo de datos
- Dependencias y tecnologías

---

## 🔌 API y Funcionalidades

### [API.md](API.md)
Referencia completa de todos los endpoints de la API REST.

**Contenido:**
- Autenticación (JWT, login, refresh)
- Usuarios, roles y permisos
- Productos, marcas, categorías
- Contactos y CRM
- Cotizaciones
- Tickets de servicio
- Adjuntos
- Dashboard y estadísticas

---

### [TICKETS_LOGIC.md](TICKETS_LOGIC.md)
Sistema completo de tickets de servicio técnico - Lógica de negocio.

**Contenido:**
- Modelos: TicketState, TicketPriority, ServiceTicket
- Auto-generación de números de ticket (T-YYYY-NNNNN)
- Estados y prioridades predefinidas
- Transiciones automáticas de estado
- Seguimiento de fechas (assigned_at, started_at, resolved_at, closed_at)
- Endpoints base y filtros
- Acciones personalizadas (assign, start, resolve, close)
- Estadísticas de tickets
- Ejemplos de uso completos
- Tests unitarios (21 tests)

**Archivo creado:** 2025-11-25

---

### [TICKETS_CLIENT_PORTAL.md](TICKETS_CLIENT_PORTAL.md) ⭐
Portal del cliente con creación automática de usuarios.

**Contenido:**
- Flujo completo desde creación de ticket hasta acceso al portal
- Verificación y creación automática de usuarios
- Generación de credenciales seguras (username y password)
- Sistema de envío de emails (cliente + negocio)
- Templates HTML profesionales
- Sistema de permisos por rol (admin, back, client)
- Filtrado automático de tickets por email
- Adjuntar archivos con permisos
- Configuración de emails (SMTP)
- Testing manual paso a paso
- Tests automatizados (14 tests)
- Seguridad y aislamiento de datos

**Características principales:**
- ✅ Creación automática de usuario al crear ticket
- ✅ Email con credenciales de acceso
- ✅ Clientes solo ven sus propios tickets
- ✅ Capacidad de adjuntar archivos
- ✅ No se crean usuarios duplicados (email como ID único)

**Archivo creado:** 2025-12-23

---

## 🧪 Testing

### [TESTING.md](TESTING.md)
Guía de testing del proyecto.

**Contenido:**
- Tests unitarios
- Tests de integración
- Cobertura de código
- Fixtures y factories
- Comandos de testing

---

## ⚙️ Utilidades y Scripts

### [scripts/README.md](../scripts/README.md)
Documentación de scripts de utilidad.

**Contenido:**
- Scripts de importación masiva
- Scripts de inicialización de datos
- Comandos de gestión personalizados
- Herramientas de desarrollo

---

## 📋 Checklists y Referencias

### [CHECKLIST_PUSH.md](CHECKLIST_PUSH.md)
Checklist de verificación antes de hacer push/merge.

**Contenido:**
- Verificaciones de configuración
- Tests que deben pasar
- Documentación actualizada
- Migraciones aplicadas
- Estado del proyecto

---

### [feat-endpoints-n-cruds.md](feat-endpoints-n-cruds.md)
Documentación de features, endpoints y CRUDs implementados.

**Contenido:**
- Lista de features completadas
- Endpoints disponibles por módulo
- CRUDs implementados
- Funcionalidades adicionales

---

## 🗂️ Índice por Categoría

### Gestión de Tickets
1. [TICKETS_LOGIC.md](TICKETS_LOGIC.md) - Lógica de negocio y flujos
2. [TICKETS_CLIENT_PORTAL.md](TICKETS_CLIENT_PORTAL.md) - Portal del cliente

### Deployment
1. [DOCKER.md](DOCKER.md) - Containerización
2. [DEPLOY.md](DEPLOY.md) - Deployment en producción

### Desarrollo
1. [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitectura del sistema
2. [TESTING.md](TESTING.md) - Testing y QA
3. [scripts/README.md](../scripts/README.md) - Scripts de utilidad

### API y Referencia
1. [API.md](API.md) - Documentación completa de endpoints
2. [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) - ⭐ Guía de integración para frontend developer

---

## 📝 Convenciones de Documentación

Cada archivo de documentación sigue esta estructura:

```markdown
# Título

**Fecha:** YYYY-MM-DD
**Versión:** X.X

---

## Resumen
Descripción breve de qué se documenta

---

## Sección 1
Contenido detallado...

---

## Tests
Información sobre tests relacionados

---

**Autor:** [Autor]
**Última actualización:** YYYY-MM-DD
```

---

## 🔄 Actualizaciones Recientes

| Fecha | Archivo | Cambio |
|-------|---------|--------|
| 2025-12-23 | TICKETS_CLIENT_PORTAL.md | ⭐ Nuevo - Documentación completa del portal del cliente |
| 2025-11-25 | TICKETS_LOGIC.md | Creación - Sistema de tickets de servicio |
| 2025-11-20 | API.md | Actualización - Nuevos endpoints de dashboard |

---

**Mantenido por:** Equipo LAQQ
**Última revisión:** 2025-12-23
