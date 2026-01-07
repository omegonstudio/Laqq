# Guía Completa de Docker - LAQQ

Esta guía explica cómo usar Docker para desarrollar y desplegar la aplicación LAQQ.

## 📋 Índice

- [Quick Start](#quick-start)
- [Archivos Docker](#archivos-docker)
- [Entrypoints](#entrypoints)
- [Scripts de Deployment](#scripts-de-deployment)
- [Variables de Entorno](#variables-de-entorno)
- [Comandos Útiles](#comandos-útiles)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Windows (Recomendado)

```bash
# Doble click en deploy.bat y elige:
#   1. Desarrollo
#   2. Producción

# O desde línea de comandos:
deploy.bat dev    # Modo desarrollo
deploy.bat prod   # Modo producción
```

**¿Cuál usar?**
- **Desarrollo**: Para trabajar día a día, con hot reload y datos de prueba
- **Producción**: Para servidor real o testing de producción local

### Linux/Mac o Manual

```bash
# Desarrollo
docker-compose -f docker-compose.dev.yml up --build

# Producción
docker-compose up --build -d
```

**Credenciales por defecto:**
- URL API: http://localhost:8000
- URL Admin: http://localhost:8000/admin/
- Email: laqq@gmail.com
- Password: laqq

---

## 📁 Archivos Docker

### Dockerfile (Producción)
**Ubicación:** `/Dockerfile`

**Características:**
- Multi-stage build para imagen más pequeña
- Usuario no-root (appuser) para seguridad
- Gunicorn como servidor WSGI
- Optimizado para producción

**Comandos automáticos:**
- ✅ Espera a que PostgreSQL esté listo
- ✅ Ejecuta `makemigrations`
- ✅ Ejecuta `migrate`
- ✅ Carga datos de prueba (si `LOAD_SEED_DATA=true`)
- ✅ Inicializa permisos
- ✅ Crea superusuario automáticamente
- ✅ Ejecuta `collectstatic` (solo producción)

### Dockerfile.dev (Desarrollo)
**Ubicación:** `/Dockerfile.dev`

**Características:**
- Build más simple y rápido
- Django development server
- Hot reload habilitado
- Volúmenes para código en tiempo real

**Comandos automáticos:**
- ✅ Espera a que PostgreSQL esté listo
- ✅ Ejecuta `makemigrations`
- ✅ Ejecuta `migrate`
- ✅ **Siempre** carga datos de prueba
- ✅ Inicializa permisos
- ✅ Crea superusuario automáticamente

---

## 🔧 Entrypoints

### entrypoint.sh (Producción)
**Ubicación:** `/entrypoint.sh`

**Flujo de ejecución:**
1. Espera a que PostgreSQL esté disponible
2. Ejecuta `python manage.py makemigrations --noinput`
3. Ejecuta `python manage.py migrate --noinput`
4. **Si `LOAD_SEED_DATA=true`**: Ejecuta `python scripts/seed_data.py`
5. Ejecuta `python manage.py init_permissions`
6. Crea superusuario si no existe (laqq@gmail.com / laqq)
7. **Si `DJANGO_ENV=production`**: Ejecuta `collectstatic`
8. Ejecuta el comando principal (gunicorn)

### entrypoint.dev.sh (Desarrollo)
**Ubicación:** `/entrypoint.dev.sh`

**Flujo de ejecución:**
1. Espera a que PostgreSQL esté disponible
2. Ejecuta `python manage.py makemigrations --noinput`
3. Ejecuta `python manage.py migrate --noinput`
4. **Siempre** ejecuta `python scripts/seed_data.py`
5. Ejecuta `python manage.py init_permissions`
6. Crea superusuario si no existe
7. Ejecuta el comando principal (runserver)

---

## 📜 Scripts de Deployment

### deploy.bat (Unificado - Windows)
**Ubicación:** `/deploy.bat`

**Script inteligente** que maneja tanto desarrollo como producción.

**Uso:**
```bash
# Modo interactivo (pregunta qué modo usar)
deploy.bat

# Modo directo
deploy.bat dev    # Desarrollo
deploy.bat prod   # Producción
```

**Qué hace:**
1. Verifica que Docker esté corriendo
2. Pregunta o detecta el modo (dev/prod)
3. Muestra resumen del modo elegido
4. Crea archivo `.env` si no existe
5. Detiene contenedores anteriores y limpia volúmenes
6. Construye imágenes según el modo
7. Inicia servicios
8. Espera 15 segundos para inicialización
9. Muestra información de acceso y comandos útiles según el modo

**Modo Desarrollo (`dev`):**
- Usa `docker-compose.dev.yml`
- Hot reload habilitado
- Datos de prueba pre-cargados
- Django development server
- Comandos incluyen acceso a shell

**Modo Producción (`prod`):**
- Usa `docker-compose.yml`
- Gunicorn como servidor WSGI
- Sin datos de prueba por defecto
- Imagen optimizada
- Advertencia para cambiar credenciales

---

## 🌐 Variables de Entorno

### docker-compose.yml (Producción)

```yaml
environment:
  - DEBUG=${DEBUG:-False}
  - SECRET_KEY=${SECRET_KEY:-your-secret-key-here}
  - DB_NAME=${DB_NAME:-laqq_db}
  - DB_USER=${DB_USER:-postgres}
  - DB_PASSWORD=${DB_PASSWORD:-postgres}
  - DB_HOST=db
  - DB_PORT=5432
  - DJANGO_ENV=${DJANGO_ENV:-production}
  - ALLOWED_HOSTS=${ALLOWED_HOSTS:-localhost,127.0.0.1}
  - LOAD_SEED_DATA=${LOAD_SEED_DATA:-true}  # ⚠️ En producción real, usar false
```

### docker-compose.dev.yml (Desarrollo)

```yaml
environment:
  - DEBUG=True
  - SECRET_KEY=dev-secret-key-not-for-production
  - DB_NAME=${DB_NAME:-laqq_db}
  - DB_USER=${DB_USER:-postgres}
  - DB_PASSWORD=${DB_PASSWORD:-postgres}
  - DB_HOST=db
  - DB_PORT=5432
  - DJANGO_ENV=development
  - LOAD_SEED_DATA=true  # Siempre en desarrollo
```

### Archivo .env (Opcional)

Puedes crear un archivo `.env` en la raíz para sobrescribir valores:

```env
# Database
DB_NAME=laqq_db
DB_USER=postgres
DB_PASSWORD=mi_password_seguro

# Django
DEBUG=False
SECRET_KEY=mi_secret_key_super_seguro_aqui
ALLOWED_HOSTS=midominio.com,www.midominio.com

# Seed Data
LOAD_SEED_DATA=false  # No cargar datos de prueba en producción
```

---

## 🔨 Comandos Útiles

### Gestión de Contenedores

```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs solo del servicio web
docker-compose logs -f web

# Ver logs solo de la base de datos
docker-compose logs -f db

# Reiniciar un servicio
docker-compose restart web

# Detener todo
docker-compose down

# Detener y eliminar volúmenes (⚠️ BORRA DATOS)
docker-compose down -v

# Reconstruir sin caché
docker-compose build --no-cache
```

### Base de Datos

```bash
# Acceder a PostgreSQL
docker-compose exec db psql -U postgres -d laqq_db

# Backup de base de datos
docker-compose exec db pg_dump -U postgres laqq_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker-compose exec -T db psql -U postgres laqq_db < backup.sql

# Ver tablas
docker-compose exec db psql -U postgres -d laqq_db -c "\dt"
```

### Django Commands

```bash
# Shell de Django
docker-compose exec web python manage.py shell

# Crear migraciones
docker-compose exec web python manage.py makemigrations

# Ejecutar migraciones
docker-compose exec web python manage.py migrate

# Crear superusuario manualmente
docker-compose exec web python manage.py createsuperuser

# Inicializar permisos
docker-compose exec web python manage.py init_permissions

# Ejecutar tests
docker-compose exec web python manage.py test

# Ejecutar un comando específico
docker-compose exec web python manage.py <comando>

# Ejecutar script de Python
docker-compose exec web python scripts/seed_data.py
```

### Acceso al Contenedor

```bash
# Entrar al contenedor web
docker-compose exec web bash

# Entrar como root (para instalar paquetes)
docker-compose exec -u root web bash

# Ejecutar un solo comando
docker-compose exec web ls -la
```

### Limpieza

```bash
# Eliminar contenedores parados
docker container prune

# Eliminar imágenes no usadas
docker image prune -a

# Eliminar volúmenes no usados
docker volume prune

# Limpieza completa del sistema
docker system prune -a --volumes
```

---

## 🐛 Troubleshooting

### Error: "Docker no está corriendo"

```bash
# Verificar que Docker Desktop esté iniciado
docker info
```

### Error: "Port 8000 already in use"

```bash
# Detener el contenedor que está usando el puerto
docker-compose down

# O cambiar el puerto en docker-compose.yml
ports:
  - "8001:8000"  # Usar puerto 8001 en lugar de 8000
```

### Error: "Database connection refused"

```bash
# Verificar que el contenedor db esté corriendo
docker-compose ps db

# Ver logs de PostgreSQL
docker-compose logs db

# Reiniciar el servicio db
docker-compose restart db

# Esperar a que db esté healthy
docker-compose up -d db
sleep 10
docker-compose up -d web
```

### Error: "Permission denied" en archivos

```bash
# Dar permisos a staticfiles
docker-compose exec web chmod -R 755 /app/staticfiles

# Dar permisos a mediafiles
docker-compose exec web chmod -R 755 /app/mediafiles
```

### La app no se actualiza (cambios no reflejados)

```bash
# Desarrollo: El hot reload debería funcionar
# Si no funciona, reiniciar el contenedor
docker-compose restart web

# Producción: Rebuild necesario
docker-compose down
docker-compose up --build -d
```

### Seed data no se carga

```bash
# Verificar que la variable esté configurada
docker-compose exec web env | grep LOAD_SEED_DATA

# Ejecutar manualmente
docker-compose exec web python scripts/seed_data.py

# Ver logs del entrypoint
docker-compose logs web | grep "seed data"
```

### Migraciones no se aplican

```bash
# Ver migraciones pendientes
docker-compose exec web python manage.py showmigrations

# Aplicar manualmente
docker-compose exec web python manage.py migrate

# Si hay problemas, hacer fake migrate
docker-compose exec web python manage.py migrate --fake <app_name> <migration_name>
```

### Reiniciar desde cero

```bash
# ⚠️ ESTO BORRA TODO
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# Ver que se inicialice correctamente
docker-compose logs -f web
```

---

## 📊 Monitoreo

### Ver uso de recursos

```bash
# Ver CPU, memoria, red de cada contenedor
docker stats

# Ver solo contenedores de laqq
docker stats laqq_web laqq_db
```

### Logs con filtros

```bash
# Ver solo errores
docker-compose logs web | grep ERROR

# Ver logs de las últimas 50 líneas
docker-compose logs --tail=50 web

# Ver logs desde una fecha específica
docker-compose logs --since 2024-01-01 web
```

---

## 🔒 Seguridad en Producción

### Checklist

- [ ] `DEBUG=False` en .env
- [ ] `SECRET_KEY` único y aleatorio
- [ ] `LOAD_SEED_DATA=false` (no cargar datos de prueba)
- [ ] Contraseña fuerte para PostgreSQL
- [ ] `ALLOWED_HOSTS` configurado con tu dominio
- [ ] Usar HTTPS (configurar nginx/reverse proxy)
- [ ] Cambiar credenciales del superusuario por defecto
- [ ] Configurar backups automáticos de DB
- [ ] Limitar acceso a puerto 5432 (PostgreSQL)
- [ ] Implementar rate limiting
- [ ] Configurar logs rotativos

### Cambiar credenciales del superusuario

```bash
docker-compose exec web python manage.py shell

# En la shell de Django:
from django.contrib.auth import get_user_model
User = get_user_model()
admin = User.objects.get(email='laqq@gmail.com')
admin.set_password('nueva_password_segura')
admin.email = 'admin@tuempresa.com'
admin.save()
```

---

## 📚 Recursos Adicionales

- [DEPLOY.md](DEPLOY.md) - Guía completa de deployment
- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitectura del sistema
- [README.md](../README.md) - Documentación principal
- [scripts/README.md](../scripts/README.md) - Documentación de scripts

---

**Última actualización:** 2024-12-02
