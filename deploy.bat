@echo off
echo ================================
echo   Laqq - Docker Deployment
echo ================================
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

REM Detener contenedores anteriores si existen
echo Deteniendo contenedores anteriores...
docker-compose down

echo.
echo Construyendo imagenes...
docker-compose build

echo.
echo Iniciando servicios...
docker-compose up -d

echo.
echo Esperando que los servicios esten listos...
timeout /t 10 /nobreak >nul

echo.
echo ================================
echo   Deployment completado!
echo ================================
echo.
echo Aplicacion: http://localhost:8000
echo Base de datos: localhost:5432
echo.
echo Para ver logs: docker-compose logs -f
echo Para detener: docker-compose down
echo.

pause
