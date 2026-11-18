-- 003: modo zurdo por perfil (apagado por defecto).
--   npm run migrar -- 003_es_zurdo.sql
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS es_zurdo boolean NOT NULL DEFAULT false;
