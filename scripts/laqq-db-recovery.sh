#!/usr/bin/env bash

set -u

# ============================================================
# LAQQ - Recuperación de PostgreSQL comprometido
# Recrea el contenedor SIN borrar db_data, cierra 5433,
# inspecciona /tmp y (con confirmación) elimina roles extra.
#
# Dump vs scripts/db-dump.sh:
#   db-dump.sh  → SQL plano (-Fp), --clean/--no-owner/--no-acl
#                 pensado para restore rutinario. NO incluye roles
#                 del cluster (wog/priv_esc no aparecen).
#   este script → custom (-Fc) + globals (--roles-only) para
#                 forense. Sin --no-acl. Usuario detectado en el
#                 contenedor (laqq_user o postgres). docker exec sin -t
#                 (el -T es de compose exec y docker exec no lo entiende).
# ============================================================

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

COMPOSE="docker compose"
COMPOSE_FILE=""
if [[ -f "$ROOT/docker-compose.prod.yml" ]]; then
    COMPOSE_FILE="$ROOT/docker-compose.prod.yml"
    COMPOSE="docker compose -f $COMPOSE_FILE"
elif [[ -f "$ROOT/docker-compose.yml" ]]; then
    COMPOSE_FILE="$ROOT/docker-compose.yml"
    COMPOSE="docker compose -f $COMPOSE_FILE"
elif [[ -f "$ROOT/compose.yml" ]]; then
    COMPOSE_FILE="$ROOT/compose.yml"
    COMPOSE="docker compose -f $COMPOSE_FILE"
fi

DB_CONTAINER="laqq-db"
DB_NAME="${DB_NAME:-laqq_db}"
DB_USER="${DB_USER:-}"
KEEP_ROLES="laqq_user postgres"
BACKUP_DIR="$HOME/laqq-incident-backup"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DUMP_FILE="$BACKUP_DIR/laqq_db_${TIMESTAMP}.dump"
GLOBALS_FILE="$BACKUP_DIR/pg_globals_${TIMESTAMP}.sql"

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

psql_db() {
    docker exec "$DB_CONTAINER" \
        psql -U "$DB_USER" -d "$DB_NAME" "$@"
}

detect_db_user() {
    local candidate
    for candidate in ${DB_USER:-} laqq_user postgres; do
        [[ -z "$candidate" ]] && continue
        if docker exec "$DB_CONTAINER" \
            psql -U "$candidate" -d "$DB_NAME" -Atqc 'SELECT 1' >/dev/null 2>&1; then
            echo "$candidate"
            return 0
        fi
    done
    return 1
}

# ------------------------------------------------------------
# 0. Comprobaciones iniciales
# ------------------------------------------------------------

step "0. COMPROBACIONES INICIALES"

echo "Directorio: $ROOT"
echo "Compose:    ${COMPOSE_FILE:-<no encontrado>}"
echo

if [[ -z "$COMPOSE_FILE" ]]; then
    echo "ERROR: No encuentro docker-compose.prod.yml ni docker-compose.yml."
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
echo "IMPORTANTE: db_data NO se elimina."

if ! pause_confirm; then
    echo "Abortado."
    exit 0
fi

# ------------------------------------------------------------
# 2. Detectar usuario y revisar roles
# ------------------------------------------------------------

step "2. REVISAR USUARIOS Y ROLES DE POSTGRES"

if ! DB_USER="$(detect_db_user)"; then
    echo "ERROR: No pude conectar con laqq_user ni postgres."
    echo "Probá a mano: docker exec -it $DB_CONTAINER psql -U laqq_user -d $DB_NAME"
    exit 1
fi

echo "Usuario de conexión: $DB_USER"
echo

echo "Usuarios:"
psql_db -c "SELECT usename, usesuper FROM pg_user;"

echo
echo "Roles:"
psql_db -c "SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin FROM pg_roles ORDER BY rolname;"

echo
echo "En este incidente esperamos laqq_user (app) y roles extra (wog, priv_esc)."
echo "Todavía NO se borran: primero dump + evidencia."

if ! pause_confirm; then
    echo "Abortado."
    exit 0
fi

# ------------------------------------------------------------
# 3. Revisar conexiones
# ------------------------------------------------------------

step "3. REVISAR ACTIVIDAD DE POSTGRES"

psql_db -c "SELECT pid, usename, datname, client_addr, application_name, state, backend_start FROM pg_stat_activity ORDER BY backend_start;"

if ! pause_confirm; then
    echo "Abortado."
    exit 0
fi

# ------------------------------------------------------------
# 4. Crear backup (custom + globals)
# ------------------------------------------------------------

