@echo off
echo ========================================
echo   LAQQ - Setup de Base de Datos
echo ========================================
echo.

echo [1/5] Limpiando base de datos...
psql -U postgres -c "DROP DATABASE IF EXISTS laqq_db;"
psql -U postgres -c "CREATE DATABASE laqq_db;"

echo.
echo [2/5] Aplicando migraciones...
python manage.py migrate

echo.
echo [3/5] Inicializando roles y permisos...
python manage.py init_permissions

echo.
echo [4/5] Creando superusuario...
echo Nota: Debes crear un superusuario para acceder al admin
python manage.py createsuperuser

echo.
echo [5/5] Verificando instalacion...
python manage.py check

echo.
echo ========================================
echo   Setup completado!
echo ========================================
echo.
echo Para ejecutar el servidor:
echo   python manage.py runserver
echo.
pause
