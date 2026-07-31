-- =============================================
-- Limpieza de tipos de usuario duplicados
-- =============================================
-- Situación actual:
--   admin y ADMIN son duplicados (admin en minúscula tiene JSON de permisos)
--   back y BACKOFFICE son duplicados (back tiene JSON de permisos)
--   ADMIN y BACKOFFICE están en mayúscula y sin JSON de permisos
-- =============================================

BEGIN;

-- 1. Migrar usuarios que usan los tipos duplicados a los correctos
UPDATE users SET user_type_id = 'admin' WHERE user_type_id = 'ADMIN';
UPDATE users SET user_type_id = 'back' WHERE user_type_id = 'BACKOFFICE';

-- 2. Eliminar los tipos duplicados (ya sin usuarios referenciándolos)
DELETE FROM users_usertype WHERE id IN ('ADMIN', 'BACKOFFICE');

COMMIT;