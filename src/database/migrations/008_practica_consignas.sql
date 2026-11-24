-- 008: formatos nuevos de práctica del temario de los cursos 1 a 5.
-- Es la misma función practica_valida de 007, con estas ramas nuevas:
--   consignas:   { tipo: 'consignas', nombre?, consignas: [ { ...práctica de otro tipo, instruccion } ] }
--                Varias prácticas seguidas en una misma clase; cada una lleva su instrucción.
--   notasAlAzar: { tipo: 'notasAlAzar', nombre?, cantidad, cuerdas: [1..6], trastes: [0..12],
--                  dedo: 1..4 | dedoPorTraste: true, vecesPorTraste?: n }
--                Las notas se arman distintas cada vez que se entra a la clase.
-- Y estos campos opcionales:
--   secuencia.tempo:  { bpm, duraciones, aprobar?, escalon? }
--                     (aprobar: 0.1 a 1; escalon: factor entre 0 y 1 exclusivos, p. ej. 0.5: el alumno puede practicar a esa fracción de la velocidad, pero eso no aprueba la clase)
--   cancion:          bpm? (pisa el tempo de la canción en esa consigna), aprobar?, escalon?
-- No toca datos: solo reemplaza la función.

-- Revisa el tempo de una secuencia: una duración por nota y, si están, aprobar y escalon bien escritos
CREATE OR REPLACE FUNCTION public.practica_tempo_valido(t jsonb, cantidad_pasos int)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
    BEGIN
      IF jsonb_typeof(t) IS DISTINCT FROM 'object' THEN RETURN false; END IF;
      IF jsonb_typeof(t->'bpm') IS DISTINCT FROM 'number' OR (t->>'bpm')::numeric NOT BETWEEN 30 AND 240 THEN RETURN false; END IF;
      IF jsonb_typeof(t->'duraciones') IS DISTINCT FROM 'array' OR jsonb_array_length(t->'duraciones') <> cantidad_pasos THEN RETURN false; END IF;
      IF jsonb_path_exists(t->'duraciones', '$[*] ? (@.type() != "number" || @ <= 0)') THEN RETURN false; END IF;
      IF t ? 'aprobar' AND (jsonb_typeof(t->'aprobar') <> 'number' OR (t->>'aprobar')::numeric NOT BETWEEN 0.1 AND 1) THEN RETURN false; END IF;
      IF t ? 'escalon' AND (jsonb_typeof(t->'escalon') <> 'number' OR (t->>'escalon')::numeric <= 0 OR (t->>'escalon')::numeric >= 1) THEN RETURN false; END IF;
      RETURN true;
    END
$function$;

