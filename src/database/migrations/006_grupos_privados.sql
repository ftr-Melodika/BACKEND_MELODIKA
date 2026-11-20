-- 006: grupos públicos y privados.
--   npm run migrar -- 006_grupos_privados.sql
-- Requiere 004_amistad_grupos.sql. Se puede correr más de una vez sin romper nada.
--
-- Todos los grupos aparecen en la búsqueda. A uno público entra cualquiera; a uno privado solo
-- con su código: 8 letras (mayúsculas y minúsculas, se distinguen) o números.

ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS es_privado boolean NOT NULL DEFAULT false;
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS codigo text;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chats_codigo_formato') THEN
        ALTER TABLE public.chats
            ADD CONSTRAINT chats_codigo_formato CHECK (codigo IS NULL OR codigo ~ '^[A-Za-z0-9]{8}$');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chats_privado_con_codigo') THEN
        ALTER TABLE public.chats
            ADD CONSTRAINT chats_privado_con_codigo CHECK (NOT es_privado OR codigo IS NOT NULL);
    END IF;
END $$;

-- El código distingue mayúsculas: "AbC12345" y "abc12345" son códigos distintos
CREATE UNIQUE INDEX IF NOT EXISTS chats_codigo_unico ON public.chats (codigo) WHERE codigo IS NOT NULL;
