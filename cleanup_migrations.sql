-- =============================================
-- Limpieza de columnas huérfanas y migraciones
-- =============================================

BEGIN;

-- 1. Eliminar las columnas que quedaron del merge de consumibles-back
ALTER TABLE products_product 
  DROP COLUMN IF EXISTS root_category,
  DROP COLUMN IF EXISTS articulo,
  DROP COLUMN IF EXISTS cas,
  DROP COLUMN IF EXISTS sedronar,
  DROP COLUMN IF EXISTS esp_attachment_id,
  DROP COLUMN IF EXISTS hds_attachment_id;

-- 2. Limpiar los registros de migraciones que ya no existen
DELETE FROM django_migrations 
WHERE app='products' 
  AND name IN ('0013_alter_productvariant_options', '0014_add_insumo_fields');

COMMIT;