CREATE OR REPLACE FUNCTION public.practica_valida(p jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
    DECLARE paso jsonb; preg jsonb; cu jsonb; n int; vistas int[] := '{}'; num int;
            compas numeric; subdivision numeric; etapa jsonb; consigna jsonb;
    BEGIN
      IF p IS NULL THEN RETURN true; END IF;
      IF jsonb_typeof(p) <> 'object' THEN RETURN false; END IF;
      IF p->>'tipo' IN ('nota', 'acorde') THEN
        IF jsonb_typeof(p->'nombre') IS DISTINCT FROM 'string' THEN RETURN false; END IF;
        RETURN public.practica_posiciones_validas(p->'posiciones');
      ELSIF p->>'tipo' = 'secuencia' THEN
        IF p ? 'nombre' AND jsonb_typeof(p->'nombre') <> 'string' THEN RETURN false; END IF;
        IF jsonb_typeof(p->'pasos') IS DISTINCT FROM 'array' THEN RETURN false; END IF;
        IF jsonb_array_length(p->'pasos') < 3 THEN RETURN false; END IF;
        IF p ? 'tempo' AND NOT public.practica_tempo_valido(p->'tempo', jsonb_array_length(p->'pasos')) THEN RETURN false; END IF;
        FOR paso IN SELECT value FROM jsonb_array_elements(p->'pasos') LOOP
          IF jsonb_typeof(paso) IS DISTINCT FROM 'object' THEN RETURN false; END IF;
          IF COALESCE(paso->>'tipo', '') NOT IN ('nota', 'acorde') THEN RETURN false; END IF;
          IF paso->>'tipo' = 'acorde' AND jsonb_typeof(paso->'nombre') IS DISTINCT FROM 'string' THEN RETURN false; END IF;
          IF NOT public.practica_posiciones_validas(paso->'posiciones') THEN RETURN false; END IF;
        END LOOP;
        RETURN true;
      ELSIF p->>'tipo' = 'quiz' THEN
        IF p ? 'nombre' AND jsonb_typeof(p->'nombre') <> 'string' THEN RETURN false; END IF;
        IF p ? 'imagen' AND jsonb_typeof(p->'imagen') <> 'string' THEN RETURN false; END IF;
        IF jsonb_typeof(p->'preguntas') IS DISTINCT FROM 'array' THEN RETURN false; END IF;
        IF jsonb_array_length(p->'preguntas') < 1 THEN RETURN false; END IF;
        FOR preg IN SELECT value FROM jsonb_array_elements(p->'preguntas') LOOP
          IF jsonb_typeof(preg) IS DISTINCT FROM 'object' THEN RETURN false; END IF;
          IF jsonb_typeof(preg->'pregunta') IS DISTINCT FROM 'string' THEN RETURN false; END IF;
          IF jsonb_typeof(preg->'opciones') IS DISTINCT FROM 'array' THEN RETURN false; END IF;
          n := jsonb_array_length(preg->'opciones');
          IF n < 2 THEN RETURN false; END IF;
          IF jsonb_path_exists(preg->'opciones', '$[*] ? (@.type() != "string")') THEN RETURN false; END IF;
          IF jsonb_typeof(preg->'correcta') IS DISTINCT FROM 'number' THEN RETURN false; END IF;
          IF (preg->>'correcta')::numeric <> floor((preg->>'correcta')::numeric)
             OR (preg->>'correcta')::numeric < 0 OR (preg->>'correcta')::numeric >= n THEN RETURN false; END IF;
          IF preg ? 'explicacion' AND jsonb_typeof(preg->'explicacion') <> 'string' THEN RETURN false; END IF;
          IF preg ? 'imagen' AND jsonb_typeof(preg->'imagen') <> 'string' THEN RETURN false; END IF;
          IF preg ? 'recorte' AND NOT public.practica_recorte_valido(preg->'recorte') THEN RETURN false; END IF;
          IF preg ? 'marcador' AND jsonb_typeof(preg->'marcador') <> 'object' THEN RETURN false; END IF;
        END LOOP;
        RETURN true;
      ELSIF p->>'tipo' = 'afinacion' THEN
        IF p ? 'nombre' AND jsonb_typeof(p->'nombre') <> 'string' THEN RETURN false; END IF;
        IF p ? 'toleranciaCents' AND (jsonb_typeof(p->'toleranciaCents') <> 'number'
           OR (p->>'toleranciaCents')::numeric NOT BETWEEN 1 AND 50) THEN RETURN false; END IF;
        IF p ? 'msEstable' AND (jsonb_typeof(p->'msEstable') <> 'number'
           OR (p->>'msEstable')::numeric NOT BETWEEN 200 AND 10000) THEN RETURN false; END IF;
        IF jsonb_typeof(p->'cuerdas') IS DISTINCT FROM 'array' THEN RETURN false; END IF;
        IF jsonb_array_length(p->'cuerdas') < 1 THEN RETURN false; END IF;
        FOR cu IN SELECT value FROM jsonb_array_elements(p->'cuerdas') LOOP
          IF jsonb_typeof(cu) IS DISTINCT FROM 'object' THEN RETURN false; END IF;
          IF jsonb_typeof(cu->'cuerda') IS DISTINCT FROM 'number' THEN RETURN false; END IF;
          IF (cu->>'cuerda')::numeric <> floor((cu->>'cuerda')::numeric)
             OR (cu->>'cuerda')::numeric NOT BETWEEN 1 AND 6 THEN RETURN false; END IF;
          num := (cu->>'cuerda')::int;
          IF num = ANY(vistas) THEN RETURN false; END IF;
          vistas := vistas || num;
          IF cu ? 'nota' AND jsonb_typeof(cu->'nota') <> 'string' THEN RETURN false; END IF;
          IF cu ? 'frecuencia' AND (jsonb_typeof(cu->'frecuencia') <> 'number'
             OR (cu->>'frecuencia')::numeric NOT BETWEEN 40 AND 1000) THEN RETURN false; END IF;
        END LOOP;
        RETURN true;
      ELSIF p->>'tipo' = 'ritmo' THEN
        IF p ? 'nombre' AND jsonb_typeof(p->'nombre') <> 'string' THEN RETURN false; END IF;
        IF jsonb_typeof(p->'compas') IS DISTINCT FROM 'number' THEN RETURN false; END IF;
        compas := (p->>'compas')::numeric;
        IF compas <> floor(compas) OR compas NOT BETWEEN 1 AND 12 THEN RETURN false; END IF;
        subdivision := 1;
        IF p ? 'subdivision' THEN
          IF jsonb_typeof(p->'subdivision') <> 'number' THEN RETURN false; END IF;
          subdivision := (p->>'subdivision')::numeric;
          IF subdivision <> floor(subdivision) OR subdivision NOT BETWEEN 1 AND 4 THEN RETURN false; END IF;
        END IF;
        IF p ? 'patron' THEN
          IF jsonb_typeof(p->'patron') <> 'array' THEN RETURN false; END IF;
          IF jsonb_array_length(p->'patron') <> compas * subdivision THEN RETURN false; END IF;
          IF jsonb_path_exists(p->'patron', '$[*] ? (@.type() != "number" || (@ != 0 && @ != 1))') THEN RETURN false; END IF;
          IF NOT jsonb_path_exists(p->'patron', '$[*] ? (@ == 1)') THEN RETURN false; END IF;
        END IF;
        IF jsonb_typeof(p->'etapas') IS DISTINCT FROM 'array' THEN RETURN false; END IF;
        IF jsonb_array_length(p->'etapas') < 1 THEN RETURN false; END IF;
        FOR etapa IN SELECT value FROM jsonb_array_elements(p->'etapas') LOOP
          IF jsonb_typeof(etapa) IS DISTINCT FROM 'object' THEN RETURN false; END IF;
          IF jsonb_typeof(etapa->'bpm') IS DISTINCT FROM 'number'
             OR (etapa->>'bpm')::numeric NOT BETWEEN 30 AND 240 THEN RETURN false; END IF;
          IF jsonb_typeof(etapa->'compases') IS DISTINCT FROM 'number'
             OR (etapa->>'compases')::numeric <> floor((etapa->>'compases')::numeric)
             OR (etapa->>'compases')::numeric NOT BETWEEN 1 AND 200 THEN RETURN false; END IF;
        END LOOP;
        IF p ? 'cuenta' AND (jsonb_typeof(p->'cuenta') <> 'number'
           OR (p->>'cuenta')::numeric <> floor((p->>'cuenta')::numeric)
           OR (p->>'cuenta')::numeric NOT BETWEEN 0 AND 4) THEN RETURN false; END IF;
        IF p ? 'clicQueDesaparece' AND jsonb_typeof(p->'clicQueDesaparece') <> 'boolean' THEN RETURN false; END IF;
        IF p ? 'aprobar' AND (jsonb_typeof(p->'aprobar') <> 'number'
           OR (p->>'aprobar')::numeric NOT BETWEEN 0.1 AND 1) THEN RETURN false; END IF;
        RETURN true;
      ELSIF p->>'tipo' = 'cancion' THEN
        IF p ? 'nombre' AND jsonb_typeof(p->'nombre') <> 'string' THEN RETURN false; END IF;
        IF jsonb_typeof(p->'cancionId') IS DISTINCT FROM 'string' OR p->>'cancionId' = '' THEN RETURN false; END IF;
        IF COALESCE(p->>'fase', '') NOT IN ('aprender', 'tocar') THEN RETURN false; END IF;
        IF p ? 'bpm' AND (jsonb_typeof(p->'bpm') <> 'number' OR (p->>'bpm')::numeric NOT BETWEEN 30 AND 240) THEN RETURN false; END IF;
        IF p ? 'aprobar' AND (jsonb_typeof(p->'aprobar') <> 'number' OR (p->>'aprobar')::numeric NOT BETWEEN 0.1 AND 1) THEN RETURN false; END IF;
        IF p ? 'escalon' AND (jsonb_typeof(p->'escalon') <> 'number' OR (p->>'escalon')::numeric <= 0 OR (p->>'escalon')::numeric >= 1) THEN RETURN false; END IF;
        RETURN true;
      ELSIF p->>'tipo' = 'consignas' THEN
        IF p ? 'nombre' AND jsonb_typeof(p->'nombre') <> 'string' THEN RETURN false; END IF;
        IF jsonb_typeof(p->'consignas') IS DISTINCT FROM 'array' THEN RETURN false; END IF;
        IF jsonb_array_length(p->'consignas') < 1 THEN RETURN false; END IF;
        FOR consigna IN SELECT value FROM jsonb_array_elements(p->'consignas') LOOP
          IF jsonb_typeof(consigna) IS DISTINCT FROM 'object' THEN RETURN false; END IF;
          IF consigna->>'tipo' = 'consignas' THEN RETURN false; END IF;
          IF jsonb_typeof(consigna->'instruccion') IS DISTINCT FROM 'string' OR consigna->>'instruccion' = '' THEN RETURN false; END IF;
          IF NOT public.practica_valida(consigna) THEN RETURN false; END IF;
        END LOOP;
        RETURN true;
      ELSIF p->>'tipo' = 'notasAlAzar' THEN
        IF p ? 'nombre' AND jsonb_typeof(p->'nombre') <> 'string' THEN RETURN false; END IF;
        IF jsonb_typeof(p->'cantidad') IS DISTINCT FROM 'number'
           OR (p->>'cantidad')::numeric <> floor((p->>'cantidad')::numeric)
           OR (p->>'cantidad')::numeric NOT BETWEEN 1 AND 50 THEN RETURN false; END IF;
        IF jsonb_typeof(p->'cuerdas') IS DISTINCT FROM 'array' OR jsonb_array_length(p->'cuerdas') < 1 THEN RETURN false; END IF;
        IF jsonb_path_exists(p->'cuerdas', '$[*] ? (@.type() != "number" || @ < 1 || @ > 6 || @ != @.floor())') THEN RETURN false; END IF;
        IF jsonb_typeof(p->'trastes') IS DISTINCT FROM 'array' OR jsonb_array_length(p->'trastes') < 1 THEN RETURN false; END IF;
        IF jsonb_path_exists(p->'trastes', '$[*] ? (@.type() != "number" || @ < 0 || @ > 12 || @ != @.floor())') THEN RETURN false; END IF;
        IF p ? 'dedo' AND (jsonb_typeof(p->'dedo') <> 'number' OR (p->>'dedo')::numeric NOT BETWEEN 1 AND 4
           OR (p->>'dedo')::numeric <> floor((p->>'dedo')::numeric)) THEN RETURN false; END IF;
        IF p ? 'dedoPorTraste' AND jsonb_typeof(p->'dedoPorTraste') <> 'boolean' THEN RETURN false; END IF;
        -- Tiene que decir con qué dedo se pisa: uno fijo o el número del traste
        IF NOT (p ? 'dedo') AND COALESCE((p->>'dedoPorTraste')::boolean, false) = false THEN RETURN false; END IF;
        IF p ? 'vecesPorTraste' THEN
          IF jsonb_typeof(p->'vecesPorTraste') <> 'number' OR (p->>'vecesPorTraste')::numeric < 1
             OR (p->>'vecesPorTraste')::numeric <> floor((p->>'vecesPorTraste')::numeric) THEN RETURN false; END IF;
          IF (p->>'cantidad')::numeric <> jsonb_array_length(p->'trastes') * (p->>'vecesPorTraste')::numeric THEN RETURN false; END IF;
        END IF;
        RETURN true;
      END IF;
      RETURN false;
    END
$function$;
