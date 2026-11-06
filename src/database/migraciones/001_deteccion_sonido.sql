-- Detección de sonido: agrega la práctica de cada ejercicio y la opción de omitir lecciones.
-- No modifica ni borra datos existentes: las filas actuales quedan con práctica NULL y sin omitir.
BEGIN;

-- Nota o acorde que el alumno practica con el micrófono. Con NULL, la app usa cuerda y traste_objetivo.
-- Formato: { "tipo": "nota" | "acorde", "nombre": "Do mayor",
--            "posiciones": [{ "cuerda": 5, "traste": 3, "dedo": 3 }, ...] }
-- cuerda: 1 a 6 (1 = la más aguda); traste: 0 = al aire; dedo: 1 a 4, opcional y repetible (cejilla).
-- Una cuerda que no aparece no se toca. El CHECK no puede impedir que se repita una cuerda.
ALTER TABLE ejercicios
    ADD COLUMN IF NOT EXISTS practica jsonb;

ALTER TABLE ejercicios
    DROP CONSTRAINT IF EXISTS ejercicios_practica_valida;

-- COALESCE: en SQL un CHECK que da NULL se acepta, y un campo faltante daría NULL
ALTER TABLE ejercicios
    ADD CONSTRAINT ejercicios_practica_valida CHECK (
        practica IS NULL OR COALESCE(
            jsonb_typeof(practica) = 'object'
            AND practica->>'tipo' IN ('nota', 'acorde')
            AND jsonb_typeof(practica->'nombre') = 'string'
            AND jsonb_typeof(practica->'posiciones') = 'array'
            AND jsonb_array_length(practica->'posiciones') > 0
            AND NOT jsonb_path_exists(practica, '$.posiciones[*] ? (
                !(@.cuerda.type() == "number") || !(@.traste.type() == "number")
                || @.cuerda < 1 || @.cuerda > 6 || @.traste < 0
                || @.cuerda.floor() != @.cuerda || @.traste.floor() != @.traste
                || @.dedo.type() != "number" || @.dedo < 1 || @.dedo > 4
            )'),
            false
        )
    );

-- Lección salteada: cuenta como completada para desbloquear la siguiente, pero no dio XP.
-- Si después la toca bien, gana el XP una sola vez y esto vuelve a false.
ALTER TABLE progreso_ejercicios
    ADD COLUMN IF NOT EXISTS omitida boolean NOT NULL DEFAULT false;

COMMIT;
