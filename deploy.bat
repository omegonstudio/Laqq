@echo off
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

REM Verificar si existe .env
if not exist .env (
    echo [INFO] Creando archivo .env desde .env.example...
    copy .env.example .env >nul
    echo [OK] Archivo .env creado
    echo.
)

REM Detener contenedores anteriores y limpiar volúmenes
echo Deteniendo contenedores y limpiando datos anteriores...
docker-compose down -v 2>nul

echo.
echo Construyendo imagenes...
docker-compose build

echo.
echo Iniciando servicios...
docker-compose up -d

echo.
echo Esperando inicializacion (migraciones, superuser)...
echo Puedes ver el progreso con: docker-compose logs -f web
timeout /t 15 /nobreak >nul

echo.
echo ========================================
echo   Deployment completado!
echo ========================================
echo.
echo   API:    http://localhost:8000
echo   Admin:  http://localhost:8000/admin/
echo   DB:     localhost:5432
echo.
echo   ---- Credenciales Admin ----
echo   Email: laqq@gmail.com
echo   Password: laqq
echo.
echo ========================================
echo.
echo Comandos utiles:
echo   - Ver logs:    docker-compose logs -f
echo   - Detener:     docker-compose down
echo   - Reiniciar:   docker-compose restart
echo   - Tests:       docker-compose exec web python manage.py test
echo.

pause
