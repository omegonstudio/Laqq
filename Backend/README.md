# LAQQ - Sistema de Gestión

Sistema backend desarrollado con Django REST Framework para la gestión completa de productos, cotizaciones, clientes, tickets de servicio y más.

> Nota: para levantar el monorepo con Docker y ver URLs/credenciales en dev, seguí `docs/DEV_SETUP.md` en la raíz.

## 🚀 Características Principales

### Autenticación y Seguridad
- ✅ **Autenticación con JWT** - Tokens seguros con refresh automático
- ✅ **Sistema de Roles y Permisos** - Control granular por módulos y acciones
- ✅ **Autenticación 2FA** - Two-Factor Authentication con TOTP
- ✅ **Login con Email** - Sin necesidad de username

### Gestión de Productos
- ✅ **Catálogo de Productos** - Con marcas, categorías y especificaciones
- ✅ **Productos Relacionados** - Sistema de relaciones entre productos
- ✅ **Accesorios** - Gestión de accesorios por producto
- ✅ **Bulk Upload** - Importación masiva de productos vía CSV
- ✅ **Paginación Completa** - Información detallada para navegación entre páginas

### Gestión Comercial
- ✅ **Cotizaciones** - Sistema completo de generación de cotizaciones
- ✅ **Contactos y Clientes** - CRM integrado con estados y seguimiento
- ✅ **Notificaciones Email** - Emails automáticos para cotizaciones
- ✅ **Tickets de Servicio** - Sistema de soporte y seguimiento

### Adicionales
- ✅ **Notas y Documentación** - Sistema de notas con tipos y estados
- ✅ **Attachments** - Gestión de archivos adjuntos
- ✅ **API REST Completa** - Endpoints documentados con Swagger
- ✅ **Panel de Administración** - Django Admin personalizado
- ✅ **PostgreSQL** - Base de datos robusta y escalable
- ✅ **Docker Ready** - Deployment con Docker y Docker Compose

## 📋 Requisitos

### Con Docker (Recomendado)
- Docker Desktop
- Git

### Sin Docker (Manual)
- Python 3.13+
- PostgreSQL 17+
- pip 25+

## 🚀 Quick Start con Docker

### Windows

```bash
# Clonar repositorio
git clone <repository-url>
cd Laqq

# Doble click en deploy.bat y elige el modo:
#   1. Desarrollo - Hot reload, datos de prueba, DEBUG=True
#   2. Producción - Gunicorn, optimizado, DEBUG=False

# O desde línea de comandos:
deploy.bat dev    # Modo desarrollo
deploy.bat prod   # Modo producción
```

**Diferencias entre modos:**
- 🔧 **Desarrollo**: Hot reload, datos de prueba, Django runserver, código sincronizado
- 🚀 **Producción**: Gunicorn, sin datos de prueba, imagen optimizada, DEBUG=False


### Linux/Mac

```bash
# Clonar repositorio
git clone <repository-url>
cd Laqq

# Dar permisos de ejecución al script
chmod +x deploy.sh

# Ejecutar deployment con menú interactivo
./deploy.sh

# O especificar el modo directamente:
./deploy.sh dev    # Modo desarrollo
./deploy.sh prod   # Modo producción

# Alternativamente, usar docker-compose directamente:
# docker-compose -f docker-compose.dev.yml up --build    # Desarrollo
# docker-compose up --build -d                           # Producción
```

La aplicación estará disponible en:
- **API:** http://localhost:8000
- **Admin:** http://localhost:8000/admin/
- **Swagger:** http://localhost:8000/swagger/
- **Credenciales:** laqq@gmail.com / laqq

✅ **Todo se configura automáticamente:** Base de datos, migraciones, datos de prueba, superusuario

📚 **Guía completa de Docker:** Ver [docs/DOCKER.md](docs/DOCKER.md)

---

## 🛠️ Instalación Manual (Sin Docker)

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd Laqq
```

### 2. Crear entorno virtual

```bash
python -m venv venv
venv\Scripts\activate  # En Windows
# source venv/bin/activate  # En Linux/Mac
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Database
DB_NAME=laqq_db
DB_USER=postgres
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=5432