step "4. CREAR DUMP DE LAQQ_DB Y ROLES DEL CLUSTER"

mkdir -p "$BACKUP_DIR"

echo "Dump de datos (custom -Fc, sin --no-acl):"
echo "  $DUMP_FILE"
echo "Dump de roles/globals (pg_dumpall --globals-only):"
echo "  $GLOBALS_FILE"
echo
echo "db-dump.sh genera SQL plano con --clean/--no-owner/--no-acl y NO"
echo "guarda roles del cluster. Este dump sí: sirve para forense y para"
echo "pg_restore. docker exec sin TTY evita corromper el formato custom."
echo

docker exec "$DB_CONTAINER" \
    pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "$DUMP_FILE"
DUMP_RC=$?

if [[ $DUMP_RC -ne 0 ]]; then
    echo
    echo "ERROR: El pg_dump de $DB_NAME falló (exit $DUMP_RC)."
    echo "NO se continuará."
    exit 1
fi

docker exec "$DB_CONTAINER" \
    pg_dumpall -U "$DB_USER" --globals-only > "$GLOBALS_FILE"
GLOBALS_RC=$?

if [[ $GLOBALS_RC -ne 0 ]]; then
    echo
    echo "ERROR: pg_dumpall --globals-only falló (exit $GLOBALS_RC)."
    echo "El dump de $DB_NAME quedó en $DUMP_FILE"
    exit 1
fi

echo
echo "Dumps creados:"
ls -lh "$DUMP_FILE" "$GLOBALS_FILE"

if [[ ! -s "$DUMP_FILE" ]]; then
    echo
    echo "ERROR: El dump de $DB_NAME está vacío."
    exit 1
fi

if ! pause_confirm; then
    echo "Abortado. El backup quedó guardado."
    exit 0
fi

# ------------------------------------------------------------
# 5. Validar dump
# ------------------------------------------------------------

step "5. VALIDAR DUMP"

echo "Archivos:"
ls -lh "$DUMP_FILE" "$GLOBALS_FILE"
echo

# El custom format empieza con PGDMP. Si no está, el dump está corrupto.
DUMP_MAGIC="$(head -c 5 "$DUMP_FILE" 2>/dev/null || true)"
if [[ "$DUMP_MAGIC" != "PGDMP" ]]; then
    echo "ERROR: $DUMP_FILE no parece un dump custom de Postgres (magic='$DUMP_MAGIC')."
    echo "NO se continuará."
    exit 1
fi
echo "Magic PGDMP: OK"
echo

TMP_RESTORE="/tmp/laqq_validate.dump"
TOC_FILE="$(mktemp)"
if command -v pg_restore >/dev/null 2>&1; then
    if ! pg_restore -l "$DUMP_FILE" > "$TOC_FILE"; then
        rm -f "$TOC_FILE"
        echo "ERROR: pg_restore -l falló. El dump no se puede leer."
        echo "NO se continuará."
        exit 1
    fi
else
    echo "pg_restore no está en el host. Copio el dump al contenedor y listo el TOC:"
    docker cp "$DUMP_FILE" "$DB_CONTAINER:$TMP_RESTORE"
    if ! docker exec "$DB_CONTAINER" pg_restore -l "$TMP_RESTORE" > "$TOC_FILE"; then
        docker exec "$DB_CONTAINER" rm -f "$TMP_RESTORE"
        rm -f "$TOC_FILE"
        echo "ERROR: pg_restore -l falló. El dump no se puede leer."
        echo "NO se continuará."
        exit 1
    fi
    docker exec "$DB_CONTAINER" rm -f "$TMP_RESTORE"
fi

head -50 "$TOC_FILE"
echo "..."
echo "Objetos en el TOC: $(wc -l < "$TOC_FILE")"
if ! grep -q 'TABLE DATA' "$TOC_FILE" && ! grep -q 'TABLE ' "$TOC_FILE"; then
    rm -f "$TOC_FILE"
    echo "ERROR: el dump no lista tablas. No sirve para un restore."
    echo "NO se continuará."
    exit 1
fi
rm -f "$TOC_FILE"

echo
echo "Roles capturados en globals (CREATE ROLE):"
grep -E '^CREATE ROLE ' "$GLOBALS_FILE" || echo "(no se encontraron CREATE ROLE)"

echo
echo "Si viste tablas (products, quotes, etc.) el dump está bien."
echo "priv_esc y wog en globals son evidencia; NO se restauran esos roles."

if ! pause_confirm; then
    echo "Abortado. El backup quedó guardado."
    exit 0
fi

# ------------------------------------------------------------
# 6. Evidencia del proceso sospechoso
# ------------------------------------------------------------

step "6. REVISAR /tmp/postgresql (ANTES de recrear)"

