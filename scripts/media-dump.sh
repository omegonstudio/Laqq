#!/usr/bin/env bash
# ==============================================================
# scripts/media-dump.sh
# Backup del volumen de archivos/media (imágenes y adjuntos) a un
# archivo .tar.gz. Complementa scripts/db-dump.sh (que respalda solo
# la base de datos). Ambos juntos = backup completo de datos.
#
# Los archivos subidos (Attachment.file) viven en el volumen Docker
# montado en /app/mediafiles (backend) y /var/www/media (frontend).
# La DB solo guarda la ruta; sin este backup se pierden las imágenes.
# ==============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ---------- Load .env (robusto: soporta espacios y quotes) ----------
if [ -f "$ROOT/.env" ]; then
    while IFS='=' read -r key rest || [ -n "$key" ]; do
        case "$key" in
            ''|\#*) continue ;;
        esac
        value="$(echo "$rest" | sed -e "s/^['\"]//" -e "s/['\"]$//" -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
        key="$(echo "$key" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
        export "$key=$value"
    done < "$ROOT/.env"
fi

# ---------- Defaults ----------
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUTPUT_DIR="$ROOT/backups"
OUTPUT_FILE="$OUTPUT_DIR/media_backup_${TIMESTAMP}.tar.gz"

# Contenedores backend por entorno (buscan el volumen montado en /app/mediafiles)
DEV_BACKEND_CONTAINER="laqq-backend-dev"
PROD_BACKEND_CONTAINER="laqq-backend"
MEDIA_MOUNT_DEST="/app/mediafiles"
BACKUP_IMAGE="alpine"

# ---------- Parse argument ----------
MODE="${1:-auto}"   # dev | prod | auto

usage() {
    echo "Uso: $0 [dev|prod|auto]"
    echo ""
    echo "  dev   → backup del volumen media del contenedor de desarrollo ($DEV_BACKEND_CONTAINER)"
    echo "  prod  → backup del volumen media del contenedor de producción  ($PROD_BACKEND_CONTAINER)"
    echo "  auto  → detecta automáticamente el contenedor en ejecución (default)"
    exit 1
}

# ---------- Detect environment ----------
if [ "$MODE" = "auto" ]; then
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${DEV_BACKEND_CONTAINER}$"; then
        MODE="dev"
    elif docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${PROD_BACKEND_CONTAINER}$"; then
        MODE="prod"
    else
        echo "[ERROR] No se encontró ninguno de los contenedores backend en ejecución:"
        echo "  dev:  $DEV_BACKEND_CONTAINER"
        echo "  prod: $PROD_BACKEND_CONTAINER"
        echo "  Levanta el stack primero (scripts/dev-up.sh o scripts/prod-up.sh)."
        exit 1
    fi
fi

# ---------- Resolve container y volumen montado en /app/mediafiles ----------
case "$MODE" in
    dev)  CONTAINER="$DEV_BACKEND_CONTAINER" ;;
    prod) CONTAINER="$PROD_BACKEND_CONTAINER" ;;
    *)    usage ;;
esac

echo "[media-dump] Contenedor: $CONTAINER"

if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${CONTAINER}$"; then
    echo "[ERROR] El contenedor '$CONTAINER' no está en ejecución."
    exit 1
fi

VOLUME="$(docker inspect "$CONTAINER" \
    -f "{{range .Mounts}}{{if eq .Destination \"${MEDIA_MOUNT_DEST}\"}}{{.Name}}{{end}}{{end}}")"

if [ -z "$VOLUME" ]; then
    echo "[ERROR] No se encontró ningún volumen montado en '$MEDIA_MOUNT_DEST' del contenedor '$CONTAINER'."
    docker inspect "$CONTAINER" --format '{{range .Mounts}}{{.Type}} {{.Name}} -> {{.Destination}}{{println}}{{end}}'
    exit 1
fi
echo "[media-dump] Volumen detectado: $VOLUME"

# ---------- Create output directory ----------
mkdir -p "$OUTPUT_DIR"

# ---------- Execute backup ----------
echo "[media-dump] Creando backup del volumen '$VOLUME' → $OUTPUT_FILE"
echo "  (uso el contenedor '$BACKUP_IMAGE' para volcar el volumen)"

# Asegurar imagen del helper (solo la trae si no existe localmente)
if ! docker image inspect "$BACKUP_IMAGE" &>/dev/null; then
    echo "[media-dump] Descargando imagen helper '$BACKUP_IMAGE'..."
    docker pull "$BACKUP_IMAGE"
fi

docker run --rm \
    -v "$VOLUME":/data:ro \
    -v "$OUTPUT_DIR":/backup \
    "$BACKUP_IMAGE" \
    sh -c "tar czf /backup/$(basename "$OUTPUT_FILE") -C /data . && echo DONE"

# ---------- Verify backup ----------
if [ -f "$OUTPUT_FILE" ]; then
    FILES=$(tar tzf "$OUTPUT_FILE" 2>/dev/null | wc -l | tr -d ' ')
    SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo "[media-dump] ✅ Backup completado: ${SIZE} — ${FILES} entradas (archivos/carpetas)"
    echo "  → $OUTPUT_FILE"
    echo ""
    echo "  Ver contenido (primeras entradas):"
    tar tzf "$OUTPUT_FILE" 2>/dev/null | head -10 | sed 's/^/    /'
    echo ""
    echo "  Para restaurar este volumen en otro ambiente:"
    echo "    docker run --rm \\"
    echo "      -v $VOLUME:/data \\"
    echo "      -v $OUTPUT_DIR:/backup \\"
    echo "      $BACKUP_IMAGE sh -c 'tar xzf /backup/$(basename "$OUTPUT_FILE") -C /data && echo OK'"
    echo ""
    echo "  IMPORTANTE: guarda también una copia de este archivo FUERA del droplet"
    echo "  (scp/cloud/otro host). Nota: sin el dump de la DB (scripts/db-dump.sh)"
    echo "  este backup por sí solo no restaura las relaciones en la librería."
else
    echo "[media-dump] ❌ Error: no se generó el archivo de backup."
    exit 1
fi
