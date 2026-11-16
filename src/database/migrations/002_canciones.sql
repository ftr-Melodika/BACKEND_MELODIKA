-- 002: canciones de la sección Práctica (antes estaban fijas en el frontend).
-- Se llama canciones_practica porque ya existe otra tabla "canciones" (con cancion_versiones) que no se toca.
-- Cada canción trae todo lo necesario para aprenderla y tocarla:
--   progresion: un elemento por compás (4/4):
--     { "acordes": "Em C", "rasgueo": "D-D-UUDD" }
--     - acordes: uno o dos, separados por espacio (con dos, medio compás cada uno).
--     - rasgueo: 8 corcheas (1 y 2 y 3 y 4 y) o 16 semicorcheas (1 e y a 2 e y a …). D = abajo, U = arriba, X = golpe apagado,
--       - = la mano pasa sin tocar. Con dos acordes, las 4 primeras son del primero y las
--       4 últimas del segundo, salvo que un "|" marque dónde cambia ("DD|UUDDDU": 2 y 6).
--   formas: cómo se arma cada acorde que usa: { "Em": [{ cuerda, traste, dedo? }, …] }.
--   nota_rasgueo: aclaración opcional sobre el rasgueo ("↓ solo en las primeras estrofas…").
-- Se cargan con: npm run seed:canciones
CREATE TABLE IF NOT EXISTS public.canciones_practica (
  id text PRIMARY KEY,
  titulo text NOT NULL,
  artista text NOT NULL,
  bpm integer NOT NULL CHECK (bpm BETWEEN 40 AND 220),
  capo integer NOT NULL DEFAULT 0 CHECK (capo BETWEEN 0 AND 7),
  progresion jsonb NOT NULL CHECK (jsonb_typeof(progresion) = 'array' AND jsonb_array_length(progresion) > 0),
  formas jsonb NOT NULL CHECK (jsonb_typeof(formas) = 'object'),
  nota_rasgueo text,
  consejo text NOT NULL,
  orden integer NOT NULL DEFAULT 0
);

-- El backend lee con su propia conexión; así nadie la lee ni la escribe por la API pública de Supabase
ALTER TABLE public.canciones_practica ENABLE ROW LEVEL SECURITY;
