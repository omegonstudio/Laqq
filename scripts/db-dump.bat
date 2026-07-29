@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ==========================================================
REM scripts/db-dump.bat
REM Dump all tables of the PostgreSQL database to a .sql file.
REM Works with Docker (dev / prod) and direct local connection.
REM ==========================================================

REM --- ROOT = carpeta padre de /scripts ---
set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

REM --- Load .env (if exists) ---
if exist "%ROOT%\.env" (
    for /f "usebackq delims=" %%A in ("%ROOT%\.env") do (
        set "%%A" 2>nul
    )
)

REM --- Defaults ---
if not defined DB_NAME set "DB_NAME=laqq_db"
if not defined DB_USER set "DB_USER=postgres"
if not defined DB_PASSWORD set "DB_PASSWORD=postgres"
if not defined DB_HOST set "DB_HOST=localhost"
if not defined DB_PORT set "DB_PORT=5432"

REM --- Timestamp ---
for /f "tokens=2 delims==." %%I in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%I"
if not defined DT set "DT=%DATE:~10,4%%DATE:~4,2%%DATE:~7,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%"
set "DT=%DT: =0%"
set "TIMESTAMP=%DT:~0,8%_%DT:~8,6%"

set "OUTPUT_DIR=%ROOT%\backups"
set "OUTPUT_FILE=%OUTPUT_DIR%\dump_%DB_NAME%_%TIMESTAMP%.sql"

REM --- Parse argument ---
set "MODE=%~1"
if not defined MODE set "MODE=auto"

if "%MODE%"=="--help" goto :usage
if "%MODE%"=="/?" goto :usage

REM --- Detect environment ---
if /I "%MODE%"=="auto" (
    docker ps --format "{{.Names}}" 2>nul | findstr /I /C:"laqq-db-dev" >nul
    if !errorlevel! equ 0 (
        set "MODE=dev"
    ) else (
        docker ps --format "{{.Names}}" 2>nul | findstr /I /C:"laqq-db" >nul
        if !errorlevel! equ 0 (
            set "MODE=prod"
        ) else (
            where pg_dump >nul 2>nul
            if !errorlevel! equ 0 (
                set "MODE=local"
            ) else (
                echo [ERROR] No se encontro contenedor Docker en ejecucion ni pg_dump local.
                echo   Asegurate de levantar el stack primero (scripts\dev-up.bat o scripts\prod-up.bat)
                echo   o instala PostgreSQL localmente.
                exit /b 1
            )
        )
    )
)

REM --- Create output directory ---
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

REM --- Execute dump ---
if /I "%MODE%"=="dev" (
    echo [db-dump] Dump desde Docker DEV (laqq-db-dev) -^> %OUTPUT_FILE%
    set "PGPASSWORD=%DB_PASSWORD%"
    docker compose -f "%ROOT%\docker-compose.dev.yml" exec -T db ^
        pg_dump --username="%DB_USER%" --dbname="%DB_NAME%" --clean --if-exists --no-owner --no-acl --format=p ^
        > "%OUTPUT_FILE%"
    goto :result
)

if /I "%MODE%"=="prod" (
    echo [db-dump] Dump desde Docker PROD (laqq-db) -^> %OUTPUT_FILE%
    set "PGPASSWORD=%DB_PASSWORD%"
    docker compose -f "%ROOT%\docker-compose.prod.yml" exec -T db ^
        pg_dump --username="%DB_USER%" --dbname="%DB_NAME%" --clean --if-exists --no-owner --no-acl --format=p ^
        > "%OUTPUT_FILE%"
    goto :result
)

if /I "%MODE%"=="local" (
    echo [db-dump] Dump desde PostgreSQL local -^> %OUTPUT_FILE%
    set "PGPASSWORD=%DB_PASSWORD%"
    pg_dump --host="%DB_HOST%" --port="%DB_PORT%" --username="%DB_USER%" --dbname="%DB_NAME%" ^
        --clean --if-exists --no-owner --no-acl --format=p ^
        > "%OUTPUT_FILE%"
    goto :result
)

REM --- Unknown mode ---
:usage
echo Uso: %~nx0 [dev^|prod^|local^|auto]
echo.
echo   dev   -^> dump desde el contenedor Docker de desarrollo (laqq-db-dev)
echo   prod  -^> dump desde el contenedor Docker de produccion  (laqq-db)
echo   local -^> dump desde PostgreSQL local (usa credenciales del .env)
echo   auto  -^> detecta automaticamente el contenedor en ejecucion (default)
exit /b 1

:result
if exist "%OUTPUT_FILE%" (
    for %%F in ("%OUTPUT_FILE%") do set "FILE_SIZE=%%~zF"
    for /f %%L in ('type "%OUTPUT_FILE%" ^| find /c /v ""') do set "LINES=%%L"
    echo [db-dump] ^? Dump completado: %FILE_SIZE% bytes -- %LINES% lineas
    echo   -^> %OUTPUT_FILE%
    echo.
    echo   Para restaurar (Docker dev):
    echo     docker compose -f docker-compose.dev.yml exec -T db psql -U %DB_USER% -d %DB_NAME% ^< %OUTPUT_FILE%
    echo.
    echo   Para restaurar (Docker prod):
    echo     docker compose -f docker-compose.prod.yml exec -T db psql -U %DB_USER% -d %DB_NAME% ^< %OUTPUT_FILE%
    echo.
    echo   Para restaurar (PostgreSQL local):
    echo     psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% ^< %OUTPUT_FILE%
) else (
    echo [db-dump] Error: no se genero el archivo de dump.
    exit /b 1
)

endlocal
