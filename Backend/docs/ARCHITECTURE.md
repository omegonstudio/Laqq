# Arquitectura del Sistema LAQQ

## 🏗️ Arquitectura General

### Stack Tecnológico

```
Frontend (futuro)
    ↓
Django REST Framework (Backend API)
    ↓
PostgreSQL (Base de Datos)
```

## 📐 Estructura de la Aplicación

### Apps de Django

El sistema está organizado en 8 aplicaciones Django independientes:

#### 1. **users** - Gestión de Usuarios y Permisos

```
users/
├── models.py           # User, Role, Permission, RolePermission
├── views.py            # ViewSets de la API
├── serializers.py      # Serializers DRF
├── permissions.py      # Clases de permisos personalizadas
├── backends.py         # Backend de autenticación por email
├── admin.py            # Django Admin
└── management/commands/
    └── init_permissions.py
```

**Responsabilidades:**
- Autenticación con JWT
- 2FA (TOTP)
- Sistema de roles y permisos granulares
- Login por email

#### 2. **products** - Catálogo de Productos

```
products/
├── models.py           # Product, Brand, Category, ProductSpec, ProductRelation
├── views.py            # API endpoints
├── serializers.py      # Serializers
├── importer.py         # Importación masiva CSV
├── permissions.py      # IsReadOnlyOrAdmin
└── management/commands/
    └── import_products_single.py
```

**Responsabilidades:**
- Gestión de productos con código único auto-generado
- Marcas y categorías
- Especificaciones técnicas por producto
- Relaciones entre productos (productos relacionados)
- Importación masiva vía CSV
- Integración con attachments para imágenes

#### 3. **accessories** - Accesorios de Productos

```
accessories/
├── models.py           # Accessory, ProductAccessory
├── views.py            # API endpoints
├── serializers.py      # Serializers
└── urls.py
```

**Responsabilidades:**
- Catálogo de accesorios
- Relación many-to-many con productos
- Precios y stock de accesorios

#### 4. **quotes** - Sistema de Cotizaciones

```
quotes/
├── models.py           # Quote, QuoteItem, QuoteType, QuoteState
├── views.py            # API endpoints
├── serializers.py      # Serializers
├── permissions.py      # IsReadOnlyOrAdmin
├── templates/
│   └── emails/         # Templates HTML y TXT para emails
│       ├── quote_business.html
│       ├── quote_business.txt
│       ├── quote_customer.html
│       └── quote_customer.txt
└── urls.py
```

**Responsabilidades:**
- Generación de cotizaciones con número único auto-generado
- Items de cotización con productos y cantidades
- Estados y tipos de cotizaciones
- Envío automático de emails (cliente + negocio)
- Integración con contacts y products

#### 5. **contacts** - CRM de Contactos

```
contacts/
├── models.py           # Contact, ContactState, Message
├── views.py            # API endpoints
├── serializers.py      # Serializers
└── urls.py
```

**Responsabilidades:**
- Gestión de clientes y prospectos
- Estados de contactos (NEW, IN_PROGRESS, RESPONDED, CLOSED)
- Mensajes y comunicación
- Asignación de contactos a usuarios

#### 6. **tickets** - Tickets de Servicio

```
tickets/
├── models.py           # ServiceTicket, TicketPriority, TicketState
├── views.py            # API endpoints
├── serializers.py      # Serializers
├── urls.py
└── management/commands/
    ├── populate_ticket_data.py
    └── fix_ticket_numbers.py
```

**Responsabilidades:**
- Gestión de tickets de soporte
- Prioridades y estados de tickets
- Número de ticket auto-generado (T-YYYY-NNNNN)
- Asignación de tickets a usuarios

#### 7. **notes** - Sistema de Notas

```
notes/
├── models.py           # Note, NoteType, NoteState
├── views.py            # API endpoints
├── serializers.py      # Serializers
└── urls.py
```

**Responsabilidades:**
- Notas con tipos (PRODUCT, COMPANY, EVENT, PROMOTION, TRAINING)
- Estados (DRAFT, PUBLISHED, ARCHIVED)
- Autoría y timestamps

#### 8. **attachments** - Gestión de Archivos

```
attachments/
├── models.py           # Attachment (archivos binarios)
├── views.py            # API endpoints
├── serializers.py      # Serializers
└── urls.py
```

**Responsabilidades:**
- Almacenamiento de archivos binarios en BD
- Generic Foreign Key para attachar a cualquier modelo
- Metadatos (filename, content_type, size)
- Upload y download de archivos

## 🔐 Sistema de Permisos

### Modelo de Datos

```
┌─────────────┐       ┌──────────────────┐       ┌────────────┐
│    User     │──────>│ RolePermission   │<──────│   Role     │
│             │       │  (Junction)      │       │            │
│ - email     │       │ - granted_at     │       │ - name     │
│ - password  │       │ - granted_by     │       │ - is_active│
│ - role_id   │       └──────────────────┘       └────────────┘
│ - is_staff  │                │
│ - 2fa       │                │
└─────────────┘                ↓
                       ┌────────────┐
                       │ Permission │
                       │            │
                       │ - module   │
                       │ - action   │
                       │ - codename │
                       └────────────┘
```

### Flujo de Autenticación

```
1. Login Request
   POST /users/token/
   {username, password}
        ↓
2. TokenObtainPairView (JWT)
   - Busca usuario por username
   - Verifica contraseña
   - Genera tokens JWT
        ↓
3. Generate JWT Tokens
   - Access Token (configurable en settings)
   - Refresh Token (configurable en settings)
        ↓
4. Return to Client
   {access, refresh}

5. Refresh Token
   POST /users/token/refresh/
   {refresh}
        ↓
6. Return new Access Token
   {access}
```

