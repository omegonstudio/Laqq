# Guía de Testing - LAQQ

## Tests Unitarios

El proyecto cuenta con **48 tests unitarios** que cubren toda la funcionalidad de la API.

---

## Ejecutar Tests

### Opción 1: Con servidor de desarrollo (runserver)

Si levantaste la app con `python manage.py runserver`, ejecutá en otra terminal:

```bash
python manage.py test
```

### Opción 2: Con Docker

Si usaste `deploy.bat` o `docker-compose up`:

```bash
docker-compose exec web python manage.py test
```

---

## Comandos de Testing

### Ejecutar todos los tests
```bash
python manage.py test
```

### Ejecutar tests con más detalle (verbosity)
```bash
# Nivel 1 - Output normal
python manage.py test --verbosity=1

# Nivel 2 - Más detalles
python manage.py test --verbosity=2
```

### Ejecutar tests de apps específicas
```bash
# Solo productos
python manage.py test products

# Solo contactos
python manage.py test contacts

# Solo cotizaciones
python manage.py test quotes

# Solo tickets
python manage.py test tickets

# Múltiples apps
python manage.py test products contacts quotes tickets
```

### Ejecutar una clase de test específica
```bash
python manage.py test products.tests.BrandAPITestCase
```

### Ejecutar un test individual
```bash
python manage.py test products.tests.BrandAPITestCase.test_create_brand
```

### Tests con coverage (cobertura de código)
```bash
# Instalar coverage si no lo tenés
pip install coverage

# Ejecutar tests con coverage
coverage run --source='.' manage.py test

# Ver reporte en terminal
coverage report

# Generar reporte HTML
coverage html
# Abrir htmlcov/index.html en el navegador
```

### Tests en paralelo (más rápido)
```bash
python manage.py test --parallel
```

### Mantener la base de datos de test (para debug)
```bash
python manage.py test --keepdb
```

---

## Informe Detallado de Tests

Al ejecutar los tests, se muestra un **informe detallado** al final con:

### Por cada app:
- ✅ **PRODUCTS** (17 tests) - Marcas, categorías, productos, especificaciones
- ✅ **CONTACTS** (11 tests) - Contactos y mensajes del formulario web
- ✅ **QUOTES** (12 tests) - Tipos, cotizaciones e items
- ✅ **TICKETS** (8 tests) - Tickets de servicio técnico

### Información mostrada:
- Nombre del test
- Descripción de la funcionalidad
- Tiempo de ejecución
- Estado (OK/FAIL/ERROR)

### Ejemplo de salida:
```
======================================================================
INFORME DETALLADO DE TESTS
======================================================================

PRODUCTS (17 tests, 8.240s)
----------------------------------------------------------------------
  [OK] BrandAPITestCase.test_create_brand
       Crear una nueva marca con nombre y descripción (0.505s)
  [OK] BrandAPITestCase.test_list_brands
       Listar todas las marcas con paginación (0.533s)
  ...

RESUMEN FINAL
======================================================================
Total tests: 48
  - Pasados:  48
  - Fallidos: 0
  - Errores:  0
  - Saltados: 0

Tiempo total: 21.308s

*** TODOS LOS TESTS PASARON CORRECTAMENTE ***
======================================================================
```

---

## Funcionalidades Testeadas

### PRODUCTS (17 tests)
- ✅ CRUD completo de marcas
- ✅ Búsqueda de marcas por nombre
- ✅ CRUD de categorías con orden de visualización
- ✅ Filtros de categorías
- ✅ CRUD de productos asociados a marca y categoría
- ✅ Filtros por marca y estado activo
- ✅ Búsqueda de productos
- ✅ CRUD de especificaciones/variantes
- ✅ Filtros por producto

