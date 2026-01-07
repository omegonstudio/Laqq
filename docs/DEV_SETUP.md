# Guía rápida de desarrollo

URLs en desarrollo (docker compose):
- Backend API: http://localhost:8000
- Swagger: http://localhost:8000/swagger/
- Docs (alias): http://localhost:8000/docs/
- Redoc: http://localhost:8000/redoc/
- Admin: http://localhost:8000/admin/
- Frontend: http://localhost:${FRONTEND_PORT:-3000}

Credenciales seed (se crean automáticamente con `LOAD_SEED_DATA=true`):
- Admin: `admin` / `admin123`
- Backoffice: `backoffice` / `123456`

Comandos principales:
- Levantar: `./scripts/dev-up.sh`
- Logs: `./scripts/dev-logs.sh`
- Bajar + volúmenes: `./scripts/dev-down.sh`
- Producción local (detached): `./scripts/prod-up.sh` (usar solo con `.env` de prod)

Variables de entorno clave (`.env` desde `.env.example`):
- `ALLOWED_HOSTS`: incluye `0.0.0.0,localhost,127.0.0.1,backend`
- `FRONTEND_PORT`: puerto expuesto del frontend (default 3000)
- `VITE_API_BASE_URL`: base URL que usa el frontend (dev fuera de Docker: `http://localhost:8000`)
- `EMAIL_BACKEND`: en dev dejamos `django.core.mail.backends.console.EmailBackend`
- `EMAIL_*`: SMTP real si se quita el backend de consola
- `LOAD_SEED_DATA=true`: carga datos y superusuarios de ejemplo

Troubleshooting rápido:
- **/docs 404**: usa `/swagger/` o el alias `/docs/` (ya configurado).
- **DisallowedHost 0.0.0.0**: asegurá `ALLOWED_HOSTS` con `0.0.0.0` o `backend` en `.env`.
- **Error SMTP 535 (Gmail)**: en dev usamos backend de consola. Para SMTP real, generá password de app y configurá `EMAIL_*`.
- **Puerto 3000 ocupado**: setea `FRONTEND_PORT=3001` (o el que quieras) en `.env` y relanzá `dev-up`.
- **Permiso denied en entrypoint**: `chmod +x Backend/entrypoint.dev.sh Backend/entrypoint.sh`.

