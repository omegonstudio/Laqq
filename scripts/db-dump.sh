#!/usr/bin/env bash
# ==============================================================
# scripts/db-dump.sh
# Dump all tables of the PostgreSQL database to a .sql file.
# Works with Docker (dev / prod) and direct local connection.
# ==============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ---------- Load .env (robusto: soporta espacios y quotes) ----------
if [ -f "$ROOT/.env" ]; then
    while IFS='=' read -r key rest || [ -n "$key" ]; do
        # Ignorar líneas vacías o comentarios
        case "$key" in
            ''|\#*) continue ;;
        esac
        # Quitar posibles quotes y espacios al inicio/final del valor
        value="$(echo "$rest" | sed -e "s/^['\"]//" -e "s/['\"]$//" -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
# Limpiar también la clave (por si hay espacios antes/después del =)
        key="$(echo "$key" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
        export "$key=$value"
    done < "$ROOT/.env"
fi

# ---------- Defaults ----------
DB_NAME="${DB_NAME:-laqq_db}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUTPUT_DIR="$ROOT/backups"
OUTPUT_FILE="$OUTPUT_DIR/dump_${DB_NAME}_${TIMESTAMP}.sql"

# ---------- Parse argument ----------
MODE="${1:-auto}"   # dev | prod | local | auto

usage() {
    echo "Uso: $0 [dev|prod|local|auto]"
    echo ""
    echo "  dev   → dump desde el contenedor Docker de desarrollo (laqq-db-dev)"
    echo "  prod  → dump desde el contenedor Docker de producción  (laqq-db)"
    echo "  local → dump desde PostgreSQL local (usa credenciales del .env)"
    echo "  auto  → detecta automáticamente el contenedor en ejecución (default)"
    exit 1
}

# ---------- Detect environment ----------
if [ "$MODE" = "auto" ]; then
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^laqq-db-dev$"; then
        MODE="dev"
    elif docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^laqq-db$"; then
        MODE="prod"
    elif command -v pg_dump &>/dev/null; then
        MODE="local"
    else
        echo "[ERROR] No se encontró contenedor Docker en ejecución ni pg_dump local."
        echo "  Asegúrate de levantar el stack primero (scripts/dev-up.sh o scripts/prod-up.sh)"
        echo "  o instala PostgreSQL localmente."
        exit 1
    fi
fi

# ---------- Create output directory ----------
mkdir -p "$OUTPUT_DIR"

# ---------- Execute dump ----------
case "$MODE" in
    dev)
        echo "[db-dump] Dump desde Docker DEV (laqq-db-dev) → $OUTPUT_FILE"
        PGPASSWORD="$DB_PASSWORD" docker compose \
            -f "$ROOT/docker-compose.dev.yml" \
            exec -T db \
            pg_dump \
                --username="$DB_USER" \
                --dbname="$DB_NAME" \
                --clean \
                --if-exists \
                --no-owner \
                --no-acl \
                --format=p \
        > "$OUTPUT_FILE"
        ;;
    prod)
        echo "[db-dump] Dump desde Docker PROD (laqq-db) → $OUTPUT_FILE"
        PGPASSWORD="$DB_PASSWORD" docker compose \
            -f "$ROOT/docker-compose.prod.yml" \
            exec -T db \
            pg_dump \
                --username="$DB_USER" \
                --dbname="$DB_NAME" \
                --clean \
                --if-exists \
                --no-owner \
                --no-acl \
                --format=p \
        > "$OUTPUT_FILE"
        ;;
    local)
        echo "[db-dump] Dump desde PostgreSQL local → $OUTPUT_FILE"
        PGPASSWORD="$DB_PASSWORD" pg_dump \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --username="$DB_USER" \
            --dbname="$DB_NAME" \
            --clean \
            --if-exists \
            --no-owner \
            --no-acl \
            --format=p \
        > "$OUTPUT_FILE"
        ;;
    *)
        usage
        ;;
esac

# ---------- Result ----------
if [ -f "$OUTPUT_FILE" ]; then
    LINES=$(wc -l < "$OUTPUT_FILE" | tr -d ' ')
    SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo "[db-dump] ✅ Dump completado: ${SIZE} — ${LINES} líneas"
    echo "  → $OUTPUT_FILE"
    echo ""
    echo "  Para restaurar (Docker dev):"
    echo "    docker compose -f docker-compose.dev.yml exec -T db psql -U $DB_USER -d $DB_NAME < $OUTPUT_FILE"
    echo ""
    echo "  Para restaurar (Docker prod):"
    echo "    docker compose -f docker-compose.prod.yml exec -T db psql -U $DB_USER -d $DB_NAME < $OUTPUT_FILE"
    echo ""
    echo "  Para restaurar (PostgreSQL local):"
    echo "    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < $OUTPUT_FILE"
else
    echo "[db-dump] ❌ Error: no se generó el archivo de dump."
    exit 1
fi