### CONTACTS (11 tests)
- ✅ CRUD de contactos
- ✅ Validación de email con formato correcto
- ✅ Validación de teléfono (mínimo 7 caracteres)
- ✅ Filtros por estado y usuario asignado
- ✅ Búsqueda por nombre, empresa o email
- ✅ CRUD de mensajes del formulario web
- ✅ Validación de mensaje (mínimo 10 caracteres)
- ✅ Búsqueda de mensajes

### QUOTES (12 tests)
- ✅ CRUD de tipos de cotización
- ✅ CRUD de cotizaciones
- ✅ Auto-generación de número de cotización (Q-YYYY-XXXXX)
- ✅ Filtros por estado (borrador, enviada, aprobada)
- ✅ Búsqueda por número o mensaje
- ✅ Validación de montos negativos
- ✅ CRUD de items/líneas de cotización
- ✅ Cálculo automático de subtotal (cantidad × precio)
- ✅ Validación de cantidad > 0
- ✅ Validación de precio no negativo
- ✅ Filtros por cotización específica

### TICKETS (8 tests)
- ✅ CRUD de tickets de servicio
- ✅ Auto-generación de número de ticket (T-YYYY-XXXXX)
- ✅ Validación de descripción (mínimo 20 caracteres)
- ✅ Filtros por cliente/contacto
- ✅ Filtros por estado (abierto, en proceso, cerrado)
- ✅ Filtros por técnico asignado
- ✅ Búsqueda por número o descripción
- ✅ Actualización de tickets existentes

---

## Configuración de Tests

### Custom Test Runner
El proyecto usa un **test runner personalizado** que genera el informe detallado.

Configurado en `config/settings.py`:
```python
TEST_RUNNER = 'config.test_runner.DetailedReportTestRunner'
```

### Base de datos de tests
Django crea automáticamente una base de datos temporal para tests:
- Se crea antes de ejecutar los tests
- Se destruye después de ejecutar los tests
- No afecta la base de datos de desarrollo

---

## Troubleshooting

### Error: "auth.User has been swapped"
Si ves este error, limpiá el cache de Python:
```bash
# Windows (PowerShell)
Get-ChildItem -Path . -Include __pycache__ -Recurse -Directory | Remove-Item -Recurse -Force

# Linux/Mac
find . -type d -name __pycache__ -exec rm -rf {} +
```

### Tests muy lentos
Ejecutá en paralelo:
```bash
python manage.py test --parallel
```

### Error: "Database already exists"
Eliminá la base de datos de test:
```bash
python manage.py test --keepdb=False
```

### Ver SQL queries ejecutadas
```bash
python manage.py test --debug-sql
```

---

## Integración Continua (CI)

### GitHub Actions
Para ejecutar tests automáticamente en cada push, crear `.github/workflows/tests.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_laqq
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt

      - name: Run tests
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: test_laqq
          DB_USER: postgres
          DB_PASSWORD: postgres
        run: |
          python manage.py test --verbosity=2
```

---

## Buenas Prácticas

### Antes de hacer commit
```bash
# Ejecutar tests
python manage.py test

# Si todos pasan, hacer commit
git add .
git commit -m "feat: nueva funcionalidad"
```

### Antes de hacer merge a main
```bash
# Ejecutar todos los tests
python manage.py test --verbosity=2

# Verificar coverage
coverage run --source='.' manage.py test
coverage report
```

### Escribir nuevos tests
Al agregar nueva funcionalidad, agregar tests en el archivo `tests.py` correspondiente:

```python
def test_nueva_funcionalidad(self):
    """Descripción clara de qué se está testeando"""
    # Arrange: preparar datos
    data = {'campo': 'valor'}

    # Act: ejecutar acción
    response = self.client.post('/endpoint/', data)

    # Assert: verificar resultado
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
```

---

## Comandos Rápidos

```bash
# Ejecutar todos los tests
python manage.py test

# Solo ver tests fallidos
python manage.py test --failfast

# Tests con coverage
coverage run manage.py test && coverage report

# Tests en paralelo
python manage.py test --parallel

# Ver SQL queries
python manage.py test --debug-sql
```