echo "Procesos:"
docker exec "$DB_CONTAINER" ps auxww | grep -E '[p]ostgresql|[/]tmp/postgresql' || true

echo
echo "Archivo:"
docker exec "$DB_CONTAINER" ls -lah /tmp/postgresql 2>/dev/null || echo "No existe /tmp/postgresql."

echo
echo "Tipo:"
docker exec "$DB_CONTAINER" file /tmp/postgresql 2>/dev/null || true

echo
echo "Información del archivo:"
docker exec "$DB_CONTAINER" stat /tmp/postgresql 2>/dev/null || true

echo
echo "NO se elimina a mano. Si está en la capa writable del contenedor,"
echo "desaparece al recrear (paso 8). El volume db_data no se toca."

if ! pause_confirm; then
    echo "Abortado. El backup quedó guardado."
    exit 0
fi

# ------------------------------------------------------------
# 7. Comprobar exposición 5433
# ------------------------------------------------------------

step "7. COMPROBAR PUERTO 5433"

echo "En el YAML ($COMPOSE_FILE):"
if grep -nE '5433:5432' "$COMPOSE_FILE"; then
    echo
    echo "ERROR: El compose TODAVÍA publica 5433:5432."
    echo "Editá $COMPOSE_FILE, sacá el bloque ports de db, y reejecutá."
    exit 1
fi
echo "OK: el YAML no publica 5433:5432."

echo
echo "Puertos Docker en ejecución:"
docker ps --format 'table {{.Names}}\t{{.Ports}}'

echo
echo "Socket 5433 en el host:"
sudo ss -lntp | grep ':5433' || echo "No hay proceso escuchando en 5433."

if docker ps --format '{{.Names}} {{.Ports}}' | grep -E 'laqq-db.*5433|5433->5432' >/dev/null 2>&1; then
    echo
    echo "El contenedor en ejecución TODAVÍA publica 5433 (compose viejo)."
    echo "El paso 8 (force-recreate) es el que cierra ese mapeo, usando el YAML actual."
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
echo "  $COMPOSE up -d --force-recreate db"
echo
echo "Esto NO utiliza -v."
echo "El volumen db_data NO será eliminado."
echo "Si el YAML ya no tiene 5433, el puerto queda cerrado."

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

if ! DB_USER="$(detect_db_user)"; then
    echo "ERROR: Postgres levantó pero no conecto con laqq_user/postgres."
    exit 1
fi
echo "Usuario de conexión: $DB_USER"

if ! pause_confirm; then
    echo "Abortado."
    exit 0
fi

# ------------------------------------------------------------
# 10. Confirmar datos
# ------------------------------------------------------------

step "10. VERIFICAR QUE LA BASE SIGUE EXISTIENDO"

psql_db -c "SELECT current_database(), current_user, now();"

echo
echo "Tablas:"
psql_db -c '\dt' | head -60

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
psql_db -c "SELECT version();"

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
echo "docker top (no debería aparecer /tmp/postgresql ni systemd):"
docker top "$DB_CONTAINER" aux | head -30

if ! pause_confirm; then
    echo "Abortado. El backup quedó guardado. Los roles extra siguen en el cluster."
    exit 0
fi

# ------------------------------------------------------------
# 13. Eliminar roles extra (confirmación)
# ------------------------------------------------------------

step "13. ELIMINAR ROLES EXTRA (wog, priv_esc, etc.)"

psql_db -c "SELECT oid, rolname, rolsuper, rolcanlogin FROM pg_roles ORDER BY oid;"

echo
echo "pg_user (solo login) no muestra roles NOLOGIN como postgres."
echo "OID 10 es el superusuario bootstrap: no se dropea, se renombra si hace falta."

DROP_LIST="$(
    psql_db -Atqc "SELECT rolname FROM pg_roles
        WHERE rolcanlogin
          AND rolname NOT IN (
            SELECT unnest(string_to_array('$KEEP_ROLES', ' '))
          )
        ORDER BY rolname;"
)"

if [[ -z "${DROP_LIST//[$'\n']/}" ]]; then
    echo
    echo "No hay roles extra para borrar (solo quedan: $KEEP_ROLES)."
