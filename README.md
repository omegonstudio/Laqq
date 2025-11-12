# LAQQ - Sistema de Gestión

Sistema backend desarrollado con Django REST Framework que implementa un robusto sistema de autenticación, permisos granulares por roles y gestión de usuarios.

## 🚀 Características Principales

- ✅ **Autenticación con JWT** - Tokens seguros con refresh automático
- ✅ **Sistema de Roles y Permisos** - Control granular por módulos y acciones
- ✅ **Autenticación 2FA** - Two-Factor Authentication con TOTP
- ✅ **Login con Email** - Sin necesidad de username
- ✅ **API REST Completa** - Endpoints documentados y probados
- ✅ **Panel de Administración** - Django Admin personalizado
- ✅ **PostgreSQL** - Base de datos robusta y escalable

## 📋 Requisitos

- Python 3.13+
- PostgreSQL 17+
- pip 25+

## 🛠️ Instalación

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
```

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
├── config/               # Configuración principal del proyecto
│   ├── settings.py      # Configuración de Django
│   ├── urls.py          # URLs principales
│   ├── wsgi.py          # WSGI config
│   └── asgi.py          # ASGI config
├── users/               # App de usuarios y permisos
│   ├── models.py        # Modelos: User, Role, Permission, RolePermission
│   ├── views.py         # ViewSets de la API
│   ├── serializers.py   # Serializers DRF
│   ├── permissions.py   # Clases de permisos personalizadas
│   ├── backends.py      # Backend de autenticación por email
│   ├── admin.py         # Configuración Django Admin
│   ├── urls.py          # URLs de la app
│   └── management/
│       └── commands/
│           └── init_permissions.py  # Comando para inicializar permisos
├── docs/                # Documentación del proyecto
│   ├── ARCHITECTURE.md  # Arquitectura y diseño técnico
│   └── API.md          # Documentación de API
├── requirements.txt     # Dependencias del proyecto
├── manage.py           # CLI de Django
├── .env                # Variables de entorno (no commitear)
├── .gitignore          # Archivos ignorados por git
└── README.md           # Este archivo
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

- [Arquitectura del Sistema](docs/ARCHITECTURE.md) - Diseño técnico y patrones
- [API Documentation](docs/API.md) - Referencia completa de endpoints

## 🔒 Seguridad

- Las contraseñas se hashean con Argon2
- JWT tokens con refresh automático
- Soporte 2FA con TOTP
- Backend de autenticación con protección contra timing attacks
- CORS configurado correctamente
- Validaciones de permisos en cada endpoint

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
