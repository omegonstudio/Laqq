# Portal del Cliente - Sistema de Tickets

**Fecha:** 2025-12-23
**Versión:** 1.0

---

## Contexto del Negocio

**LAQQ** es una empresa química que vende productos y equipos de laboratorio a distribuidoras mediante un sistema de carritos de compra. Cuando una distribuidora tiene problemas con un producto adquirido (equipos defectuosos, productos con fallas, consultas técnicas), puede crear un ticket de servicio desde la web.

---

## Resumen

Sistema automático de creación de cuentas de cliente cuando una distribuidora genera un ticket de servicio desde la web, permitiendo el seguimiento del ticket mediante un portal dedicado.

**Funcionalidades principales:**

- ✅ Creación automática de usuario cliente al generar un ticket
- ✅ Generación segura de credenciales aleatorias
- ✅ Envío de emails con credenciales y detalles del ticket
- ✅ Portal con permisos restringidos para clientes
- ✅ Visualización de tickets propios únicamente
- ✅ Capacidad de adjuntar archivos a tickets propios
- ✅ Sistema de permisos por rol (admin, back, client)

---

## Flujo Completo

### 1. Distribuidora Crea un Ticket desde la Web

**Escenario:** Una distribuidora que compró productos químicos o equipos de laboratorio tiene un problema (equipo defectuoso, producto con fallas, consulta técnica) y completa un formulario de servicio técnico en la web (sin necesidad de login previo).

**Endpoint:** `POST /tickets/`

**Request:**
```json
{
  "contact": "uuid-del-contacto",
  "product_name": "Pipeta Automática 100ml",
  "description": "La pipeta no dispensa el volumen correcto. Al intentar dispensar 100ml, solo dispensa aproximadamente 85ml. El equipo tiene 2 años de uso."
}
```

---

### 2. Sistema Verifica y Crea Usuario Automáticamente

