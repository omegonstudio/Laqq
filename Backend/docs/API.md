# API Documentation - LAQQ

## 📡 Base URL

```
Development: http://127.0.0.1:8000/api/
Production: https://your-domain.com/api/
```

## 🔑 Autenticación

Todos los endpoints (excepto `/auth/login/` y `/auth/refresh/`) requieren un token JWT válido.

### Headers Requeridos

```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

---

## 🔐 Autenticación

### Login

**Endpoint:** `POST /api/auth/login/`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": {
      "id": "uuid",
      "name": "administrador",
      "display_name": "Administrador"
    },
    "two_factor_enabled": false
  }
}
```

**Errors:**
- `400` - Credenciales inválidas
- `401` - Usuario inactivo

---

### Refresh Token

**Endpoint:** `POST /api/auth/refresh/`

**Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response 200:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

## 👥 Usuarios

### Listar Usuarios

**Endpoint:** `GET /api/users/`

**Query Parameters:**
- `page` (int) - Número de página
- `page_size` (int) - Items por página (default: 25)
- `search` (string) - Buscar por email, nombre o apellido
- `role` (uuid) - Filtrar por rol
- `is_active` (bool) - Filtrar por estado

**Response 200:**
```json
{
  "count": 100,
  "next": "http://127.0.0.1:8000/api/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "phone": "+1234567890",
      "role": {
        "id": "uuid",
        "name": "backoffice",
        "display_name": "BackOffice"
      },
      "is_active": true,
      "is_verified": true,
      "two_factor_enabled": false,
      "date_joined": "2025-11-12T10:30:00Z",
      "last_login": "2025-11-12T14:20:00Z"
    }
  ]
}
```

**Permissions Required:** `users_read`

---

### Crear Usuario

**Endpoint:** `POST /api/users/`

**Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1234567890",
  "role": "role-uuid-here"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "email": "newuser@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "full_name": "Jane Smith",
  "phone": "+1234567890",
  "role": {
    "id": "uuid",
    "name": "backoffice",
    "display_name": "BackOffice"
  },
  "is_active": true,
  "is_verified": false,
  "two_factor_enabled": false,
  "date_joined": "2025-11-12T15:00:00Z"
}
```

**Errors:**
- `400` - Email ya existe, datos inválidos
- `403` - Sin permisos para crear usuarios

**Permissions Required:** `users_create`

---

### Obtener Usuario

**Endpoint:** `GET /api/users/{id}/`

**Response 200:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "role": {
    "id": "uuid",
    "name": "administrador",
    "display_name": "Administrador"
  },
  "is_active": true,
  "is_verified": true,
  "two_factor_enabled": false,
  "date_joined": "2025-11-12T10:30:00Z",
  "last_login": "2025-11-12T14:20:00Z",
  "permissions": [
    {
      "id": "uuid",
      "codename": "users_create",
      "module": "users",
      "action": "create"
    }
  ]
}
```

**Permissions Required:** `users_read` o acceso a perfil propio

---

### Actualizar Usuario

**Endpoint:** `PUT /api/users/{id}/`

**Body:**
```json
{
  "first_name": "John Updated",
  "last_name": "Doe",
  "phone": "+0987654321",
  "role": "role-uuid-here",
  "is_active": true
}
```

**Response 200:** Usuario actualizado

**Errors:**
- `403` - Sin permisos
- `404` - Usuario no encontrado

**Permissions Required:** `users_update` o acceso a perfil propio

---

### Eliminar Usuario

**Endpoint:** `DELETE /api/users/{id}/`

**Response 204:** Usuario eliminado

**Errors:**
- `403` - Solo Administrador puede eliminar usuarios
- `404` - Usuario no encontrado

**Permissions Required:** `users_delete` (Solo Administrador)

---

### Perfil Actual

**Endpoint:** `GET /api/users/me/`

**Response 200:** Datos del usuario autenticado

---

### Actualizar Perfil Propio

**Endpoint:** `PUT /api/users/update_profile/`

**Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

**Response 200:** Perfil actualizado

---

### Cambiar Contraseña

**Endpoint:** `POST /api/users/change_password/`

**Body:**
```json
{
  "old_password": "OldPass123!",
  "new_password": "NewPass456!",
  "confirm_password": "NewPass456!"
}
```

**Response 200:**
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

**Errors:**
- `400` - Contraseña antigua incorrecta
- `400` - Las nuevas contraseñas no coinciden

---

### Resetear Contraseña (Admin)

**Endpoint:** `POST /api/users/{id}/reset_password/`

**Body:**
```json
{
  "new_password": "NewPass123!"
}
```