# Django
SECRET_KEY=tu_secret_key_aqui
DEBUG=True

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-app-password
DEFAULT_FROM_EMAIL=noreply@tuempresa.com
DEFAULT_FROM_NAME=Tu Empresa

# Business Email Settings
BUSINESS_EMAIL=ventas@tuempresa.com
BUSINESS_NAME=Tu Empresa
BUSINESS_PHONE=+54 11 1234-5678
BUSINESS_ADDRESS=Dirección de tu empresa
QUOTE_RESPONSE_TIME=24-48 horas
```

> **Nota sobre configuración de email con Gmail:**
> 1. Habilita la verificación en 2 pasos en tu cuenta de Gmail
> 2. Genera una "Contraseña de aplicación" en https://myaccount.google.com/apppasswords
> 3. Usa esa contraseña en `EMAIL_HOST_PASSWORD` (no tu contraseña de Gmail)

### 5. Crear base de datos

```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE laqq_db;
\q
```

### 6. Aplicar migraciones

```bash
python manage.py migrate
```

### 7. Inicializar roles y permisos

```bash
python manage.py init_permissions
```

### 8. Crear superusuario

```bash
python manage.py createsuperuser
```

### 9. Ejecutar el servidor

```bash
python manage.py runserver
```

El servidor estará disponible en: http://127.0.0.1:8000/

## 📧 Notificaciones por Email

El sistema envía notificaciones automáticas por email cuando se crean cotizaciones.

### Funcionamiento

Cuando un cliente envía su carrito y se genera una cotización:

1. **Email al Negocio** (`BUSINESS_EMAIL`)
   - Información completa del cliente
   - Detalle de todos los productos solicitados con cantidades y precios
   - Monto total de la cotización
   - Mensaje del cliente (si lo incluye)

2. **Email al Cliente** (email del contacto)
   - Confirmación de recepción de la solicitud
   - Número de cotización para seguimiento
   - Resumen de productos solicitados
   - Tiempo estimado de respuesta
   - Datos de contacto del negocio

### Configuración de Email

El sistema soporta cualquier servidor SMTP. Ejemplos de configuración:

**Gmail:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-app-password  # Contraseña de aplicación
```

**Outlook/Office365:**
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=tu-email@outlook.com
EMAIL_HOST_PASSWORD=tu-password
```

**Servidor SMTP Personalizado:**
```env
EMAIL_HOST=smtp.tuservidor.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=usuario
EMAIL_HOST_PASSWORD=password
```

### Personalización

Puedes personalizar los templates de email en:
- `quotes/templates/emails/quote_business.html` - Email al negocio (HTML)
- `quotes/templates/emails/quote_business.txt` - Email al negocio (texto plano)
- `quotes/templates/emails/quote_customer.html` - Email al cliente (HTML)
- `quotes/templates/emails/quote_customer.txt` - Email al cliente (texto plano)

### Testing de Emails

Durante desarrollo, puedes usar el backend de consola para ver los emails sin enviarlos:

```python
# En settings.py o .env para desarrollo
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

Los emails se mostrarán en la consola donde corre el servidor.

## 🔐 Sistema de Permisos

### Roles Disponibles

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **Administrador** | Acceso total al sistema | 16/16 permisos (100%) |
| **BackOffice** | Gestión operativa | 15/16 permisos (93.75%) |

### Diferencia Clave

**La única diferencia** entre ambos roles:
- ✅ **Administrador**: Puede eliminar usuarios (`users_delete`)
- ❌ **BackOffice**: NO puede eliminar usuarios

Ambos roles tienen **acceso completo** a:
- Productos (CRUD completo)
- Pedidos (CRUD completo)
- Clientes (CRUD completo)

### Módulos y Permisos

El sistema gestiona 4 módulos con 4 acciones cada uno:

**Módulos:**
- `users` - Gestión de Usuarios
- `products` - Gestión de Productos
- `orders` - Administración de Pedidos
- `clients` - CRUD de Clientes

**Acciones:**
- `create` - Crear
- `read` - Leer
- `update` - Actualizar
- `delete` - Eliminar

**Total:** 16 permisos (4 módulos × 4 acciones)

## 📡 API Endpoints

### Paginación

