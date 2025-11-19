#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."

while ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 1
done

echo "PostgreSQL is up - continuing..."

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Collect static files (for production)
if [ "$DJANGO_ENV" = "production" ]; then
    echo "Collecting static files..."
    python manage.py collectstatic --noinput
fi

# Execute the main command
exec "$@"
