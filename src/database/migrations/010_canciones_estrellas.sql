-- 010: estrellas por canción y perfil (1 a 3). Se guarda solo el MEJOR resultado: nunca baja.
--   npm run migrar -- 010_canciones_estrellas.sql
-- Se puede correr más de una vez sin romper nada. No toca datos existentes.
CREATE TABLE IF NOT EXISTS public.canciones_estrellas (
    perfil_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    cancion_id text NOT NULL REFERENCES public.canciones_practica(id) ON DELETE CASCADE,
    estrellas smallint NOT NULL CHECK (estrellas BETWEEN 1 AND 3),
    actualizada_en timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (perfil_id, cancion_id)
);

-- El backend lee con su propia conexión; así nadie la lee ni la escribe por la API pública de Supabase
ALTER TABLE public.canciones_estrellas ENABLE ROW LEVEL SECURITY;
