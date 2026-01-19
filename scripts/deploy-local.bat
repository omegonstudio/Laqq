#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT/docker-compose.prod.yml"

echo "[deploy] Actualizando contenedores locales (modo prod)"
docker compose -f "$COMPOSE_FILE" pull || true
docker compose -f "$COMPOSE_FILE" up -d --build