Todos los endpoints de listado incluyen paginación completa con la siguiente estructura:

```json
{
  "count": 156,              // Total de items en la base de datos
  "next": "http://...",      // URL de la siguiente página (null si es la última)
  "previous": "http://...",  // URL de la página anterior (null si es la primera)
  "page_size": 25,           // Cantidad de items por página
  "current_page": 2,         // Número de página actual
  "total_pages": 7,          // Total de páginas disponibles
  "results": [...]           // Array de resultados para esta página
}
```

**Parámetros de Query:**
- `page` - Número de página (ej: `?page=2`)
- `page_size` - Items por página, máximo 100 (ej: `?page_size=10`)

**Ejemplo:**
```bash
GET /products/list/?page=2&page_size=10
```

### Autenticación

```bash
# Login
POST /api/auth/login/
Body: {"email": "user@example.com", "password": "password"}

# Refresh Token
POST /api/auth/refresh/
Body: {"refresh": "refresh_token"}
```

### Usuarios

```bash
# Listar usuarios
GET /api/users/

# Crear usuario
POST /api/users/
Body: {
  "email": "user@example.com",
  "first_name": "Nombre",
  "last_name": "Apellido",
  "password": "password123",
  "role": "role_id"
}

# Obtener usuario específico
GET /api/users/{id}/

# Actualizar usuario
PUT /api/users/{id}/

# Eliminar usuario (solo Administrador)
DELETE /api/users/{id}/

# Perfil actual
GET /api/users/me/

# Actualizar perfil propio
PUT /api/users/update_profile/

# Cambiar contraseña
POST /api/users/change_password/
```

### Roles

```bash
# Listar roles
GET /api/roles/

# Obtener rol específico
GET /api/roles/{id}/

# Asignar permiso a rol
POST /api/roles/{id}/assign_permission/
Body: {"permission_id": "permission_id"}
```

### Permisos

```bash
# Listar permisos
GET /api/permissions/

# Permisos agrupados por módulo
GET /api/permissions/by_module/
```

### 2FA (Two-Factor Authentication)

```bash
# Habilitar 2FA
POST /api/users/enable_2fa/

# Verificar código 2FA
POST /api/users/verify_2fa/
Body: {"token": "123456"}

# Deshabilitar 2FA
POST /api/users/disable_2fa/
```

### Productos

```bash
# Listar productos (con paginación)
GET /products/list/
GET /products/list/?page=2&page_size=10

# Crear producto
POST /products/list/
Body: {
  "name": "Producto Nuevo",
  "brand_id": "uuid-de-la-marca",      // UUID para crear/editar
  "category_id": "uuid-de-la-categoria", // UUID para crear/editar
  "description": "Descripción del producto",
  "is_active": true
}

# Respuesta (GET) - Brand y Category devuelven nombres
{
  "id": "uuid-del-producto",
  "name": "Producto Nuevo",
  "brand": "Nombre de la Marca",       // ← Nombre legible (no UUID)
  "category": "Nombre de la Categoría", // ← Nombre legible (no UUID)
  "description": "Descripción",
  "is_active": true,
  "specs": [...],
  "related_products": [...]
}

# Obtener producto específico
GET /products/list/{id}/

# Actualizar producto
PUT /products/list/{id}/
PATCH /products/list/{id}/

# Eliminar producto
DELETE /products/list/{id}/

# Filtrar productos
GET /products/list/?brand={brand_id}
GET /products/list/?category={category_id}
GET /products/list/?is_active=true
GET /products/list/?search=vaso

# Marcas
GET /brands/list/
POST /brands/list/
Body: {"name": "Nueva Marca", "description": "Descripción"}

# Categorías
GET /categories/list/
POST /categories/list/
Body: {"name": "Nueva Categoría", "description": "Descripción"}
```

**Nota importante sobre Brand y Category:**
- **Para leer (GET)**: Los campos `brand` y `category` devuelven **nombres legibles** (strings)
- **Para escribir (POST/PUT)**: Usar `brand_id` y `category_id` con los UUIDs correspondientes

### Dashboard (Backoffice)

