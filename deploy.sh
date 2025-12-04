#!/bin/bash

set -e  # Exit on error

echo "========================================"
echo "  LAQQ - Docker Deployment"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "[ERROR] Docker is not running. Please start Docker first."
    exit 1
fi

echo "[OK] Docker is running"
echo ""

# Determine mode (dev or prod)
MODE=$1

if [ -z "$MODE" ]; then
    echo "Select deployment mode:"
    echo ""
    echo "  1. Development  - Hot reload, test data, DEBUG=True"
    echo "  2. Production   - Gunicorn, optimized, DEBUG=False"
    echo ""
    read -p "Enter your option [1-2]: " choice

    case $choice in
        1)
            MODE="dev"
            ;;
        2)
            MODE="prod"
            ;;
        *)
            echo "[ERROR] Invalid option: $choice"
            exit 1
            ;;
    esac
fi

# Normalize MODE
case $MODE in
    development)
        MODE="dev"
        ;;
    production)
        MODE="prod"
        ;;
    1)
        MODE="dev"
        ;;
    2)
        MODE="prod"
        ;;
esac

# Validate MODE
if [ "$MODE" != "dev" ] && [ "$MODE" != "prod" ]; then
    echo "[ERROR] Invalid mode: $MODE"
    echo "Usage: ./deploy.sh [dev|prod]"
    exit 1
fi

echo ""
echo "========================================"
if [ "$MODE" == "dev" ]; then
    echo "  MODE: DEVELOPMENT"
    echo "  - Hot reload enabled"
    echo "  - Pre-loaded test data"
    echo "  - Django development server"
else
    echo "  MODE: PRODUCTION"
    echo "  - Gunicorn as WSGI server"
    echo "  - Optimized for performance"
    echo "  - No hot reload"
fi
echo "========================================"
echo ""

# Configure docker-compose file
if [ "$MODE" == "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    ENV_NAME="Development"
else
    COMPOSE_FILE="docker-compose.yml"
    ENV_NAME="Production"
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "[INFO] Creating .env file from .env.example..."
    cp .env.example .env
    echo "[OK] .env file created"
    echo ""
fi

# Stop previous containers and clean volumes
echo "Stopping previous containers..."
docker-compose -f $COMPOSE_FILE down -v 2>/dev/null || true

echo ""
echo "Building images..."
docker-compose -f $COMPOSE_FILE build

echo ""
echo "Starting services..."
docker-compose -f $COMPOSE_FILE up -d

echo ""
echo "Waiting for initialization..."
if [ "$MODE" == "dev" ]; then
    echo "[Migrations + Seed Data + Permissions + Superuser]"
else
    echo "[Migrations + Permissions + Superuser + Collectstatic]"
fi
echo ""
echo "You can see the progress with:"
echo "  docker-compose -f $COMPOSE_FILE logs -f web"
sleep 15

echo ""
echo "========================================"
echo "  $ENV_NAME Deployment Complete!"
echo "========================================"
echo ""
echo "  API:     http://localhost:8000"
echo "  Admin:   http://localhost:8000/admin/"
echo "  Swagger: http://localhost:8000/swagger/"
echo "  DB:      localhost:5433"
echo ""
echo "  ---- Admin Credentials ----"
echo "  Email:    laqq@gmail.com"
echo "  Password: laqq"
echo ""
if [ "$MODE" == "prod" ]; then
    echo "  [!] IMPORTANT: Change these credentials in real production"
    echo ""
fi
echo "========================================"
echo ""
echo "Useful commands:"
echo "  - View logs:    docker-compose -f $COMPOSE_FILE logs -f"
echo "  - Stop:         docker-compose -f $COMPOSE_FILE down"
echo "  - Restart:      docker-compose -f $COMPOSE_FILE restart"
if [ "$MODE" == "dev" ]; then
    echo "  - Shell:        docker-compose -f $COMPOSE_FILE exec web bash"
fi
echo "  - Tests:        docker-compose -f $COMPOSE_FILE exec web python manage.py test"
echo ""
