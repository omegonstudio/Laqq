# Guía de Deploy - LAQQ

## Requisitos Previos

- Docker y Docker Compose instalados
- Git
- Acceso al servidor de producción

---

## 1. Deploy Local (Desarrollo)

### Clonar el repositorio
```bash
git clone https://github.com/omegonstudio/Laqq.git
cd Laqq
```

### Configurar variables de entorno
```bash
cp .env.example .env
```

Editar `.env` con valores de desarrollo:
```env
DB_NAME=laqq_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432
DEBUG=True
SECRET_KEY=dev-secret-key
DJANGO_ENV=development
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Levantar con Docker Compose
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Acceder a la aplicación
- API: http://localhost:8000
- Admin: http://localhost:8000/admin/

### Crear superusuario (primera vez)
```bash
docker-compose -f docker-compose.dev.yml exec web python manage.py createsuperuser
```

---

## 2. Deploy en Producción

### 2.1 Preparar el servidor

#### Instalar Docker
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER
```

### 2.2 Clonar y configurar

```bash
# Clonar repositorio
git clone https://github.com/omegonstudio/Laqq.git
cd Laqq

# Crear archivo de configuración
cp .env.example .env
```

### 2.3 Configurar variables de producción

Editar `.env` con valores seguros:
```env
# Database
DB_NAME=laqq_production
DB_USER=laqq_user
DB_PASSWORD=TU_PASSWORD_SEGURO_AQUI
DB_HOST=db
DB_PORT=5432

# Django
DEBUG=False
SECRET_KEY=TU_SECRET_KEY_MUY_LARGO_Y_ALEATORIO
DJANGO_ENV=production
ALLOWED_HOSTS=tu-dominio.com,www.tu-dominio.com
```

#### Generar SECRET_KEY seguro
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 2.4 Build y deploy

```bash
# Build de la imagen
docker-compose build

# Levantar en modo detached
docker-compose up -d

# Ver logs
docker-compose logs -f web
```

### 2.5 Configuración inicial

```bash
# Crear superusuario
docker-compose exec web python manage.py createsuperuser

# Cargar datos iniciales (si los hay)
docker-compose exec web python manage.py loaddata initial_data.json
```

---

## 3. Deploy con Nginx (Producción Completa)

### 3.1 Crear docker-compose.prod.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: laqq_db_prod
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - laqq_network_prod
    restart: always

  web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: laqq_web_prod
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/mediafiles
    environment:
      - DEBUG=False
      - SECRET_KEY=${SECRET_KEY}
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_HOST=db
      - DB_PORT=5432
      - DJANGO_ENV=production
      - ALLOWED_HOSTS=${ALLOWED_HOSTS}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - laqq_network_prod
    restart: always

  nginx:
    image: nginx:alpine
    container_name: laqq_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - static_volume:/app/staticfiles:ro
      - media_volume:/app/mediafiles:ro
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - web
    networks:
      - laqq_network_prod
    restart: always

volumes:
  postgres_data_prod:
  static_volume:
  media_volume:

networks:
  laqq_network_prod:
    driver: bridge
```

### 3.2 Configuración de Nginx

Crear `nginx/nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    upstream django {
        server web:8000;
    }

    server {
        listen 80;
        server_name tu-dominio.com www.tu-dominio.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name tu-dominio.com www.tu-dominio.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        client_max_body_size 10M;

        location /static/ {
            alias /app/staticfiles/;
        }

        location /media/ {
            alias /app/mediafiles/;
        }

        location / {
            proxy_pass http://django;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 3.3 SSL con Let's Encrypt

```bash
# Instalar certbot
sudo apt-get install certbot

# Obtener certificado
sudo certbot certonly --standalone -d tu-dominio.com -d www.tu-dominio.com

# Copiar certificados
mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/tu-dominio.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/tu-dominio.com/privkey.pem nginx/ssl/
sudo chown -R $USER:$USER nginx/ssl/
```

---

## 4. Comandos Útiles

### Gestión de contenedores
```bash
# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f

# Reiniciar servicio
docker-compose restart web

# Parar todo
docker-compose down

# Parar y eliminar volúmenes (CUIDADO: borra datos)
docker-compose down -v
```

### Base de datos
```bash
# Acceder a PostgreSQL
docker-compose exec db psql -U postgres -d laqq_db

# Backup de base de datos
docker-compose exec db pg_dump -U postgres laqq_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker-compose exec -T db psql -U postgres laqq_db < backup.sql
```

### Django
```bash
# Ejecutar migraciones manualmente
docker-compose exec web python manage.py migrate

# Crear migraciones
docker-compose exec web python manage.py makemigrations

# Shell de Django
docker-compose exec web python manage.py shell

# Collectstatic
docker-compose exec web python manage.py collectstatic --noinput

# Ejecutar tests
docker-compose exec web python manage.py test
```

---

## 5. Monitoreo y Mantenimiento

### Ver uso de recursos
```bash
docker stats
```

### Limpiar imágenes no usadas
```bash
docker system prune -a
```

### Actualizar aplicación
```bash
# Pull cambios
git pull origin main

# Rebuild y restart
docker-compose build
docker-compose up -d

# Ejecutar migraciones si hay nuevas
docker-compose exec web python manage.py migrate
```

### Logs rotativos
Agregar a docker-compose.yml en cada servicio:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

## 6. Troubleshooting

### Error: "Database connection refused"
```bash
# Verificar que db está corriendo
docker-compose ps db

# Ver logs de db
docker-compose logs db

# Esperar a que db esté healthy
docker-compose up -d db
sleep 10
docker-compose up -d web
```

### Error: "Permission denied" en staticfiles
```bash
# Dar permisos al directorio
docker-compose exec web chmod -R 755 /app/staticfiles
```

### Error: "ALLOWED_HOSTS"
Verificar que el dominio esté en la variable `ALLOWED_HOSTS` del `.env`

### Ver errores de Django
```bash
docker-compose exec web python manage.py check --deploy
```

### Reiniciar desde cero
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## 7. Seguridad en Producción

### Checklist
- [ ] `DEBUG=False`
- [ ] `SECRET_KEY` único y seguro
- [ ] `ALLOWED_HOSTS` configurado correctamente
- [ ] SSL/HTTPS habilitado
- [ ] Contraseña de DB segura
- [ ] Firewall configurado (solo puertos 80, 443)
- [ ] Backups automáticos configurados
- [ ] Logs monitoreados

### Firewall (UFW)
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

---

## 8. CI/CD con GitHub Actions (Opcional)

Crear `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /path/to/Laqq
            git pull origin main
            docker-compose build
            docker-compose up -d
            docker-compose exec -T web python manage.py migrate
```

---

## Contacto y Soporte

Para reportar problemas: https://github.com/omegonstudio/Laqq/issues
