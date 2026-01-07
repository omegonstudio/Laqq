#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT/docker-compose.dev.yml"

echo "[dev] Deteniendo stack y limpiando volúmenes" 
docker compose -f "$COMPOSE_FILE" down -v
