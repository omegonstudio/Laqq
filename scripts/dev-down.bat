@echo off
setlocal EnableExtensions

REM ROOT = carpeta padre de /scripts
set "ROOT=%~dp0.."
REM Normalizar a path absoluto
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

set "COMPOSE_FILE=%ROOT%\docker-compose.dev.yml"

echo [dev] Deteniendo stack y limpiando volúmenes
docker compose -f "%COMPOSE_FILE%" down -v
if errorlevel 1 exit /b 1

endlocal