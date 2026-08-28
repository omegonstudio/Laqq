#!/usr/bin/env bash

set -u

# ============================================================
# LAQQ - Recuperación de PostgreSQL comprometido
# ============================================================

COMPOSE="docker compose"
DB_CONTAINER="laqq-db"
DB_NAME="laqq_db"
BACKUP_DIR="$HOME/laqq-incident-backup"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DUMP_FILE="$BACKUP_DIR/laqq_db_${TIMESTAMP}.dump"

pause_confirm() {
    echo
    read -r -p "¿Continuar? [s/N]: " RESP
    [[ "$RESP" =~ ^[sS]$ ]]
}

step() {
    echo
    echo "============================================================"
    echo " $1"
    echo "============================================================"
    echo
}

# ------------------------------------------------------------
# 0. Comprobaciones iniciales
# ------------------------------------------------------------

step "0. COMPROBACIONES INICIALES"

echo "Directorio actual:"
pwd
echo

if [[ ! -f docker-compose.yml && ! -f compose.yml ]]; then
    echo "ERROR: No encuentro docker-compose.yml ni compose.yml."
    exit 1
fi

echo "Docker:"
docker --version
echo

echo "Docker Compose:"
$COMPOSE version
echo

echo "Contenedores actuales:"
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}'

if ! pause_confirm; then
    echo "Abortado."
    exit 0
fi

# ------------------------------------------------------------
# 1. Identificar volumen
# ------------------------------------------------------------

step "1. IDENTIFICAR VOLUMEN DE POSTGRES"

if ! docker inspect "$DB_CONTAINER" >/dev/null 2>&1; then
    echo "ERROR: No existe el contenedor $DB_CONTAINER."
    exit 1
fi

echo "Mounts de $DB_CONTAINER:"
docker inspect "$DB_CONTAINER" \
    --format '{{range .Mounts}}{{println "Tipo:" .Type "Nombre:" .Name "Origen:" .Source "Destino:" .Destination}}{{end}}'

echo
echo "IMPORTANTE: db_data NO debe eliminarse."

if ! pause_confirm; then
    echo "Abortado."
    exit 0
fi

# ------------------------------------------------------------
# 2. Usuarios y roles
# ------------------------------------------------------------

step "2. REVISAR USUARIOS Y ROLES DE POSTGRES"

echo "Usuarios:"
docker exec "$DB_CONTAINER" \
    psql -U postgres -d "$DB_NAME" \
    -c "SELECT usename, usesuper FROM pg_user;"

echo
echo "Roles:"
docker exec "$DB_CONTAINER" \
    psql -U postgres -d "$DB_NAME" \
    -c "SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin FROM pg_roles ORDER BY rolname;"

echo
echo "Si aparece un usuario inesperado (por ejemplo 'wog'), NO lo borres todavía."
echo "Primero queremos dejar constancia de su existencia."

if ! pause_confirm; then
    echo "Abortado."
    exit 0
fi

# ------------------------------------------------------------
# 3. Revisar conexiones
# ------------------------------------------------------------

step "3. REVISAR ACTIVIDAD DE POSTGRES"

docker exec "$DB_CONTAINER" \
    psql -U postgres -d "$DB_NAME" \
    -c "SELECT pid, usename, client_addr, application_name, state, backend_start FROM pg_stat_activity ORDER BY backend_start;"

if ! pause_confirm; then
    echo "Abortado."
    exit 0
fi

# ------------------------------------------------------------
# 4. Crear backup
# ------------------------------------------------------------

step "4. CREAR DUMP DE LAQQ_DB"

mkdir -p "$BACKUP_DIR"

echo "Backup:"
echo "$DUMP_FILE"
echo

docker exec "$DB_CONTAINER" \
    pg_dump -U postgres -Fc "$DB_NAME" > "$DUMP_FILE"

if [[ $? -ne 0 ]]; then
    echo
    echo "ERROR: El pg_dump falló."
    echo "NO se continuará."
    exit 1
fi

echo
echo "Dump creado correctamente:"
ls -lh "$DUMP_FILE"

if [[ ! -s "$DUMP_FILE" ]]; then
    echo
    echo "ERROR: El dump está vacío."
    exit 1
fi

echo
echo "Tamaño del backup:"
du -h "$DUMP_FILE"

if ! pause_confirm; then
    echo "Abortado. El backup quedó guardado."
    exit 0
fi

# ------------------------------------------------------------
# 5. Validar dump
# ------------------------------------------------------------

step "5. VALIDAR DUMP"

if command -v pg_restore >/dev/null 2>&1; then
    pg_restore -l "$DUMP_FILE" | head -50
else
    echo "pg_restore no está instalado en el host."
    echo "Mostrando información básica del archivo:"
    file "$DUMP_FILE"
fi

echo
echo "El backup debe existir y no estar vacío."

if ! pause_confirm; then
    echo "Abortado. El backup quedó guardado."
    exit 0
fi

# ------------------------------------------------------------
# 6. Evidencia del proceso sospechoso
# ------------------------------------------------------------

step "6. REVISAR /tmp/postgresql"

echo "Procesos:"
docker exec "$DB_CONTAINER" ps auxww | grep -E '[p]ostgresql|[/]tmp/postgresql' || true