```bash
# Obtener resumen del dashboard
GET /dashboard/summary/

# Respuesta
{
  "stats": {
    "active_users": 24,      // Total de usuarios activos
    "products": 156,         // Total de productos
    "quotes": 48,            // Total de cotizaciones
    "new_messages": 12       // Mensajes nuevos (últimos 7 días)
  },
  "recent_activity": [
    {
      "type": "quote",       // Tipo: quote, message, product
      "title": "Nueva cotización de Laboratorio Central",
      "time_ago": "Hace 2 horas",
      "quote_number": "Q-2025-00001",
      "contact": "Laboratorio Central",
      "state": "Draft"
    }
    // ... más actividad reciente
  ]
}
```

**Características:**
- ✅ Requiere autenticación JWT
- ✅ Datos en tiempo real (no hardcodeados)
- ✅ Actividad reciente de últimos 7 días
- ✅ Estadísticas agregadas del sistema

## 🎨 Panel de Administración

Accede al panel de administración de Django:

```
URL: http://127.0.0.1:8000/admin/
```

En el panel podrás gestionar:
- 👥 Usuarios
- 🔑 Roles
- 🔐 Permisos
- 🔗 Asignaciones Role-Permission

## 🏗️ Estructura del Proyecto

```
Laqq/
├── config/                  # Configuración principal del proyecto
│   ├── settings.py         # Configuración de Django
│   ├── urls.py             # URLs principales
│   ├── wsgi.py             # WSGI config
│   └── asgi.py             # ASGI config
├── users/                  # Gestión de usuarios, roles y permisos
│   ├── models.py           # User, Role, Permission, RolePermission
│   ├── views.py            # ViewSets de la API
│   ├── serializers.py      # Serializers DRF
│   ├── permissions.py      # Clases de permisos personalizadas
│   ├── backends.py         # Backend de autenticación por email
│   └── management/commands/
│       └── init_permissions.py
├── products/               # Catálogo de productos
│   ├── models.py           # Product, Brand, Category, ProductSpec
│   ├── views.py            # API endpoints de productos
│   ├── importer.py         # Importación masiva de CSV
│   └── management/commands/
│       └── import_products_single.py
├── accessories/            # Accesorios de productos
│   ├── models.py           # Accessory, ProductAccessory
│   └── views.py            # API endpoints de accesorios
├── quotes/                 # Sistema de cotizaciones
│   ├── models.py           # Quote, QuoteItem, QuoteType, QuoteState
│   ├── views.py            # API endpoints de cotizaciones
│   └── templates/emails/   # Templates de emails
├── contacts/               # CRM de contactos
│   ├── models.py           # Contact, ContactState, Message
│   └── views.py            # API endpoints de contactos
├── tickets/                # Tickets de servicio
│   ├── models.py           # ServiceTicket, TicketPriority, TicketState
│   ├── views.py            # API endpoints de tickets
│   └── management/commands/
│       ├── populate_ticket_data.py
│       └── fix_ticket_numbers.py
├── notes/                  # Sistema de notas
│   ├── models.py           # Note, NoteType, NoteState
│   └── views.py            # API endpoints de notas
├── attachments/            # Gestión de archivos adjuntos
│   ├── models.py           # Attachment (archivos binarios)
│   └── views.py            # API endpoints de attachments
├── scripts/                # Scripts de utilidad
│   ├── seed_data.py        # Datos de prueba para desarrollo
│   ├── setup_db.bat        # Setup de BD local (Windows)
│   └── README.md           # Documentación de scripts
├── docs/                   # Documentación del proyecto
│   ├── DOCKER.md           # Guía completa de Docker
│   ├── DEPLOY.md           # Guía de deployment
│   ├── ARCHITECTURE.md     # Arquitectura y diseño técnico
│   └── API.md              # Documentación de API
├── Dockerfile              # Imagen Docker para producción
├── Dockerfile.dev          # Imagen Docker para desarrollo
├── docker-compose.yml      # Orquestación Docker producción
├── docker-compose.dev.yml  # Orquestación Docker desarrollo
├── entrypoint.sh           # Entrypoint para producción
├── entrypoint.dev.sh       # Entrypoint para desarrollo
├── deploy.bat              # Script de deployment unificado (Windows)
├── requirements.txt        # Dependencias del proyecto
├── manage.py               # CLI de Django
├── .env.example            # Ejemplo de variables de entorno
└── README.md               # Este archivo
```