### Flujo de Verificación de Permisos

```
1. API Request con JWT
   Authorization: Bearer {token}
        ↓
2. JWTAuthentication
   - Verifica token
   - Obtiene usuario
        ↓
3. Permission Check
   - HasModulePermission.has_permission()
   - user.has_permission(module, action)
        ↓
4. Query RolePermission
   - Busca permiso en role del usuario
        ↓
5. Allow/Deny Request
```

## 🗄️ Esquema de Base de Datos

### Tablas Principales

#### users (User Model)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(128) NOT NULL,
    first_name VARCHAR(150),
    last_name VARCHAR(150),
    phone VARCHAR(20),
    role_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    is_staff BOOLEAN DEFAULT FALSE,
    is_superuser BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    date_joined TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### roles
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### permissions
```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    codename VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    UNIQUE(module, action)
);
```

#### role_permissions
```sql
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP,
    granted_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(role_id, permission_id)
);
```

## 🔄 Flujo de Datos

### Creación de Usuario

```
1. POST /users/list/
   {username, email, password, first_name, last_name, user_type, state}
        ↓
2. UserCreateSerializer.validate()
   - Valida username único
   - Valida email único
   - Valida contraseña fuerte
   - Valida user_type existe (Admin/Backoffice)
        ↓
3. User.objects.create_user()
   - Hash password
   - Asigna user_type
   - Asigna state
        ↓
4. Return User Data
   {id, username, email, full_name, user_type, state, is_active}
```

### Verificación de Permiso en API

```
ViewSet (ej: ProductViewSet)
    ↓
permission_classes = [HasModulePermission]
module_name = 'products'
permission_mapping = {'list': 'read', 'create': 'create', ...}
    ↓
HasModulePermission.has_permission()
    ↓
request.user.has_permission('products', 'read')
    ↓
RolePermission.objects.filter(
    role=user.role,
    permission__module='products',
    permission__action='read'
).exists()
```

## 🎨 Patrones de Diseño Utilizados

### 1. **Repository Pattern**
- Los managers de Django (`objects`) actúan como repositories
- Encapsulan la lógica de acceso a datos

### 2. **Service Layer**
- Los ViewSets actúan como service layer
- Coordinan entre serializers, models y permisos

### 3. **Strategy Pattern**
- Múltiples clases de permisos (`IsAdminUser`, `HasModulePermission`, etc.)
- Se pueden intercambiar según necesidad

### 4. **Decorator Pattern**
- `@admin.register()`
- `@action()` en ViewSets

### 5. **Factory Pattern**
- UserManager para crear usuarios
- `create_user()` vs `create_superuser()`

## 🔒 Seguridad

### Capas de Seguridad

1. **Autenticación**
   - JWT con firma HMAC
   - Refresh tokens rotables
   - Protección contra timing attacks en backend

2. **Autorización**
   - Permisos granulares por módulo/acción
   - Verificación a nivel de ViewSet
   - Verificación a nivel de objeto

3. **Contraseñas**
   - Hash con Argon2 (más seguro que bcrypt)
   - Validadores de Django (longitud, caracteres, etc.)

4. **2FA**
   - TOTP (Time-based One-Time Password)
   - QR code para apps como Google Authenticator

5. **CORS**
   - Configurado para orígenes específicos
   - Credenciales permitidas solo para orígenes confiables

## 📊 Escalabilidad

### Consideraciones Actuales

- ✅ UUID como Primary Keys (mejor para distribución)
- ✅ Índices en campos frecuentemente consultados (email, role_id)
- ✅ Paginación en lista de usuarios
- ✅ QuerySet optimization (select_related, prefetch_related)

### Mejoras Futuras

- 🔄 Caché de permisos con Redis
- 🔄 Background tasks con Celery
- 🔄 Rate limiting por usuario/IP
- 🔄 Logging estructurado
- 🔄 Métricas y monitoring

## 🧪 Testing Strategy

### Niveles de Testing (a implementar)

1. **Unit Tests**
   - Modelos (métodos has_permission, get_permissions)
   - Serializers (validaciones)
   - Permission classes

2. **Integration Tests**
   - ViewSets completos
   - Flujo de autenticación
   - Flujo de permisos

3. **API Tests**
   - Endpoints con diferentes roles
   - Casos de error (401, 403, 404)

## 📈 Métricas y Monitoreo (Futuro)

### Métricas Clave

- Tiempo de respuesta de APIs
- Tasa de errores 4xx/5xx
- Uso de tokens JWT
- Intentos de login fallidos
- Permisos denegados

### Herramientas Sugeridas

- Sentry - Error tracking
- Prometheus - Métricas
- Grafana - Visualización
- ELK Stack - Logs

## 🚀 Deployment

### Environments

1. **Development**
   - DEBUG=True
   - SQLite/PostgreSQL local
   - Sin HTTPS

2. **Staging**
   - DEBUG=False
   - PostgreSQL
   - HTTPS
   - Mismo stack que producción

3. **Production**
   - DEBUG=False
   - PostgreSQL con backups
   - HTTPS obligatorio
   - Rate limiting
   - Monitoring activo

### Checklist de Deployment

- [ ] Cambiar SECRET_KEY
- [ ] DEBUG=False
- [ ] Configurar ALLOWED_HOSTS
- [ ] HTTPS (SECURE_SSL_REDIRECT=True)
- [ ] Configurar CORS apropiadamente
- [ ] Backups de base de datos
- [ ] Logging configurado
- [ ] Rate limiting
- [ ] Monitoring/Alertas
- [ ] Documentación de APIs actualizada

---

**Última actualización:** 2024-12-02