**Response 200:**
```json
{
  "message": "Contraseña reseteada exitosamente"
}
```

**Permissions Required:** `users_update` + Administrador

---

### Activar/Desactivar Usuario

**Endpoint:** `POST /api/users/{id}/toggle_active/`

**Response 200:**
```json
{
  "message": "Usuario activado/desactivado exitosamente",
  "is_active": true
}
```

**Permissions Required:** `users_update`

---

## 🔒 Two-Factor Authentication (2FA)

### Habilitar 2FA

**Endpoint:** `POST /api/users/enable_2fa/`

**Response 200:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "message": "Escanea el código QR con tu app de autenticación"
}
```

---

### Verificar 2FA

**Endpoint:** `POST /api/users/verify_2fa/`

**Body:**
```json
{
  "token": "123456"
}
```

**Response 200:**
```json
{
  "message": "2FA habilitado exitosamente"
}
```

**Errors:**
- `400` - Token inválido

---

### Deshabilitar 2FA

**Endpoint:** `POST /api/users/disable_2fa/`

**Body:**
```json
{
  "password": "YourPassword123!"
}
```

**Response 200:**
```json
{
  "message": "2FA deshabilitado exitosamente"
}
```

---

## 🔑 Roles

### Listar Roles

**Endpoint:** `GET /api/roles/`

**Response 200:**
```json
[
  {
    "id": "uuid",
    "name": "administrador",
    "display_name": "Administrador",
    "description": "Acceso total al sistema",
    "is_active": true,
    "permissions_count": 16,
    "created_at": "2025-11-12T10:00:00Z"
  },
  {
    "id": "uuid",
    "name": "backoffice",
    "display_name": "BackOffice",
    "description": "Gestión operativa",
    "is_active": true,
    "permissions_count": 15,
    "created_at": "2025-11-12T10:00:00Z"
  }
]
```

**Permissions Required:** `users_read`

---

### Obtener Rol

**Endpoint:** `GET /api/roles/{id}/`

**Response 200:**
```json
{
  "id": "uuid",
  "name": "administrador",
  "display_name": "Administrador",
  "description": "Acceso total al sistema",
  "is_active": true,
  "permissions": [
    {
      "id": "uuid",
      "codename": "users_create",
      "module": "users",
      "action": "create",
      "description": "Crear usuarios"
    }
  ],
  "created_at": "2025-11-12T10:00:00Z",
  "updated_at": "2025-11-12T10:00:00Z"
}
```

---

### Asignar Permiso a Rol

**Endpoint:** `POST /api/roles/{id}/assign_permission/`

**Body:**
```json
{
  "permission_id": "permission-uuid-here"
}
```

**Response 200:**
```json
{
  "message": "Permiso asignado exitosamente"
}
```

**Permissions Required:** Solo Administrador

---

### Remover Permiso de Rol

**Endpoint:** `POST /api/roles/{id}/remove_permission/`

**Body:**
```json
{
  "permission_id": "permission-uuid-here"
}
```

**Response 200:**
```json
{
  "message": "Permiso removido exitosamente"
}
```

**Permissions Required:** Solo Administrador

---

## 🔐 Permisos

### Listar Permisos

**Endpoint:** `GET /api/permissions/`

**Response 200:**
```json
[
  {
    "id": "uuid",
    "codename": "users_create",
    "module": "users",
    "module_display": "Gestión de Usuarios",
    "action": "create",
    "action_display": "Crear",
    "description": "Crear usuarios",
    "is_active": true
  }
]
```

---

### Permisos Agrupados por Módulo

**Endpoint:** `GET /api/permissions/by_module/`

**Response 200:**
```json
{
  "users": [
    {"id": "uuid", "codename": "users_create", "action": "create"},
    {"id": "uuid", "codename": "users_read", "action": "read"},
    {"id": "uuid", "codename": "users_update", "action": "update"},
    {"id": "uuid", "codename": "users_delete", "action": "delete"}
  ],
  "products": [...],
  "orders": [...],
  "clients": [...]
}
```

---

## ❌ Códigos de Error

| Código | Descripción |
|--------|-------------|
| `200` | Operación exitosa |
| `201` | Recurso creado |
| `204` | Operación exitosa sin contenido |
| `400` | Datos inválidos |
| `401` | No autenticado |
| `403` | Sin permisos |
| `404` | Recurso no encontrado |
| `500` | Error del servidor |

---

## 📝 Notas

- Todos los UUIDs son UUID v4
- Todas las fechas en formato ISO 8601
- Paginación default: 25 items por página
- Rate limiting: (a implementar)

---

**Última actualización:** 2025-11-12
