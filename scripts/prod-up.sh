#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT/docker-compose.prod.yml"

echo "[prod] Levantando stack en modo detached"
docker compose -f "$COMPOSE_FILE" up -d --build