echo
echo "Archivo:"
docker exec "$DB_CONTAINER" ls -lah /tmp/postgresql 2>/dev/null || true

echo
echo "Tipo:"
docker exec "$DB_CONTAINER" file /tmp/postgresql 2>/dev/null || true

echo
echo "Información del archivo:"
docker exec "$DB_CONTAINER" stat /tmp/postgresql 2>/dev/null || true

echo
echo "NO se elimina todavía."

if ! pause_confirm; then
    echo "Abortado. El backup quedó guardado."
    exit 0
fi

# ------------------------------------------------------------
# 7. Comprobar exposición 5433
# ------------------------------------------------------------

step "7. COMPROBAR PUERTO 5433"

echo "Puertos Docker:"
docker ps --format 'table {{.Names}}\t{{.Ports}}'

echo
echo "Socket 5433 en el host:"
sudo ss -lntp | grep ':5433' || echo "No hay proceso escuchando en 5433."

echo
echo "Si todavía aparece 5433, NO seguimos con la recreación."

if docker ps --format '{{.Names}} {{.Ports}}' | grep -E 'laqq-db.*5433|5433->5432' >/dev/null 2>&1; then
    echo
    echo "ATENCIÓN: PostgreSQL sigue publicado en 5433."
    echo
    echo "Editá manualmente el compose y eliminá:"
    echo
    echo '  ports:'
    echo '    - "5433:5432"'
    echo
    echo "Después volvé a ejecutar este script."
    exit 1
fi

if ! pause_confirm; then
    echo "Abortado."
    exit 0
fi

# ------------------------------------------------------------
# 8. Recrear DB SIN eliminar volumen
# ------------------------------------------------------------

step "8. RECREAR CONTENEDOR DE POSTGRES"

echo "Se ejecutará:"
echo
echo "  docker compose up -d --force-recreate db"
echo
echo "Esto NO utiliza -v."
echo "El volumen db_data NO será eliminado."

if ! pause_confirm; then
    echo "Abortado."
    exit 0
fi

$COMPOSE up -d --force-recreate db

if [[ $? -ne 0 ]]; then
    echo
    echo "ERROR recreando PostgreSQL."
    exit 1
fi

echo
echo "Estado:"
$COMPOSE ps db

if ! pause_confirm; then
    echo "Abortado."
    exit 0
fi

# ------------------------------------------------------------
# 9. Esperar healthcheck
# ------------------------------------------------------------

step "9. ESPERAR A QUE POSTGRES ESTÉ HEALTHY"

for i in {1..30}; do
    STATUS="$(docker inspect -f '{{.State.Health.Status}}' "$DB_CONTAINER" 2>/dev/null || echo unknown)"

    echo "Intento $i/30 -> $STATUS"

    if [[ "$STATUS" == "healthy" ]]; then
        break
    fi

    sleep 2
done

echo
docker inspect -f 'Estado: {{.State.Status}} | Health: {{.State.Health.Status}}' "$DB_CONTAINER"

if ! pause_confirm; then
    echo "Abortado."
    exit 0
fi

# ------------------------------------------------------------
# 10. Confirmar datos
# ------------------------------------------------------------

step "10. VERIFICAR QUE LA BASE SIGUE EXISTIENDO"

docker exec "$DB_CONTAINER" \
    psql -U postgres -d "$DB_NAME" \
    -c "SELECT current_database(), current_user, now();"

echo
echo "Tablas:"
docker exec "$DB_CONTAINER" \
    psql -U postgres -d "$DB_NAME" \
    -c '\dt' | head -60

if ! pause_confirm; then
    echo "Abortado."
    exit 0
fi

# ------------------------------------------------------------
# 11. Verificar que 5433 NO está expuesto
# ------------------------------------------------------------

step "11. VERIFICACIÓN FINAL DE EXPOSICIÓN"

echo "Docker:"
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'

echo
echo "Host:"
sudo ss -lntp | grep ':5433' || echo "OK: 5433 no está escuchando en el host."

echo
echo "Laqq DB:"
docker exec "$DB_CONTAINER" \
    psql -U postgres -d "$DB_NAME" \
    -c "SELECT version();"

# ------------------------------------------------------------
# 12. Estado del posible miner
# ------------------------------------------------------------

step "12. REVISAR NUEVAMENTE /tmp/postgresql"

echo "Procesos sospechosos:"
docker exec "$DB_CONTAINER" ps auxww | grep -E '[p]ostgresql|[/]tmp/postgresql' || true

echo
echo "Archivo sospechoso:"
docker exec "$DB_CONTAINER" ls -lah /tmp/postgresql 2>/dev/null || echo "No existe /tmp/postgresql."

echo
echo "============================================================"
echo " RECUPERACIÓN BÁSICA COMPLETADA"
echo "============================================================"
echo
echo "Backup:"
echo "  $DUMP_FILE"
echo
echo "IMPORTANTE:"
echo "  - No se eliminó db_data."
echo "  - No se ejecutó docker compose down -v."
echo "  - PostgreSQL ya no debería estar publicado en 5433."
echo "  - Las credenciales todavía DEBEN rotarse."
echo "  - El compromiso debe investigarse aunque el miner haya desaparecido."
echo