#!/bin/bash

set -e  # detener si algo falla

echo "========================================"
echo "  LAQQ - Docker Deployment"
echo "========================================"
echo

# --- verificar docker ---
if ! docker info >/dev/null 2>&1; then
    echo "[ERROR] Docker no está corriendo. Inícialo y reintenta."
    exit 1
fi

echo "[OK] Docker está corriendo"
echo

# --- determinar modo ---
MODE="$1"

if [[ -z "$MODE" ]]; then
    echo "Selecciona el modo de deployment:"
    echo "  1. Desarrollo  - Hot reload, DEBUG=True"
    echo "  2. Producción  - Gunicorn, DEBUG=False"
    echo
    read -rp "Ingresa tu opción [1-2]: " CHOICE

    if [[ "$CHOICE" == "1" ]]; then
        MODE="dev"
    elif [[ "$CHOICE" == "2" ]]; then
        MODE="prod"
    else
        echo "[ERROR] Opción inválida"
        exit 1
    fi
fi

# normalizar modo
if [[ "$MODE" == "1" || "$MODE" == "development" ]]; then MODE="dev"; fi
if [[ "$MODE" == "2" || "$MODE" == "production" ]]; then MODE="prod"; fi

# validar modo
if [[ "$MODE" != "dev" && "$MODE" != "prod" ]]; then
    echo "[ERROR] Modo inválido: $MODE"
    echo "Uso: ./deploy.sh [dev|prod]"
    exit 1
fi

echo
echo "========================================"
if [[ "$MODE" == "dev" ]]; then
    echo "  MODO: DESARROLLO"
    echo "  - Hot reload"
    echo "  - Datos de prueba"
    echo "  - Django dev server"
else
    echo "  MODO: PRODUCCIÓN"
    echo "  - Gunicorn"
    echo "  - Sin hot reload"
fi
echo "========================================"
echo

# seleccionar docker-compose correspondiente
if [[ "$MODE" == "dev" ]]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    ENV_NAME="Development"
else
    COMPOSE_FILE="docker-compose.yml"
    ENV_NAME="Production"
fi

# crear archivo .env si no existe
if [[ ! -f ".env" ]]; then
    echo "[INFO] Creando archivo .env desde .env.example..."
    cp .env.example .env
    echo "[OK] Archivo .env creado"
    echo
fi

# bajar contenedores previos
echo "Deteniendo contenedores anteriores..."
docker compose -f "$COMPOSE_FILE" down -v || true

echo
echo "Construyendo imágenes..."
docker compose -f "$COMPOSE_FILE" build

echo
echo "Iniciando servicios..."
docker compose -f "$COMPOSE_FILE" up -d

echo
echo "Esperando inicialización..."
if [[ "$MODE" == "dev" ]]; then
    echo "[Migraciones + Seed Data + Permisos + Superuser]"
else
    echo "[Migraciones + Permisos + Superuser + Collectstatic]"
fi
echo
sleep 15

echo
echo "========================================"
echo "   $ENV_NAME Deployment Completado!"
echo "========================================"
echo
echo "   API:     http://localhost:8000"
echo "   Admin:   http://localhost:8000/admin/"
echo "   Swagger: http://localhost:8000/swagger/"
echo "   DB:      localhost:5432"
echo
echo "   ---- Credenciales Admin ----"
echo "   Email:    laqq@gmail.com"
echo "   Password: laqq"
echo
if [[ "$MODE" == "prod" ]]; then
    echo "   [!] IMPORTANTE: Cambia estas credenciales en producción real"
    echo
fi

echo "========================================"
echo
echo "Comandos útiles:"
echo "  - Ver logs:    docker compose -f $COMPOSE_FILE logs -f"
echo "  - Detener:     docker compose -f $COMPOSE_FILE down"
echo "  - Reiniciar:   docker compose -f $COMPOSE_FILE restart"
if [[ "$MODE" == "dev" ]]; then
    echo "  - Shell:       docker compose -f $COMPOSE_FILE exec web bash"
fi
echo "  - Tests:       docker compose -f $COMPOSE_FILE exec web python manage.py test"
echo

exit 0
 
