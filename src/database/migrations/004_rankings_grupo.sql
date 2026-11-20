-- 004: rankings por grupo (reemplaza al ranking global).
--   npm run migrar -- 004_rankings_grupo.sql
-- Un grupo tiene como mucho un ranking. Se crea al invitar y cada miembro entra al aceptar.

-- Tipo de mensaje: 'texto' (normal) o 'invitacion_ranking' (tarjeta con botón Aceptar en el chat)
ALTER TABLE public.mensajes ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'texto';

CREATE TABLE IF NOT EXISTS public.grupo_rankings (
    chat_id    uuid PRIMARY KEY REFERENCES public.chats(id) ON DELETE CASCADE,
    creador_id uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ranking_participantes (
    chat_id    uuid NOT NULL REFERENCES public.grupo_rankings(chat_id) ON DELETE CASCADE,
    perfil_id  uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (chat_id, perfil_id)
);

CREATE INDEX IF NOT EXISTS ranking_participantes_perfil_idx ON public.ranking_participantes (perfil_id);
