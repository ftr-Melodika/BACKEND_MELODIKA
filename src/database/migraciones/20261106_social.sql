-- Perfil público/privado y unicidad de amistades por par de perfiles.
-- Se puede ejecutar más de una vez.
BEGIN;

-- true por defecto porque el ranking ya muestra a todos los perfiles.
ALTER TABLE perfiles
    ADD COLUMN IF NOT EXISTS es_publico boolean NOT NULL DEFAULT true;

-- Una sola fila por par, sin importar quién envió la solicitud.
CREATE UNIQUE INDEX IF NOT EXISTS amistades_par_unico
    ON amistades (LEAST(perfil_1_id, perfil_2_id), GREATEST(perfil_1_id, perfil_2_id));

COMMIT;
