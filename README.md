# LAQQ Monorepo (Backend + Frontend)

Monorepo listo para desarrollo y despliegue con Docker. Incluye backend Django + PostgreSQL y frontend Vite/React servidos detrás de Nginx.

## URLs en desarrollo
- Backend/API/Admin: http://localhost:8000
- Swagger: http://localhost:8000/swagger/
- Docs (alias Swagger): http://localhost:8000/docs/
- Redoc: http://localhost:8000/redoc/
- Frontend: http://localhost:${FRONTEND_PORT:-3000}

## Estructura
- `Backend/`: API Django REST + scripts existentes (`deploy.bat`/`deploy.sh`).
- `Frontend/`: Vite + React + Tailwind.
- `docker-compose.dev.yml`: stack de desarrollo (hot reload frontend/backend, Postgres).
- `docker-compose.prod.yml`: stack de producción con Nginx como reverse proxy (`/api` -> backend) y estáticos/media del backend.
- `scripts/`: helpers (`dev-up`, `dev-down`, `dev-logs`, `prod-up`, `prod-down`, `prod-logs`, `deploy-local`).
- `.github/workflows/deploy.yml`: CI/CD por SSH hacia el droplet.
- `env.example`: variables compartidas para ambos servicios.

## Requisitos
- Docker + Docker Compose v2
- Git
- (Opcional) Node 20+ y Python 3.11+ si querés correr fuera de Docker

## Variables de entorno (principalmente en `.env`)
| Variable | Descripción | Valor ejemplo |
| --- | --- | --- |
| `COMPOSE_PROJECT_NAME` | Prefijo de contenedores | `laqq` |
| `DJANGO_ENV` | `development` o `production` | `development` |
| `DEBUG` | Activar DEBUG en Django | `True` / `False` |
| `SECRET_KEY` | Clave Django | `cambiar-esto` |
| `ALLOWED_HOSTS` | Hosts permitidos (coma) | `localhost,127.0.0.1,0.0.0.0,backend` |
| `DB_NAME` | Nombre DB | `laqq_db` |
| `DB_USER` | Usuario DB | `postgres` |
| `DB_PASSWORD` | Password DB | `postgres` |
| `DB_HOST` | Host DB (en Docker `db`) | `db` |
| `DB_PORT` | Puerto DB | `5432` |
| `LOAD_SEED_DATA` | Cargar seed (TRUE en dev) | `true` / `false` |
| `EMAIL_BACKEND` | Backend de email | `django.core.mail.backends.console.EmailBackend` en dev |
| `EMAIL_*` | SMTP real si usás backend SMTP | `smtp.gmail.com`, etc |
| `BUSINESS_*` | Datos negocio | `ventas@...` |
| `FRONTEND_PORT` | Puerto expuesto del frontend | `3000` |
| `VITE_API_BASE_URL` | Base URL del frontend hacia la API | `http://localhost:8000` (dev host) / `/api` (build prod) |

## Uso en desarrollo
```bash
cp env.example .env
# opción 1: compose directo
docker compose -f docker-compose.dev.yml up --build
# opción 2: script helper
./scripts/dev-up.sh
```
- Frontend: http://localhost:${FRONTEND_PORT:-3000} (hot reload)
- Backend/API/Admin: http://localhost:8000
- Postgres: localhost:5433

Para apagar y limpiar volúmenes:
```bash
./scripts/dev-down.sh
```
Logs:
```bash
./scripts/dev-logs.sh
```

## Uso en producción (local o droplet)
1) Completar `.env` con valores reales (`DEBUG=False`, `DJANGO_ENV=production`, `ALLOWED_HOSTS=<tu-dominio>` y credenciales reales).
2) Levantar:
```bash
./scripts/prod-up.sh
```
- Nginx escucha en puerto 80 y proxy: `/api` -> backend, `/static|/media` servidos desde volúmenes.
- Backend expone gunicorn en 8000 dentro de la red interna.

Para detener:
```bash
./scripts/prod-down.sh
```
Logs:
```bash
./scripts/prod-logs.sh
```

## CI/CD en DigitalOcean
Workflow `.github/workflows/deploy.yml`:
- Se ejecuta en push a `main` o manual (`workflow_dispatch`).
- Usa secretos: `DROPLET_HOST`, `DROPLET_USER`, `SSH_PRIVATE_KEY`, `DEPLOY_DIR`.
- Pasos remotos: `git pull`, `docker compose -f docker-compose.prod.yml up -d --build`, migraciones, limpieza de imágenes y rollback simple al commit previo si falla.

## Scripts nativos legacy
`Backend/deploy.sh` y `Backend/deploy.bat` ahora llaman a los `docker-compose.*` de la raíz para levantar TODO el stack.

## Integraciones
- Consulta `docs/integrations.md` para mapa de servicios externos, variables y pasos de prueba por entorno.

## Cómo inicializar este monorepo en Git y empujar a GitHub
```bash
cd /home/titin/Documentos/omegon/00-OMEGON/00-proyectos/11-Laqq/Laqq
git init
# origen único del monorepo
git remote add origin git@github.com:omegonstudio/Laqq.git
# (historial previo de Backend/Frontend queda en los repos originales)
git add .
git commit -m "chore: bootstrap monorepo"
git branch -M main
git push -u origin main
```

## Troubleshooting
- Puertos en uso: cambia los mapeos en los compose (`8000/3000/5433`) o setea `FRONTEND_PORT` en `.env`.
- DisallowedHost con `0.0.0.0`: agrega `0.0.0.0` o `backend` a `ALLOWED_HOSTS`.
- Error SMTP 535 (Gmail) en dev: dejamos `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend` para no enviar correos reales. Para SMTP real, usa contraseña de aplicación.
- Dependencias frontend: si hay problemas con cache, borra el volumen `laqq-frontend-dev` (`docker volume ls | grep frontend && docker volume rm <volumen>`).
- Migraciones: usa `docker compose -f docker-compose.dev.yml exec backend python manage.py migrate`.
- Permisos de archivos en host Linux: monta con tu usuario si necesitás (`user: "${UID}:${GID}"` en el servicio backend/front).
- `DoesNotExist` en tickets `start/`, `resolve/`, `close/` o en creación de cotizaciones: los datos de referencia no están cargados. Corré los populate commands (ver abajo).

## Datos de referencia (estados, tipos, prioridades)

El entrypoint los carga automáticamente al levantar. Si usás una DB existente sin estos datos, correlos a mano:

```bash
docker compose -f docker-compose.dev.yml exec backend python manage.py populate_user_data
docker compose -f docker-compose.dev.yml exec backend python manage.py populate_ticket_data
docker compose -f docker-compose.dev.yml exec backend python manage.py populate_contact_data
docker compose -f docker-compose.dev.yml exec backend python manage.py populate_quote_data
```

Todos son idempotentes (seguros de correr múltiples veces). Crean:

| Comando | Datos |
|---------|-------|
| `populate_user_data` | UserType: `admin`, `back`, `client` · UserState: `active`, `inactive`, `suspended` |
| `populate_ticket_data` | TicketState: `new`, `open`, `in_progress`, `waiting_parts`, `resolved`, `closed` · TicketPriority: `low`, `medium`, `high`, `urgent` |
| `populate_contact_data` | ContactState: `new`, `in_progress`, `responded`, `closed` |
| `populate_quote_data` | QuoteType: `standard`, `express` · QuoteState: `pending`, `sent`, `confirmed`, `rejected`, `expired` |

Más detalles en `docs/DEV_SETUP.md`.
