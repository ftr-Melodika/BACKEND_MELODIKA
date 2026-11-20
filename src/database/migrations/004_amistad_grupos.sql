-- 004: amistades por username o link de invitación, y roles dentro de los grupos.
--   npm run migrar -- 004_amistad_grupos.sql
-- Se puede correr más de una vez sin romper nada.

-- 1) Rol de cada integrante del grupo. Quien creó el grupo pasa a ser 'admin'.
ALTER TABLE chat_participantes ADD COLUMN IF NOT EXISTS rol text NOT NULL DEFAULT 'miembro';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_participantes_rol_valido') THEN
        ALTER TABLE chat_participantes
            ADD CONSTRAINT chat_participantes_rol_valido CHECK (rol IN ('admin', 'miembro'));
    END IF;
END $$;

UPDATE chat_participantes cp
SET rol = 'admin'
FROM chats c
WHERE c.id = cp.chat_id
  AND c.es_grupo = true
  AND cp.perfil_id = c.creador_id
  AND cp.rol <> 'admin';

-- 2) Links de invitación: un token aleatorio (22 caracteres base64url) por perfil.
--    Al regenerar, el anterior queda con activo = false y deja de servir.
CREATE TABLE IF NOT EXISTS invitaciones_amistad (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id uuid NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    token text NOT NULL UNIQUE CHECK (token ~ '^[A-Za-z0-9_-]{22}$'),
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Un solo token activo por perfil
CREATE UNIQUE INDEX IF NOT EXISTS invitaciones_amistad_activa_unica
    ON invitaciones_amistad (perfil_id) WHERE activo;

-- Solo la usa el backend (conexión directa); sin políticas nadie la lee desde la API pública de Supabase
ALTER TABLE invitaciones_amistad ENABLE ROW LEVEL SECURITY;

-- 3) Username único sin distinguir mayúsculas (la búsqueda por username es case-insensitive).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'perfiles'
          AND indexdef ILIKE 'CREATE UNIQUE INDEX%lower(username)%'
    ) THEN
        CREATE UNIQUE INDEX perfiles_username_lower_unico ON perfiles (lower(username));
    END IF;
END $$;

-- 4) Un solo registro de amistad por par de perfiles, en cualquier dirección.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'amistades'
          AND indexdef ILIKE 'CREATE UNIQUE INDEX%LEAST(perfil_1_id, perfil_2_id)%GREATEST(perfil_1_id, perfil_2_id)%'
    ) THEN
        CREATE UNIQUE INDEX amistades_par_unico
            ON amistades (LEAST(perfil_1_id, perfil_2_id), GREATEST(perfil_1_id, perfil_2_id));
    END IF;
END $$;
