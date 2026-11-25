-- 009: favoritos de canciones por perfil y datos extra de cada canción (género, portada, dificultad).
--   npm run migrar -- 009_canciones_favoritas.sql
-- Se puede correr más de una vez sin romper nada. No toca datos existentes.
-- Después de aplicarla, correr: npm run seed:canciones (carga género y dificultad de cada canción).

-- 1) Favoritas: una fila por perfil y canción. Si se borra el perfil o la canción, la fila se borra sola.
CREATE TABLE IF NOT EXISTS public.canciones_favoritas (
    perfil_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    cancion_id text NOT NULL REFERENCES public.canciones_practica(id) ON DELETE CASCADE,
    creada_en timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (perfil_id, cancion_id)
);

-- El backend lee con su propia conexión; así nadie la lee ni la escribe por la API pública de Supabase
ALTER TABLE public.canciones_favoritas ENABLE ROW LEVEL SECURITY;

-- 2) Datos extra de la canción (todos opcionales: si falta alguno, la app usa su valor por defecto)
--   genero:     texto libre ("Rock en español"); la app arma los filtros con los valores distintos.
--   portada:    URL de una imagen.
--   dificultad: 'facil' | 'intermedia' | 'dificil'.
ALTER TABLE public.canciones_practica ADD COLUMN IF NOT EXISTS genero text;
ALTER TABLE public.canciones_practica ADD COLUMN IF NOT EXISTS portada text;
ALTER TABLE public.canciones_practica ADD COLUMN IF NOT EXISTS dificultad text;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'canciones_practica_dificultad_valida') THEN
        ALTER TABLE public.canciones_practica
            ADD CONSTRAINT canciones_practica_dificultad_valida CHECK (dificultad IN ('facil', 'intermedia', 'dificil'));
    END IF;
END $$;
