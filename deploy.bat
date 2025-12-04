@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   LAQQ - Docker Deployment
echo ========================================
echo.

REM Verificar si Docker esta corriendo
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no esta corriendo. Por favor inicia Docker Desktop.
    pause
    exit /b 1
)

echo [OK] Docker esta corriendo
echo.

REM Determinar modo (dev o prod)
set MODE=%1

if "%MODE%"=="" (
    echo Selecciona el modo de deployment:
    echo.
    echo   1. Desarrollo  - Hot reload, datos de prueba, DEBUG=True
    echo   2. Produccion  - Gunicorn, optimizado, DEBUG=False
    echo.
    choice /C 12 /N /M "Ingresa tu opcion [1-2]: "

    if errorlevel 2 (
        set MODE=prod
    ) else (
        set MODE=dev
    )
)

REM Normalizar MODE
if /I "%MODE%"=="development" set MODE=dev
if /I "%MODE%"=="production" set MODE=prod
if /I "%MODE%"=="1" set MODE=dev
if /I "%MODE%"=="2" set MODE=prod

REM Validar MODE
if not "%MODE%"=="dev" if not "%MODE%"=="prod" (
    echo [ERROR] Modo invalido: %MODE%
    echo Usa: deploy.bat [dev^|prod]
    pause
    exit /b 1
)

echo.
echo ========================================
if "%MODE%"=="dev" (
    echo   MODO: DESARROLLO
    echo   - Hot reload habilitado
    echo   - Datos de prueba pre-cargados
    echo   - Django development server
) else (
    echo   MODO: PRODUCCION
    echo   - Gunicorn como servidor WSGI
    echo   - Optimizado para rendimiento
    echo   - Sin hot reload
)
echo ========================================
echo.

REM Configurar archivo docker-compose
if "%MODE%"=="dev" (
    set COMPOSE_FILE=docker-compose.dev.yml
    set ENV_NAME=Development
) else (
    set COMPOSE_FILE=docker-compose.yml
    set ENV_NAME=Production
)

REM Verificar si existe .env
if not exist .env (
    echo [INFO] Creando archivo .env desde .env.example...
    copy .env.example .env >nul
    echo [OK] Archivo .env creado
    echo.
)

REM Detener contenedores anteriores y limpiar volumenes
echo Deteniendo contenedores anteriores...
docker-compose -f %COMPOSE_FILE% down -v 2>nul

echo.
echo Construyendo imagenes...
docker-compose -f %COMPOSE_FILE% build

echo.
echo Iniciando servicios...
docker-compose -f %COMPOSE_FILE% up -d

echo.
echo Esperando inicializacion...
if "%MODE%"=="dev" (
    echo [Migraciones + Seed Data + Permisos + Superuser]
) else (
    echo [Migraciones + Permisos + Superuser + Collectstatic]
)
echo.
echo Puedes ver el progreso con:
echo   docker-compose -f %COMPOSE_FILE% logs -f web
timeout /t 15 /nobreak >nul

echo.
echo ========================================
echo   %ENV_NAME% Deployment Completado!
echo ========================================
echo.
echo   API:     http://localhost:8000
echo   Admin:   http://localhost:8000/admin/
echo   Swagger: http://localhost:8000/swagger/
echo   DB:      localhost:5433
echo.
echo   ---- Credenciales Admin ----
echo   Email:    laqq@gmail.com
echo   Password: laqq
echo.
if "%MODE%"=="prod" (
    echo   [!] IMPORTANTE: Cambia estas credenciales en produccion real
    echo.
)
echo ========================================
echo.
echo Comandos utiles:
echo   - Ver logs:    docker-compose -f %COMPOSE_FILE% logs -f
echo   - Detener:     docker-compose -f %COMPOSE_FILE% down
echo   - Reiniciar:   docker-compose -f %COMPOSE_FILE% restart
if "%MODE%"=="dev" (
    echo   - Shell:       docker-compose -f %COMPOSE_FILE% exec web bash
)
echo   - Tests:       docker-compose -f %COMPOSE_FILE% exec web python manage.py test
echo.

pause