else
    echo
    echo "Se van a eliminar estos roles de login (y sus objetos):"
    echo "$DROP_LIST" | sed 's/^/  - /'
    echo
    echo "Se conservan: $KEEP_ROLES"
    echo
    echo "Por cada uno: pg_terminate_backend → REASSIGN OWNED → DROP OWNED → DROP ROLE"
    echo "en todas las bases que aceptan conexión."

    echo
    read -r -p "¿Eliminar esos roles ahora? [s/N]: " DROP_RESP
    if [[ "$DROP_RESP" =~ ^[sS]$ ]]; then
        DATABASES="$(
            psql_db -Atqc "SELECT datname FROM pg_database WHERE datallowconn ORDER BY datname;"
        )"

        while IFS= read -r ROLE; do
            [[ -z "$ROLE" ]] && continue
            echo
            echo "-- Rol: $ROLE"

            docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
                -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE usename = '$ROLE' AND pid <> pg_backend_pid();"

            while IFS= read -r DB; do
                [[ -z "$DB" ]] && continue
                echo "   $DB: REASSIGN/DROP OWNED"
                docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB" \
                    -v ON_ERROR_STOP=1 \
                    -c "REASSIGN OWNED BY \"$ROLE\" TO \"$DB_USER\";" \
                    -c "DROP OWNED BY \"$ROLE\";" \
                    || echo "   AVISO: REASSIGN/DROP OWNED falló en $DB (puede no tener objetos)."
            done <<< "$DATABASES"

            ROLE_OID="$(
                docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
                    -Atqc "SELECT oid FROM pg_roles WHERE rolname = '$ROLE';"
            )"
            if [[ "$ROLE_OID" == "10" ]]; then
                echo "   NO se dropea $ROLE: es el bootstrap (oid 10)."
                echo "   Si el nombre no es postgres: ALTER ROLE \"$ROLE\" RENAME TO postgres;"
                continue
            fi

            docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
                -v ON_ERROR_STOP=1 \
                -c "DROP ROLE \"$ROLE\";" \
                && echo "   DROP ROLE $ROLE ejecutado" \
                || echo "   ERROR: no se pudo DROP ROLE $ROLE"

            STILL="$(
                docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
                    -Atqc "SELECT rolname FROM pg_roles WHERE rolname = '$ROLE';"
            )"
            if [[ -n "$STILL" ]]; then
                echo "   ERROR: $ROLE sigue existiendo después del DROP. Puede re-crearse solo."
            else
                echo "   DROP ROLE $ROLE OK (ya no está en pg_roles)"
            fi
        done <<< "$DROP_LIST"

        echo
        echo "Roles actuales (pg_roles, no solo pg_user):"
        psql_db -c "SELECT oid, rolname, rolsuper, rolcanlogin FROM pg_roles ORDER BY oid;"
    else
        echo "No se eliminaron roles. Siguen en el cluster."
    fi
fi

# ------------------------------------------------------------
# 14. Rotar password (opcional)
# ------------------------------------------------------------

step "14. ROTAR PASSWORD DE $DB_USER (opcional)"

echo "Esto ejecuta ALTER USER en Postgres. Después hay que actualizar"
echo "DB_PASSWORD / POSTGRES_PASSWORD en el .env de prod y recrear"
echo "backend (y db si el compose usa POSTGRES_PASSWORD al init, el"
echo "password vigente es el de ALTER USER)."
echo
read -r -p "¿Cambiar la password de $DB_USER ahora? [s/N]: " PW_RESP
if [[ "$PW_RESP" =~ ^[sS]$ ]]; then
    echo
    read -r -s -p "Nueva password: " NEW_PW
    echo
    read -r -s -p "Repetir password: " NEW_PW2
    echo
    if [[ -z "$NEW_PW" ]]; then
        echo "Vacía: no se cambia."
    elif [[ "$NEW_PW" != "$NEW_PW2" ]]; then
        echo "ERROR: no coinciden. No se cambió."
    else
        PW_ESC="${NEW_PW//\'/\'\'}"
        if printf "ALTER USER \"%s\" WITH PASSWORD '%s';\n" "$DB_USER" "$PW_ESC" \
            | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1; then
            echo "ALTER USER OK. Actualizá el .env y: $COMPOSE up -d --force-recreate backend"
        else
            echo "ERROR: ALTER USER falló."
        fi
        unset PW_ESC
    fi
    unset NEW_PW NEW_PW2
else
    echo "Password no rotada. Hacelo a mano cuando actualices el .env."
fi

echo
echo "============================================================"
echo " RECUPERACIÓN BÁSICA COMPLETADA"
echo "============================================================"
echo
echo "Backup datos:   $DUMP_FILE"
echo "Backup roles:   $GLOBALS_FILE"
echo
echo "IMPORTANTE:"
echo "  - No se eliminó db_data."
echo "  - No se ejecutó docker compose down -v."
echo "  - PostgreSQL ya no debería estar publicado en 5433."
echo "  - Si rotaste la pass, actualizá .env y recreá el backend."
echo "  - El compromiso debe investigarse aunque el miner haya desaparecido."
echo