## 🔧 Configuración Avanzada

### CORS

Por defecto, el sistema acepta peticiones desde:
- http://localhost:3000
- http://localhost:8080
- http://127.0.0.1:3000
- http://127.0.0.1:8080

Para agregar más orígenes, edita `CORS_ALLOWED_ORIGINS` en `config/settings.py`.

### JWT Tokens

Configuración actual:
- **Access Token**: 1 hora de duración
- **Refresh Token**: 7 días de duración
- **Algoritmo**: HS256

Para modificar, edita `SIMPLE_JWT` en `config/settings.py`.

### Base de Datos

El proyecto usa PostgreSQL por defecto. Para cambiar a otra base de datos, modifica `DATABASES` en `config/settings.py`.

## 📚 Comandos Útiles

```bash
# Verificar configuración
python manage.py check

# Ver migraciones
python manage.py showmigrations

# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Inicializar permisos
python manage.py init_permissions

# Crear superusuario
python manage.py createsuperuser

# Ejecutar tests
python manage.py test

# Entrar a la shell de Django
python manage.py shell

# Recopilar archivos estáticos
python manage.py collectstatic
```

## 🐛 Troubleshooting

### Error: "No module named 'rest_framework_simplejwt'"

```bash
pip install -r requirements.txt
```

### Error: "Dependency on app with no migrations"

```bash
python manage.py migrate
```

### Error: "No tiene permiso para ver o modificar nada" en Django Admin

El usuario debe ser superusuario:

```bash
python manage.py createsuperuser
```

O actualizar usuario existente en shell:

```python
from users.models import User
user = User.objects.get(email='tu@email.com')
user.is_staff = True
user.is_superuser = True
user.save()
```

### Warning: "pkg_resources is deprecated"

Este es un warning informativo de `djangorestframework-simplejwt`. No afecta el funcionamiento del sistema y se resolverá en futuras versiones de la librería.

## 📖 Documentación Adicional

Consulta la carpeta `/docs` para documentación detallada:

### Infraestructura y Deployment
- **[Docker](docs/DOCKER.md)** - Guía completa de Docker y comandos útiles
- **[Deployment](docs/DEPLOY.md)** - Guía de deployment en producción
- **[Arquitectura](docs/ARCHITECTURE.md)** - Diseño técnico y patrones

### API y Funcionalidades
- **[API](docs/API.md)** - Referencia completa de endpoints
- **[Frontend Integration](docs/FRONTEND_INTEGRATION.md)** - ⭐ Guía completa para integrar el frontend
- **[Tickets - Lógica de Negocio](docs/TICKETS_LOGIC.md)** - Sistema completo de tickets de servicio técnico
- **[Tickets - Portal del Cliente](docs/TICKETS_CLIENT_PORTAL.md)** - Creación automática de usuarios y portal de seguimiento

### Utilidades
- **[Scripts](scripts/README.md)** - Documentación de scripts de utilidad

## 🎫 Portal de Clientes - Tickets de Servicio

### Funcionalidad Automática

Cuando se crea un ticket de servicio técnico, el sistema **automáticamente**:

1. ✅ **Crea un usuario cliente** (si no existe) con credenciales aleatorias seguras
2. ✅ **Envía un email al cliente** con:
   - Información del ticket creado
   - Usuario y contraseña para acceder al portal
   - URL del portal de cliente
3. ✅ **Envía un email al negocio** con:
   - Detalles completos del ticket
   - Información del cliente
   - Notificación de creación de cuenta cliente

### Roles y Permisos

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **Administrador** | Acceso total al sistema | CRUD completo en todos los recursos |
| **BackOffice** | Gestión operativa | CRUD en productos, cotizaciones, tickets, contactos |
| **Cliente** | Portal de cliente | Solo lectura de sus propios tickets + adjuntar archivos |

### Endpoints del Portal de Cliente

