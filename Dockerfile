# Usar Python 3.11 como imagen base
FROM python:3.11-slim

# Establecer variables de entorno
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Establecer el directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema necesarias para psycopg2 y otros paquetes
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements.txt
COPY requirements.txt /app/

# Instalar dependencias de Python
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copiar el proyecto
COPY . /app/

# Crear directorio para archivos estáticos
RUN mkdir -p /app/staticfiles

# Exponer el puerto 8000
EXPOSE 8000

# Script de entrada para esperar a que PostgreSQL esté listo
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