**Archivo:** [tickets/serializers.py:89-125](tickets/serializers.py#L89-L125)

El sistema ejecuta la siguiente lógica:

```python
# 1. Buscar si ya existe un usuario con el email del contacto
existing_user = User.objects.filter(email=contact.email).first()

if not existing_user:
    # 2. Generar credenciales seguras
    username = generate_username_from_contact(contact)  # Ej: "juan.perez"
    password = generate_secure_password()  # Ej: "aB3$xY9!mK2@"

    # 3. Crear usuario con tipo "client"
    user = User.objects.create_user(
        username=username,
        email=contact.email,
        password=password,
        first_name=contact.first_name,
        last_name=contact.last_name,
        user_type=client_type,  # 'client'
        state=active_state,     # 'active'
    )
```

**Regla de oro:** El email es el identificador único. Si ya existe un usuario con ese email, **NO se crea otro**.

---

### 3. Generación de Credenciales Seguras

**Archivo:** [tickets/utils.py](tickets/utils.py)

#### 3.1 Generación de Username

```python
def generate_username_from_contact(contact):
    # Usa el prefijo del email
    if contact.email:
        base_username = contact.email.split('@')[0]
    else:
        base_username = f"{contact.first_name.lower()}{contact.last_name.lower()}"

    # Limpia caracteres especiales
    base_username = ''.join(c for c in base_username if c.isalnum() or c in '-_')

    # Verifica unicidad, agrega sufijo si existe
    while User.objects.filter(username=username).exists():
        username = f"{base_username}_{secrets.token_hex(2)}"

    return username
```

**Ejemplos:**
- Email: `compras@distribuidoramedica.com` → Username: `compras`
- Email: `ventas@laboquimica.com.ar` → Username: `ventas`
- Email: `admin@company.com` (ya existe) → Username: `admin_a3f2`

---

#### 3.2 Generación de Password Segura

```python
def generate_secure_password(length=12):
    # Características:
    # - Longitud: 12 caracteres por defecto
    # - Al menos 1 minúscula
    # - Al menos 1 mayúscula
    # - Al menos 1 número
    # - Al menos 1 caracter especial (!@#$%^&*-_=+)
    # - Orden aleatorio

    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special = '!@#$%^&*-_=+'

    # Garantiza al menos uno de cada tipo
    password = [
        secrets.choice(lowercase),
        secrets.choice(uppercase),
        secrets.choice(digits),
        secrets.choice(special),
    ]

    # Completa con caracteres aleatorios
    all_chars = lowercase + uppercase + digits + special
    password += [secrets.choice(all_chars) for _ in range(length - 4)]

    # Mezcla para evitar patrones predecibles
    secrets.SystemRandom().shuffle(password)

    return ''.join(password)
```

**Ejemplo de passwords generadas:**
- `xK9$aB2!mY7@`
- `TKj9oB%*w4$C`
- `pR5#dL8^nQ1-`

---

### 4. Envío de Emails Automáticos

**Archivo:** [tickets/emails.py](tickets/emails.py)

Se envían **2 emails** automáticamente:

#### 4.1 Email al Cliente

**Asunto:** `Ticket de Servicio #T-2025-00001 - Acceso al Portal`

**Contenido:**
```
Hola Juan Pérez,

Hemos recibido tu solicitud de servicio técnico y creado un ticket de seguimiento.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 INFORMACIÓN DEL TICKET

Número de Ticket: T-2025-00001
Producto: Pipeta Automática 100ml
Prioridad: Media
Estado: Nuevo
Fecha de creación: 23/12/2025 13:53

Descripción del problema:
La pipeta no dispensa el volumen correcto. Al intentar dispensar 100ml...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔑 ACCESO AL PORTAL DE CLIENTE

Hemos creado una cuenta para que puedas hacer seguimiento de tu ticket:

URL: http://localhost:8000/client-portal
Usuario: juan.perez
Contraseña: xK9$aB2!mY7@

IMPORTANTE: Guarda estas credenciales en un lugar seguro.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ ¿QUÉ PUEDES HACER EN EL PORTAL?

• Ver el estado actual de tu ticket en tiempo real
• Adjuntar imágenes o documentos adicionales
• Agregar comentarios o información complementaria
• Revisar el historial de cambios

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Gracias por confiar en LAQQ.
```

**Implementación:** [tickets/emails.py:132-211](tickets/emails.py#L132-L211)

---

#### 4.2 Email al Negocio

**Asunto:** `Nuevo Ticket de Servicio #T-2025-00001 de Distribuidora Médica SA`

**Contenido:**
```
LAQQ - Productos Químicos
Nuevo Ticket de Servicio Técnico

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 NUEVO TICKET RECIBIDO

Número de Ticket: T-2025-00001
Cliente: Distribuidora Médica SA - Juan Pérez
Email: compras@distribuidoramedica.com
Teléfono: 1234567890

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 DETALLES DEL SERVICIO

Producto: Pipeta Automática 100ml
Prioridad: Media
Estado: Nuevo
Fecha de creación: 23/12/2025 13:53

Descripción del problema:
La pipeta no dispensa el volumen correcto. Al intentar dispensar 100ml...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 ACCESO DE CLIENTE

Se ha creado automáticamente una cuenta de cliente para seguimiento del ticket.
El cliente ha recibido sus credenciales de acceso por email separado.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ PRÓXIMAS ACCIONES

1. Revisar y asignar el ticket a un técnico
2. Evaluar la prioridad y ajustar si es necesario
3. Contactar al cliente si se requiere más información
4. Actualizar el estado conforme avance el trabajo
```

**Implementación:** [tickets/emails.py:69-130](tickets/emails.py#L69-L130)

---

### 5. Cliente Accede al Portal

#### 5.1 Autenticación

**Endpoint:** `POST /users/token/`

**Request:**
```json
{
  "username": "juan.perez",
  "password": "xK9$aB2!mY7@"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

#### 5.2 Ver Sus Tickets

**Endpoint:** `GET /tickets/`

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Filtrado Automático:** [tickets/views.py:67-80](tickets/views.py#L67-L80)

```python
def get_queryset(self):
    user = self.request.user
    queryset = super().get_queryset()

    if user.user_type_id == 'client':
        # Cliente solo ve tickets con su mismo email
        queryset = queryset.filter(contact__email=user.email)

    return queryset
```

**Response:**
```json
[
  {
    "id": "abc123...",
    "ticket_number": "T-2025-00001",
    "contact": {
      "email": "juan.perez@test.com",
      "first_name": "Juan",
      "last_name": "Pérez"
    },
    "product_name": "Notebook Dell Inspiron",
    "description": "La notebook no enciende...",
    "state": "in_progress",
    "priority": "high",
    "created_at": "2025-12-23T10:00:00Z"
  }
  // Solo tickets del cliente, nunca de otros
]
```

---

#### 5.3 Adjuntar Archivos

**Endpoint:** `POST /tickets/{id}/attach_file/`

**Permisos:** [tickets/permissions.py:56-87](tickets/permissions.py#L56-L87)

```python
class CanAttachFiles(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user

        # Cliente solo puede adjuntar a sus propios tickets
        if user.user_type_id == 'client':
            return obj.contact.email == user.email

        return False
```

**Request:**
```json
{
  "file_name": "foto_problema.jpg",
  "content_type": "image/jpeg",
  "data": "base64_encoded_file_data..."
}
```

**Response:**
```json
{
  "message": "File attached successfully",
  "attachment_id": "def456...",
  "ticket_number": "T-2025-00001",
  "file_name": "foto_problema.jpg"
}
```

---

## Sistema de Permisos

**Archivo:** [tickets/permissions.py](tickets/permissions.py)

### Matriz de Permisos

| Acción | Admin (LAQQ) | BackOffice (LAQQ) | Cliente (Distribuidora) | Anónimo (Web) |
|--------|--------------|-------------------|------------------------|---------------|
| **Crear ticket** | ✅ | ✅ | ❌ | ✅ (sin login) |
| **Ver todos los tickets** | ✅ | ✅ | ❌ | ❌ |
| **Ver propios tickets** | ✅ | ✅ | ✅ | ❌ |
| **Modificar tickets** | ✅ | ✅ | ❌ | ❌ |
| **Eliminar tickets** | ✅ | ✅ | ❌ | ❌ |
| **Asignar técnico** | ✅ | ✅ | ❌ | ❌ |
| **Cambiar estado** | ✅ | ✅ | ❌ | ❌ |
| **Adjuntar archivos (propios)** | ✅ | ✅ | ✅ | ❌ |
| **Adjuntar archivos (cualquiera)** | ✅ | ✅ | ❌ | ❌ |

---

### Clases de Permisos

#### 1. IsAdminOrBackOffice

```python
class IsAdminOrBackOffice(BasePermission):
    """Acceso completo para admin y backoffice"""
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return user.user_type_id in ['admin', 'back']
```

**Uso:**
- Crear/modificar estados y prioridades
- Asignar tickets
- Cambiar estados

---

#### 2. IsClientOwnerOrStaff

```python
class IsClientOwnerOrStaff(BasePermission):
    """Clientes ven solo sus tickets, staff ve todo"""

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False

        # Admin y back tienen acceso completo
        if user.is_superuser or user.user_type_id in ['admin', 'back']:
            return True

        # Clientes solo pueden hacer GET (leer)
        if user.user_type_id == 'client':
            return request.method in SAFE_METHODS  # GET, HEAD, OPTIONS

        return False

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Cliente solo puede ver tickets de su contacto (por email)
        if user.user_type_id == 'client':
            return obj.contact.email == user.email

        return False
```

**Características:**
- ✅ Clientes autenticados pueden hacer GET
- ❌ Clientes NO pueden hacer POST, PATCH, PUT, DELETE
- ✅ Filtrado automático por email en `get_queryset()`
- ✅ Validación adicional en `has_object_permission()`

---

#### 3. CanAttachFiles

```python
class CanAttachFiles(BasePermission):
    """Permite adjuntar archivos según permisos"""

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Admin y backoffice: todos los tickets
        if user.is_superuser or user.user_type_id in ['admin', 'back']:
            return True

        # Cliente: solo sus propios tickets
        if user.user_type_id == 'client':
            return obj.contact.email == user.email

        return False
```

---

## Tipos de Usuario

**Archivo:** [users/management/commands/populate_user_data.py](users/management/commands/populate_user_data.py)

### 1. Admin (admin)

```json
{
  "id": "admin",
  "name": "Administrador",
  "description": "Usuario con acceso completo al sistema",
  "permissions": {
    "products": ["create", "read", "update", "delete"],
    "quotes": ["create", "read", "update", "delete"],
    "tickets": ["create", "read", "update", "delete", "assign"],
    "contacts": ["create", "read", "update", "delete"],
    "users": ["create", "read", "update", "delete"],
    "reports": ["read"]
  }
}
```

---

### 2. BackOffice (back)

```json
{
  "id": "back",
  "name": "Back Office",
  "description": "Usuario de backoffice con permisos de gestión",
  "permissions": {
    "products": ["read"],
    "quotes": ["create", "read", "update"],
    "tickets": ["create", "read", "update", "assign"],
    "contacts": ["create", "read", "update"],
    "users": ["read"],
    "reports": ["read"]
  }
}
```

---

### 3. Cliente (client) ⭐ NUEVO

```json
{
  "id": "client",
  "name": "Cliente",
  "description": "Distribuidora con acceso limitado para ver sus tickets",
  "permissions": {
    "tickets": ["read_own", "attach_files"]
  }
}
```

**Características:**
- ✅ Creado automáticamente cuando una distribuidora genera un ticket desde la web
- ✅ Solo puede ver sus propios tickets (filtrado por email de la distribuidora)
- ✅ Puede adjuntar documentos (fotos de productos defectuosos, facturas, etc.)
- ❌ No puede modificar, crear ni eliminar tickets
- ❌ No puede ver tickets de otras distribuidoras

---

## Configuración

### 1. Variables de Entorno

Agregar al archivo `.env`:

```env
# === EMAILS ===
# Para desarrollo: usa console backend (emails en terminal)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# Para producción: usa SMTP
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=tu_email@gmail.com
EMAIL_HOST_PASSWORD=tu_app_password

# === INFORMACIÓN DEL NEGOCIO ===
BUSINESS_EMAIL=ventas@laqq.com
BUSINESS_NAME=LAQQ
BUSINESS_PHONE=+54 11 1234-5678
BUSINESS_ADDRESS=Calle Falsa 123, CABA
DEFAULT_FROM_NAME=LAQQ System
DEFAULT_FROM_EMAIL=laqq@gmail.com

# === PORTAL DEL CLIENTE ===
# IMPORTANTE: Esta URL debe apuntar al FRONTEND, no al backend
# Esta es la URL que recibirán las distribuidoras en el email
CLIENT_PORTAL_URL=http://localhost:3000/portal-cliente

# En producción sería algo como:
# CLIENT_PORTAL_URL=https://portal.laqq.com/portal-cliente
```

---

### 2. Configuración en settings.py

**Archivo:** [config/settings.py:258-269](config/settings.py#L258-L269)

```python
# Email configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')

# Business information
DEFAULT_FROM_NAME = config('DEFAULT_FROM_NAME', default='LAQQ System')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='laqq@gmail.com')
BUSINESS_EMAIL = config('BUSINESS_EMAIL', default='ventas@laqq.com')
BUSINESS_NAME = config('BUSINESS_NAME', default='LAQQ')
BUSINESS_PHONE = config('BUSINESS_PHONE', default='')
BUSINESS_ADDRESS = config('BUSINESS_ADDRESS', default='')
```

---

### 3. Comando de Inicialización

```bash
python manage.py populate_user_data
```

Este comando crea:
- ✅ Tipo de usuario: `admin`
- ✅ Tipo de usuario: `back`
- ✅ Tipo de usuario: `client` ⭐ NUEVO
- ✅ Estados de usuario: `active`, `inactive`, `suspended`

---

## Testing Manual

### Paso 1: Crear un Contacto (Distribuidora)

**POST** `/contacts/list/`

```json
{
  "company_name": "Distribuidora Médica del Sur SA",
  "first_name": "María",
  "last_name": "González",
  "email": "compras@distmedsur.com.ar",
  "phone": "011-4567-8900",
  "state": "new"
}
```

---

### Paso 2: Crear Ticket (dispara todo el flujo)

**POST** `/tickets/`

```json
{
  "contact": "UUID_DEL_CONTACTO",
  "product_name": "Pipeta Automática 100ml",
  "description": "La pipeta no dispensa el volumen correcto. Al intentar dispensar 100ml, solo dispensa aproximadamente 85ml. Necesitamos calibración o reemplazo urgente."
}
```

**Resultado automático:**
1. ✅ Se crea ticket `T-2025-00001`
2. ✅ Se verifica si existe usuario con `compras@distmedsur.com.ar`
3. ✅ Como no existe, se crea usuario `compras` con password random
4. ✅ Se envían 2 emails (a la distribuidora + al backoffice de LAQQ)

**Ver credenciales:** Mirá la consola donde tenés `python manage.py runserver`

---

### Paso 3: Login como Distribuidora

**POST** `/users/token/`

```json
{
  "username": "compras",
  "password": "LA_PASSWORD_DEL_EMAIL"
}
```

---

### Paso 4: Ver Tickets (solo los de la distribuidora)

**GET** `/tickets/`

**Headers:**
```
Authorization: Bearer TOKEN_DE_LA_DISTRIBUIDORA
```

**Resultado:** Solo ves los tickets con email `compras@distmedsur.com.ar` (los de tu distribuidora)

---

### Paso 5: Intentar Modificar (debe fallar)

**PATCH** `/tickets/UUID/`

```json
{
  "description": "Intento cambiar"
}
```

**Resultado:** ❌ 403 Forbidden (distribuidoras no pueden modificar tickets, solo el backoffice de LAQQ)

---

### Paso 6: Adjuntar Archivo (debe funcionar)

**POST** `/tickets/UUID/attach_file/`

```json
{
  "file_name": "foto_pipeta_defectuosa.jpg",
  "content_type": "image/jpeg",
  "data": "base64_data..."
}
```

**Resultado:** ✅ Success (distribuidoras pueden adjuntar fotos, facturas, documentos a sus tickets)

---

### Paso 7: Crear Segundo Ticket con Mismo Email

**POST** `/tickets/`

```json
{
  "contact": "MISMO_CONTACTO",
  "product_name": "Balanza Analítica 0.1mg",
  "description": "La balanza no calibra correctamente y muestra valores inconsistentes"
}
```

**Resultado:** ✅ Se crea ticket #T-2025-00002 pero **NO se crea otro usuario** (detecta que la distribuidora ya tiene cuenta)

---

## Tests Automatizados

**Archivo:** [tickets/tests.py](tickets/tests.py)

Se agregaron **14 tests nuevos** específicos para el portal del cliente:

### Cobertura de Tests

✅ **Creación de usuario automática** (3 tests)
- Crear ticket genera usuario con credenciales
- Ticket con email existente NO crea usuario duplicado
- Username se genera correctamente del email

✅ **Envío de emails** (2 tests)
- Email al cliente contiene credenciales
- Email al negocio contiene info del ticket

✅ **Permisos de distribuidoras** (4 tests)
- Distribuidora solo ve sus propios tickets
- Distribuidora NO puede ver tickets de otras distribuidoras
- Distribuidora NO puede modificar tickets
- Distribuidora NO puede eliminar tickets

✅ **Adjuntar archivos** (3 tests)
- Distribuidora puede adjuntar a sus propios tickets
- Distribuidora NO puede adjuntar a tickets de otras
- Admin LAQQ puede adjuntar a cualquier ticket

✅ **Admin/BackOffice** (2 tests)
- Admin ve todos los tickets
- BackOffice puede gestionar todos los tickets

### Ejecutar Tests

```bash
# Todos los tests de tickets (incluye portal del cliente)
python manage.py test tickets

# Solo tests del portal del cliente
python manage.py test tickets.tests.ClientPortalTestCase

# Con más detalle
python manage.py test tickets --verbosity=2
```

---

## Seguridad

### 1. Passwords Seguras

✅ Longitud mínima: 12 caracteres
✅ Mezcla de mayúsculas, minúsculas, números y símbolos
✅ Generación con `secrets` (criptográficamente seguro)
✅ Orden aleatorio para evitar patrones

---

### 2. Aislamiento de Datos

✅ Distribuidoras solo ven tickets con su email corporativo
✅ Filtrado automático en `get_queryset()`
✅ Validación adicional en `has_object_permission()`
✅ No se revelan tickets de otras distribuidoras (404, no 403)

---

### 3. Autenticación

✅ JWT tokens con expiración
✅ Tokens separados por tipo de usuario
✅ No se permite escalación de privilegios

---

### 4. Emails

✅ Templates HTML y texto plano
✅ Credenciales solo en primer ticket
✅ No se mandan passwords en emails subsecuentes
✅ Links seguros al portal

---

## Próximas Mejoras

Funcionalidades que podrían agregarse:

1. **Reset de password:** Permitir a las distribuidoras cambiar su contraseña
2. **Notificaciones:** Enviar email automático cuando LAQQ actualiza el estado del ticket
3. **Comentarios:** Sistema de chat entre distribuidora y técnicos de LAQQ
4. **Adjuntos múltiples:** Permitir más de un archivo por ticket (fotos, facturas, documentación)
5. **Historial:** Ver todos los cambios y actualizaciones del ticket
6. **Satisfacción:** Encuesta de satisfacción cuando se cierra el ticket
7. **Portal web:** Interfaz visual para distribuidoras (actualmente solo API)
8. **Vinculación con pedidos:** Relacionar tickets con pedidos/facturas de compra

---

## Archivos Modificados/Creados

### Nuevos Archivos
- ✅ [tickets/utils.py](tickets/utils.py) - Generación de username y password
- ✅ [tickets/emails.py](tickets/emails.py) - Sistema de emails
- ✅ [tickets/permissions.py](tickets/permissions.py) - Permisos por rol
- ✅ [tickets/templates/emails/ticket_business.html](tickets/templates/emails/ticket_business.html) - Template HTML negocio
- ✅ [tickets/templates/emails/ticket_business.txt](tickets/templates/emails/ticket_business.txt) - Template texto negocio
- ✅ [tickets/templates/emails/ticket_customer.html](tickets/templates/emails/ticket_customer.html) - Template HTML cliente
- ✅ [tickets/templates/emails/ticket_customer.txt](tickets/templates/emails/ticket_customer.txt) - Template texto cliente
- ✅ [users/management/commands/populate_user_data.py](users/management/commands/populate_user_data.py) - Comando inicialización

### Archivos Modificados
- ✅ [tickets/serializers.py](tickets/serializers.py) - Lógica de creación de usuario
- ✅ [tickets/views.py](tickets/views.py) - Filtrado por rol y permisos
- ✅ [tickets/tests.py](tickets/tests.py) - 14 tests adicionales
- ✅ [config/settings.py](config/settings.py) - Configuración de emails

---

## Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│  Distribuidora (sin login) completa formulario web LAQQ    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  POST /tickets/                                             │
│  - contact: UUID (distribuidora)                            │
│  - product_name: "Pipeta Automática 100ml"                  │
│  - description: "No dispensa volumen correcto..."           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Sistema verifica: ¿Existe usuario con contact.email?      │
└─────┬─────────────────────────────────────────────┬─────────┘
      │ NO existe                            SÍ existe │
      ▼                                               ▼
┌─────────────────────────┐           ┌──────────────────────┐
│ 1. Generar username     │           │ Usar usuario         │
│    (del email)          │           │ existente            │
│ 2. Generar password     │           │                      │
│    (random segura)      │           │ NO crear otro        │
│ 3. Crear User con       │           └──────────┬───────────┘
│    tipo 'client'        │                      │
└───────────┬─────────────┘                      │
            │                                    │
            └──────────────┬─────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Crear ServiceTicket                                        │
│  - ticket_number: T-2025-00001                              │
│  - state: new                                               │
│  - priority: medium                                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Enviar 2 emails:                                           │
│  1. Al cliente: con credenciales + info ticket             │
│  2. Al negocio: notificación de nuevo ticket               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Distribuidora recibe email y accede al portal             │
│  - POST /users/token/ (login con credenciales del email)   │
│  - GET /tickets/ (ver solo tickets de su empresa)          │
│  - POST /tickets/{id}/attach_file/ (adjuntar fotos/docs)   │
└─────────────────────────────────────────────────────────────┘
```

---

**Autor:** Claude Code
**Última actualización:** 2025-12-23
**Tests:** 14/14 pasando ✅
**Commit:** feat: Add client portal with automatic user creation for tickets