```bash
# Listar tickets (clientes solo ven sus propios tickets)
GET /tickets/
Headers: Authorization: Bearer {jwt_token}

# Respuesta para cliente (filtrado automático por email)
{
  "count": 3,
  "results": [
    {
      "id": "uuid",
      "ticket_number": "T-2025-00001",
      "product_name": "Pipeta Automática 100ml",
      "description": "No dispensa el volumen correcto",
      "state": "in_progress",
      "priority": "high",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T14:20:00Z"
    }
  ]
}

# Ver detalle de un ticket
GET /tickets/{ticket_id}/
Headers: Authorization: Bearer {jwt_token}

# Adjuntar archivo a un ticket (clientes pueden adjuntar a sus propios tickets)
POST /tickets/{ticket_id}/attach_file/
Headers: Authorization: Bearer {jwt_token}
Body: {
  "file_name": "foto_problema.jpg",
  "content_type": "image/jpeg",
  "data": "<binary_data_or_base64>"
}
```

### Seguridad y Restricciones

**Clientes:**
- ✅ Solo pueden **ver** sus propios tickets (filtrado automático por email)
- ✅ Solo pueden **adjuntar archivos** a sus propios tickets
- ❌ NO pueden crear tickets (los crea el staff)
- ❌ NO pueden modificar tickets existentes
- ❌ NO pueden asignar técnicos
- ❌ NO pueden cambiar estados

**Admin/BackOffice:**
- ✅ Acceso completo a todos los tickets
- ✅ Pueden crear, modificar, asignar y cerrar tickets
- ✅ Pueden adjuntar archivos a cualquier ticket
- ✅ Acceso a estadísticas y reportes

### Creación de Usuario Cliente

El sistema utiliza el email del contacto como identificador único:

1. **Verificación de email duplicado:** Si ya existe un usuario con ese email, NO se crea uno nuevo
2. **Generación de credenciales:**
   - Username: Basado en el email del contacto (ej: `john.doe_a3f2`)
   - Password: 12 caracteres aleatorios seguros (mayúsculas, minúsculas, números, símbolos)
3. **Asignación automática:**
   - `user_type`: `client`
   - `state`: `active`
   - Nombres y apellidos del contacto

### Email Templates

Las plantillas de email están disponibles en:
- `tickets/templates/emails/ticket_customer.html` - Email al cliente (HTML)
- `tickets/templates/emails/ticket_customer.txt` - Email al cliente (texto)
- `tickets/templates/emails/ticket_business.html` - Email al negocio (HTML)
- `tickets/templates/emails/ticket_business.txt` - Email al negocio (texto)

### Configuración de Email

```python
# En .env o settings.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'

DEFAULT_FROM_NAME = 'LAQQ Soporte'
DEFAULT_FROM_EMAIL = 'soporte@laqq.com'
BUSINESS_EMAIL = 'admin@laqq.com'
CLIENT_PORTAL_URL = 'https://portal.laqq.com'
```

### Poblar Datos Iniciales

Para crear los tipos de usuario (admin, back, client) y estados:

```bash
# Con Docker
docker-compose -f docker-compose.dev.yml exec web python manage.py populate_user_data

# Sin Docker
python manage.py populate_user_data
```

Esto creará:
- **User Types:** `admin`, `back`, `client`
- **User States:** `active`, `inactive`, `suspended`

## 🔒 Seguridad

- Las contraseñas se hashean con Argon2
- JWT tokens con refresh automático
- Soporte 2FA con TOTP
- Backend de autenticación con protección contra timing attacks
- CORS configurado correctamente
- Validaciones de permisos en cada endpoint
- **Portal de clientes con aislamiento de datos** (cada cliente solo ve sus propios tickets)

## 🌐 Variables de Entorno

| Variable | Descripción | Por Defecto |
|----------|-------------|-------------|
| `DB_NAME` | Nombre de la base de datos | `laqq_db` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `postgres` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `SECRET_KEY` | Django secret key | - |
| `DEBUG` | Modo debug | `True` |

## 📄 Licencia

Este proyecto es privado y confidencial.

## 👥 Contribución

Para contribuir al proyecto:

1. Crea una rama desde `main`
2. Realiza tus cambios
3. Asegúrate de que todos los tests pasen
4. Crea un Pull Request

## 📞 Soporte

Para soporte o preguntas, contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ usando Django REST Framework**
