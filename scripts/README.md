# Scripts de Utilidades - LAQQ

Esta carpeta contiene scripts de utilidad para el proyecto LAQQ.

## 📄 Scripts Disponibles

### seed_data.py
**Descripción:** Carga datos de prueba en la base de datos.

**Uso:**
```bash
# Desde la raíz del proyecto
python scripts/seed_data.py
```

**Qué hace:**
- Crea tipos y estados de usuarios
- Crea usuarios de prueba (admin, backoffice)
- Crea estados de contactos
- Crea contactos de prueba
- Crea marcas (WHEATON, Eppendorf, 2mag, Thermo Fisher, Corning)
- Crea categorías de productos
- Crea productos de prueba
- Crea specs de productos
- Crea relaciones entre productos
- Crea accesorios
- Crea tipos y estados de cotizaciones
- Crea cotizaciones de prueba
- Crea tipos y estados de notas
- Crea notas de prueba
- Crea attachments de prueba

**Cuándo usar:**
- Desarrollo local para tener datos de prueba
- Testing manual
- Resetear la BD con datos iniciales

**Nota:** Este script se ejecuta automáticamente en Docker cuando `LOAD_SEED_DATA=true`

---

### setup_db.bat
**Descripción:** Script de Windows para configurar la base de datos local desde cero.

**Uso:**
```bash
# Desde la raíz del proyecto
scripts\setup_db.bat
```

**Qué hace:**
1. Elimina la base de datos existente (laqq_db)
2. Crea una nueva base de datos limpia
3. Ejecuta todas las migraciones
4. Carga datos de prueba (seed_data.py)
5. Inicializa roles y permisos
6. Pide crear un superusuario
7. Verifica la instalación

**Cuándo usar:**
- Primera instalación en desarrollo local
- Resetear completamente la base de datos
- Después de cambios mayores en modelos

**Requisitos:**
- PostgreSQL instalado y corriendo
- Usuario `postgres` con permisos
- Python virtual environment activado

---

## 🔧 Management Commands

Algunos scripts han sido convertidos a Django management commands para mejor integración:

### fix_ticket_numbers
**Descripción:** Asigna números de ticket a tickets que no tienen número.

**Uso:**
```bash
python manage.py fix_ticket_numbers
```

**Ubicación:** `tickets/management/commands/fix_ticket_numbers.py`

**Qué hace:**
- Busca todos los tickets sin número
- Genera números automáticos en formato `T-YYYY-NNNNN`
- Asigna los números a los tickets

---

## 📝 Notas

- Todos los scripts deben ejecutarse desde la **raíz del proyecto**
- Los scripts asumen que tienes configurado el archivo `.env` correctamente
- Para producción, **NO** usar seed_data.py (solo datos reales)
