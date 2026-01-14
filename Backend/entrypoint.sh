#!/bin/bash
set -e

echo "========================================"
echo "  LAQQ - Initializing Application"
echo "========================================"

echo "Waiting for PostgreSQL..."

while ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 1
done

echo "[OK] PostgreSQL is up - continuing..."

echo ""
echo "Running migrations..."
python manage.py migrate --noinput

if [ "$LOAD_SEED_DATA" = "true" ]; then
    echo ""
    echo "Loading seed data..."
    python scripts/seed_data.py
fi

echo ""
echo "Checking superuser..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='laqq@gmail.com').exists():
    User.objects.create_superuser(
        username='laqq',
        email='laqq@gmail.com',
        password='laqq',
        is_staff=True,
        is_active=True
    )
    print('[OK] Superuser created')
else:
    print('[OK] Superuser already exists')
EOF

if [ "$DJANGO_ENV" = "production" ]; then
    echo ""
    echo "Collecting static files..."
    python manage.py collectstatic --noinput
fi

echo ""
echo "========================================"
echo "  LAQQ - Ready!!"
echo "========================================"

exec "$@"
