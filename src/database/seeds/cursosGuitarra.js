// Archivo: src/database/seeds/cursosGuitarra.js
// Contenido de los 6 cursos de guitarra (plan nuevo). Lo carga seedCursos.js.
//
// Cada "clase" del plan se divide en lecciones (filas de `ejercicios`), una por actividad.
// El nombre de cada lección empieza con el número de clase ("1.3 · ...").
//
// Lo que la app todavía no puede medir (tempo, oído, grabaciones, pistas, contador de cambios…)
// queda como una lección de teoría marcada "Próximamente": explica la actividad y se puede
// completar, para que el curso se pueda recorrer de punta a punta mientras se programa.
//
// Los videos todavía no existen: el contenido de cada 🎬 está en el texto de teoría.
// Cuando haya videos, se completa `youtube_id` en la lección de teoría de cada clase.
import { readFileSync } from 'node:fs';

const QUIZZES = JSON.parse(readFileSync(new URL('./quizzesBase.json', import.meta.url), 'utf8'));

const GUITARRA = '6c990a6d-47cd-4df8-83bd-acbb521da352';

// ───────────────────────── Ayudas para armar prácticas ─────────────────────────

const NOTAS = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
const MIDI_AL_AIRE = { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 };
const nombreNota = (cuerda, traste) => NOTAS[(MIDI_AL_AIRE[cuerda] + traste) % 12];

// Posición: cuerda (1 = Mi agudo), traste (0 = al aire) y dedo (1 índice … 4 meñique)
const p = (cuerda, traste, dedo) => (traste === 0 ? { cuerda, traste } : { cuerda, traste, dedo });
const nota = (cuerda, traste, dedo) => ({ tipo: 'nota', nombre: nombreNota(cuerda, traste), posiciones: [p(cuerda, traste, dedo)] });
// Lista de [cuerda, traste, dedo] -> pasos de nota
const notas = (lista) => lista.map(([c, t, d]) => nota(c, t, d));

// Formas de los acordes (los mismos nombres que usa la app)
const ACORDES = {
  Mim: [p(6, 0), p(5, 2, 2), p(4, 2, 3), p(3, 0), p(2, 0), p(1, 0)],
  Lam: [p(5, 0), p(4, 2, 2), p(3, 2, 3), p(2, 1, 1), p(1, 0)],
  Re: [p(4, 0), p(3, 2, 1), p(2, 3, 3), p(1, 2, 2)],
  La: [p(5, 0), p(4, 2, 1), p(3, 2, 2), p(2, 2, 3), p(1, 0)],
  Mi: [p(6, 0), p(5, 2, 2), p(4, 2, 3), p(3, 1, 1), p(2, 0), p(1, 0)],
  Do: [p(5, 3, 3), p(4, 2, 2), p(3, 0), p(2, 1, 1), p(1, 0)],
  Sol: [p(6, 3, 2), p(5, 2, 1), p(4, 0), p(3, 0), p(2, 0), p(1, 3, 3)],
  // Sol con 4 dedos: el dedo 3 queda en la 2da cuerda, igual que en Re (dedo fijo)
  Sol4: [p(6, 3, 2), p(5, 2, 1), p(4, 0), p(3, 0), p(2, 3, 3), p(1, 3, 4)],
  Si7: [p(5, 2, 2), p(4, 1, 1), p(3, 2, 3), p(2, 0), p(1, 2, 4)],
  // Versión fácil de Si menor
  Sim7: [p(5, 2, 1), p(4, 0), p(3, 2, 2), p(2, 0), p(1, 2, 3)],
};
// El Sol de 4 dedos se llama Sol en pantalla
const acorde = (nombre) => ({ tipo: 'acorde', nombre: nombre === 'Sol4' ? 'Sol' : nombre, posiciones: ACORDES[nombre] });
// Con `tempo` ({ bpm, duraciones: pulsos de cada paso }), después de las notas una por una la app
// muestra el riff en movimiento: las notas avanzan y hay que tocarlas a tiempo
const secuencia = (nombre, pasos, tempo) => ({ tipo: 'secuencia', nombre, pasos, ...(tempo ? { tempo } : {}) });
const DOS_PARTES = 'Primero aprendés las notas una por una. Después vienen a tempo: avanzan por el mástil y tocás cada una cuando pasa por la línea amarilla.';
const acordes = (nombre, lista) => secuencia(nombre, lista.map(acorde));
// Alterna dos acordes: A B A B …
const cambio = (a, b, veces = 4) => acordes(`${a === 'Sol4' ? 'Sol' : a} ↔ ${b === 'Sol4' ? 'Sol' : b}`, Array.from({ length: veces * 2 }, (_, i) => (i % 2 ? b : a)));

// Ejercicio de tempo con metrónomo (ver src/utils/ritmo.js en el frontend).
// etapas: [[bpm, compases], …]. patron: qué partes del compás se tocan (en corcheas, 1 y 2 y 3 y 4 y).
const ritmo = (nombre, etapas, { compas = 4, subdivision, patron, clicQueDesaparece, aprobar } = {}) => ({
  tipo: 'ritmo', nombre, compas,
  ...(subdivision ? { subdivision } : {}),
  ...(patron ? { patron } : {}),
  etapas: etapas.map(([bpm, compases]) => ({ bpm, compases })),
  ...(clicQueDesaparece ? { clicQueDesaparece } : {}),
  ...(aprobar ? { aprobar } : {}),
});

// "Acorde perfecto": cuerda por cuerda, de la más grave a la más aguda, y al final el acorde entero
function acordePerfecto(nombre) {
  const posiciones = [...ACORDES[nombre]].sort((a, b) => b.cuerda - a.cuerda);
  const pasos = posiciones.map((pos) => ({ tipo: 'nota', nombre: nombreNota(pos.cuerda, pos.traste), posiciones: [pos] }));
  return secuencia(`${nombre === 'Sol4' ? 'Sol' : nombre} perfecto`, [...pasos, acorde(nombre)]);
}

// ───────────────────────── Tipos de lección ─────────────────────────

const XP_PRACTICA = 50;
const XP_TEORIA = 30;
const AVISO_PROXIMAMENTE = '🚧 Próximamente: la app todavía no mide esta actividad. Por ahora hacela por tu cuenta y marcá la lección como terminada.';

// Teoría (el contenido del video de la clase), con un quiz opcional
const teoria = (nombre, texto, { destacado = null, instrucciones = [], practica = null, descripcion = null } = {}) => ({
  nombre, tipo: 'teoria', descripcion, texto_teoria: texto, texto_destacado: destacado, instrucciones, practica, xp: XP_TEORIA,
});
// Tocar: secuencia de notas o acordes que la app detecta por el micrófono
// Los ejercicios de tempo se hacen aplaudiendo: la app escucha los aplausos mucho mejor que la guitarra
const AVISO_APLAUSO = '👏 Hacelo aplaudiendo: por ahora la app escucha los aplausos mucho mejor que la guitarra.';
const practica = (nombre, practicaJson, { texto = null, destacado = null, instrucciones = [], descripcion = null } = {}) => ({
  nombre, tipo: 'practica', descripcion, texto_teoria: texto,
  texto_destacado: practicaJson?.tipo === 'ritmo' ? [AVISO_APLAUSO, destacado].filter(Boolean).join(' ') : destacado,
  instrucciones, practica: practicaJson, xp: XP_PRACTICA,
});
// Actividad que la app todavía no soporta
const proximamente = (nombre, texto, instrucciones = []) => ({
  nombre, tipo: 'teoria', descripcion: 'Próximamente', texto_teoria: texto, texto_destacado: AVISO_PROXIMAMENTE, instrucciones, practica: null, xp: XP_TEORIA,
});
// Práctica que la app ya detecta, con una parte (tempo, memoria…) que todavía no mide
const conParteProxima = (nombre, practicaJson, texto, parte) =>
  practica(nombre, practicaJson, { texto, destacado: `🚧 ${parte} todavía no lo mide la app: por ahora se aprueba con las notas correctas.` });

// ───────────────────────── Curso 1: Primeros pasos ─────────────────────────

const curso1 = {
  id: 'b0000000-0000-4000-a000-000000000001',
  nombre: 'Primeros pasos',
  descripcion: 'Conocé la guitarra, afinala, aprendé a leer el mástil de Melodika y tocá tus primeras melodías. ≈2 semanas.',
  nivel: 'principiante',
  orden: 1,
  lecciones: [
    teoria('1.1 · Cómo funciona la guitarra',
      'Las partes de la guitarra: el cuerpo, el mástil, las clavijas, los trastes y la boca. Al tocar una cuerda, vibra, y la boca y el cuerpo amplifican ese sonido. Las cuerdas tienen nombre y número: la 1 es la más fina. De la 6 a la 1 suenan Mi, La, Re, Sol, Si, Mi.',
      { destacado: 'La cuerda 1 es la más fina y la 6 la más gruesa.', practica: QUIZZES['Las partes de la guitarra'] }),
    teoria('1.1 · Quiz: las cuerdas',
      'Repasemos el nombre y el número de cada cuerda.',
      { practica: { tipo: 'quiz', nombre: 'Las cuerdas', preguntas: [
        { pregunta: '¿Cuál es la cuerda 1?', opciones: ['La más fina', 'La más gruesa', 'La del medio'], correcta: 0, explicacion: 'La 1 es la más fina, la que suena más aguda.' },
        { pregunta: '¿Cómo suena la cuerda 6 al aire?', opciones: ['Mi', 'La', 'Sol', 'Si'], correcta: 0, explicacion: 'De la 6 a la 1: Mi, La, Re, Sol, Si, Mi.' },
        { pregunta: '¿Cómo suena la cuerda 5 al aire?', opciones: ['Re', 'La', 'Mi', 'Sol'], correcta: 1, explicacion: 'La 5 es La.' },
        { pregunta: '¿Cómo suena la cuerda 3 al aire?', opciones: ['Si', 'Re', 'Sol', 'Mi'], correcta: 2, explicacion: 'La 3 es Sol.' },
        { pregunta: '¿Qué dos cuerdas suenan Mi?', opciones: ['La 1 y la 6', 'La 2 y la 5', 'La 3 y la 4', 'La 1 y la 2'], correcta: 0, explicacion: 'La 1 y la 6 son Mi: la 1 aguda y la 6 grave.' },
      ] } }),
    practica('1.1 · Tocá cada cuerda',
      secuencia('Cuerdas al aire', notas([[3, 0], [6, 0], [2, 0], [5, 0], [1, 0], [4, 0]])),
      { texto: 'La app te pide una cuerda y la tocás al aire, sin pisar nada.' }),
    practica('1.1 · Afinación guiada', QUIZZES['Afinación Básica (Standard)'],
      { texto: 'Afiná las 6 cuerdas, de la 6 a la 1. Girá la clavija despacio hasta que la aguja quede en el centro.' }),
    proximamente('1.1 · Oído: ¿más alta o más baja?',
      'La app toca dos notas y vos decís si la segunda es más alta (más aguda) o más baja (más grave) que la primera.'),

    teoria('1.2 · Postura y púa',
      'Sentate derecho, con la guitarra apoyada en la pierna y el mástil apenas levantado. El brazo de la mano que rasguea abraza el cuerpo de la guitarra. La púa se sostiene entre el pulgar y el costado del índice, con la punta asomando poco.',
      { destacado: 'Checklist frente al espejo: hacé cada punto antes de tocar.',
        instrucciones: ['Espalda derecha y hombros sueltos.', 'La guitarra apoyada firme, sin que se resbale.', 'El pulgar de la mano que pisa, detrás del mástil.', 'La púa entre el pulgar y el costado del índice, asomando poco.', 'La muñeca de la mano que rasguea, suelta, sin apretar.'] }),
    practica('1.2 · Púa estable', ritmo('Púa estable', [[60, 4]]),
      { texto: '16 golpes parejos en la cuerda 6 al aire, a 60 BPM: uno por cada pulso del metrónomo (el clic o, en iPhone, la luz), todos con el mismo volumen.' }),

    teoria('1.3 · Trastes, notas y dedos',
      'Un traste es cada una de las barritas de metal del mástil. Al pisar, la cuerda se acorta y suena más aguda: cada traste sube un poquito la nota. Las notas se llaman Do, Re, Mi, Fa, Sol, La, Si. Los dedos de la mano que pisa tienen número: índice 1, medio 2, anular 3 y meñique 4. El pulgar va detrás del mástil y no lleva número.',
      { destacado: 'Índice 1 · Medio 2 · Anular 3 · Meñique 4',
        practica: { tipo: 'quiz', nombre: 'Los dedos', preguntas: [
          { pregunta: '¿Qué número tiene el índice?', opciones: ['1', '2', '3', '4'], correcta: 0 },
          { pregunta: '¿Qué número tiene el anular?', opciones: ['1', '2', '3', '4'], correcta: 2 },
          { pregunta: '¿Qué número tiene el meñique?', opciones: ['1', '2', '3', '4'], correcta: 3 },
          { pregunta: '¿Y el pulgar?', opciones: ['1', '5', 'No lleva número: va detrás del mástil'], correcta: 2 },
          { pregunta: 'Si pisás un traste más arriba, la nota…', opciones: ['Suena más aguda', 'Suena más grave', 'Suena igual'], correcta: 0, explicacion: 'La cuerda se acorta y vibra más rápido.' },
        ] } }),
    practica('1.3 · Un dedo por traste',
      secuencia('Cuerda 1, trastes 1 a 4', notas([[1, 1, 1], [1, 2, 2], [1, 3, 3], [1, 4, 4]])),
      { texto: 'En la cuerda 1, pisá el traste 1 con el dedo 1, el 2 con el 2, el 3 con el 3 y el 4 con el 4.' }),
    practica('1.3 · Presión mínima', nota(2, 1, 1),
      { texto: 'Pisá la cuerda 2 en el traste 1 con la punta del dedo 1, cerca del traste, y mantené la nota 2 segundos. Probá apretar cada vez menos hasta encontrar la presión justa para que suene limpia.',
        destacado: '🚧 Detectar si la cuerda vibra (trastea) todavía no lo mide la app.' }),

    teoria('1.4 · El mástil de Melodika',
      'Así se lee el mástil de la app: la cuerda subrayada es la que se toca. El círculo con número te dice qué dedo usar y en qué traste. Si la cuerda está subrayada pero no tiene círculo, se toca al aire. Las cuerdas con ✕ no se tocan.',
      { destacado: 'Círculo con número = qué dedo y en qué traste.' }),
    practica('1.4 · Leé y tocá',
      secuencia('Tres frases cortas', notas([
        [3, 0], [3, 2, 2], [2, 0], [2, 1, 1],
        [2, 3, 3], [2, 1, 1], [1, 0], [1, 1, 1],
        [4, 2, 2], [3, 0], [2, 0], [1, 0],
      ])),
      { texto: 'Leé cada posición en el mástil y tocala. La app avanza nota por nota.' }),
    practica('1.4 · Tu primer acorde: Mim', acordePerfecto('Mim'),
      { texto: 'Mi menor (Em) es el primer acorde que vas a leer del mástil. Armalo y tocalo cuerda por cuerda, de la 6 a la 1. Al final, rasgueá todas juntas.' }),

    conParteProxima('1.5 · Cromático 1-2-3-4',
      secuencia('Cromático en la cuerda 6', notas([[6, 1, 1], [6, 2, 2], [6, 3, 3], [6, 4, 4], [6, 1, 1], [6, 2, 2], [6, 3, 3], [6, 4, 4]])),
      'Trastes 1, 2, 3 y 4 en la cuerda 6, con los dedos 1, 2, 3 y 4. La meta es tocarlo parejo de 50 a 60 BPM.', 'El tempo'),
    conParteProxima('1.5 · La araña',
      secuencia('La araña', [6, 5, 4, 3, 2, 1].flatMap((c) => notas([[c, 1, 1], [c, 2, 2], [c, 3, 3], [c, 4, 4]]))),
      'El cromático 1-2-3-4 en las 6 cuerdas, de la 6 a la 1, sin levantar los dedos más de lo necesario. La meta: de 50 a 60 BPM.', 'El tempo'),

    teoria('1.6 · El pulso', 'El pulso es el latido parejo de la música. Lo marcás con el pie y es la base de todo lo que vas a tocar.',
      { practica: QUIZZES['El pulso'] }),
    practica('1.6 · Un golpe por clic', ritmo('Un golpe por clic', [[60, 4]]),
      { texto: 'Un golpe en una cuerda al aire por cada pulso del metrónomo (el clic o, en iPhone, la luz), a 60 BPM. Marcá el pulso con el pie.' }),
    practica('1.6 · Escalera de tempo', ritmo('Escalera de tempo', [[60, 2], [70, 2], [80, 2]]),
      { texto: 'El mismo ejercicio a 60, 70 y 80 BPM, sin parar: cada dos compases el tempo sube.' }),
    practica('1.6 · El clic que desaparece', ritmo('El clic que desaparece', [[60, 8]], { clicQueDesaparece: true }),
      { texto: 'El metrónomo se calla (o se apaga la luz) un compás de cada dos y vos tenés que seguir a tiempo, como si siguiera marcando.' }),

    practica('1.7 · Seven Nation Army',
      secuencia('Riff de Seven Nation Army', notas([[4, 2, 2], [4, 2, 2], [3, 0], [4, 2, 2], [4, 0], [5, 3, 3], [5, 2, 2]]),
        { bpm: 80, duraciones: [1.5, 0.5, 0.75, 0.75, 0.5, 2, 2] }),
      { texto: 'El riff de The White Stripes en las cuerdas 5, 4 y 3, dentro de los trastes 0 a 3.', destacado: DOS_PARTES }),
    practica('1.7 · Oda a la alegría',
      secuencia('Oda a la alegría', notas([[1, 0], [1, 0], [1, 1, 1], [1, 3, 3], [1, 3, 3], [1, 1, 1], [1, 0], [2, 3, 3], [2, 1, 1], [2, 1, 1], [2, 3, 3], [1, 0], [1, 0], [2, 3, 3], [2, 3, 3]]),
        { bpm: 90, duraciones: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 0.5, 2] }),
      { texto: 'La melodía de Beethoven (dominio público) en posición abierta, en las cuerdas 1 y 2.', destacado: DOS_PARTES }),
    proximamente('1.7 · Creatividad: tu propio riff', 'Inventá un riff propio de 4 a 8 notas con lo que aprendiste y grabalo.'),

    proximamente('Prueba de salida · Curso 1', 'Para terminar el curso: afiná la guitarra en menos de 2 minutos y tocá el riff de Seven Nation Army a 70 BPM.',
      ['Afiná las 6 cuerdas con el afinador en menos de 2 minutos.', 'Tocá el riff de Seven Nation Army a 70 BPM, sin cortar.']),
  ],
};

// ───────────────────────── Curso 2: Acordes ─────────────────────────

const AVISO_ACORDE_PERFECTO = 'Acorde perfecto: armalo y tocalo cuerda por cuerda. Si una cuerda no suena, revisá que la punta del dedo esté parada y cerca del traste.';

const curso2 = {
  id: 'b0000000-0000-4000-a000-000000000002',
  nombre: 'Acordes',
  descripcion: 'Los 8 acordes abiertos más usados, cada uno con el ejercicio "Acorde perfecto", y tus primeras canciones completas. ≈6 semanas.',
  nivel: 'principiante',
  orden: 2,
  lecciones: [
    teoria('2.1 · Cómo se arma un acorde',
      'Un acorde son varias notas que suenan juntas. Para que todas suenen: los dedos parados, apoyando con la punta, y cada dedo cerca del traste (no encima ni en el medio). El pulgar detrás del mástil, a la altura del dedo medio.',
      { destacado: 'Dedos parados · Punta del dedo · Cerca del traste' }),
    practica('2.1 · Acorde perfecto: Mim', acordePerfecto('Mim'), { texto: AVISO_ACORDE_PERFECTO }),
    practica('2.1 · Acorde perfecto: Lam', acordePerfecto('Lam'), { texto: AVISO_ACORDE_PERFECTO }),
    conParteProxima('2.1 · Mim y Lam de memoria', acordes('Mim y Lam', ['Mim', 'Lam', 'Mim', 'Lam', 'Mim', 'Lam']),
      'Soltá la mano entre cada acorde y volvé a armarlo sin mirar el mástil.', 'Esconder el mástil'),
    proximamente('2.1 · Jam rockero en Mim-Lam', 'Sobre una pista de batería y bajo, un rasgueo por compás alternando Mim y Lam.'),

    teoria('2.2 · El acorde de Re', 'Re (D) se toca en las 4 cuerdas más finas: la 5 y la 6 no suenan. Forma un triángulo con los dedos 1, 2 y 3.'),
    practica('2.2 · Acorde perfecto: Re', acordePerfecto('Re'), { texto: AVISO_ACORDE_PERFECTO }),
    conParteProxima('2.2 · Re de memoria', acordes('Re de memoria', ['Re', 'Mim', 'Re', 'Lam', 'Re']),
      'Armá Re 5 veces sin mirar: entre cada vez, soltá la mano o pasá por otro acorde.', 'Esconder el mástil'),
    proximamente('2.2 · Jam en Re con banda', 'Rasgueá Re sobre una pista con banda completa, un rasgueo por compás.'),

    teoria('2.3 · Los acordes de La y Mi', 'La (A) se toca con tres dedos en fila en el traste 2. Mi (E) tiene la misma forma que Mim con un dedo más: el 1 en la cuerda 3, traste 1.'),
    practica('2.3 · Acorde perfecto: La', acordePerfecto('La'), { texto: AVISO_ACORDE_PERFECTO }),
    practica('2.3 · Acorde perfecto: Mi', acordePerfecto('Mi'), { texto: AVISO_ACORDE_PERFECTO }),
    practica('2.3 · Three Little Birds', acordes('Three Little Birds', ['La', 'Re', 'La', 'Mi', 'La', 'Re', 'La']),
      { texto: 'La canción de Bob Marley con La, Re y Mi.' }),

    teoria('2.4 · Los acordes de Do y Sol', 'Do (C) usa los dedos 1, 2 y 3 en escalera. Sol (G) tiene dos versiones: con 3 dedos (más fácil) y con 4 dedos (deja el dedo 3 en la cuerda 2, que después sirve para cambiar rápido a Re).'),
    practica('2.4 · Acorde perfecto: Do', acordePerfecto('Do'), { texto: AVISO_ACORDE_PERFECTO }),
    practica('2.4 · Acorde perfecto: Sol (3 dedos)', acordePerfecto('Sol'), { texto: AVISO_ACORDE_PERFECTO }),
    practica('2.4 · Acorde perfecto: Sol (4 dedos)', acordePerfecto('Sol4'), { texto: AVISO_ACORDE_PERFECTO }),
    practica("2.4 · Knockin' on Heaven's Door", acordes("Knockin' on Heaven's Door", ['Sol', 'Re', 'Lam', 'Sol', 'Re', 'Do']),
      { texto: 'La canción de Bob Dylan (y de Guns N’ Roses) con Sol, Re, Lam y Do.' }),

    teoria('2.5 · Si7, el acorde del folklore', 'Si séptima (B7) usa los 4 dedos y no se toca la cuerda 6. Es el acorde que lleva a Mi: aparece en muchísimas zambas y chacareras.'),
    practica('2.5 · Acorde perfecto: Si7', acordePerfecto('Si7'), { texto: AVISO_ACORDE_PERFECTO }),
    practica('2.5 · Zamba de mi esperanza', acordes('Zamba de mi esperanza (simple, en Mi)', ['Mi', 'La', 'Si7', 'Mi', 'La', 'Si7', 'Mi']),
      { texto: 'Versión simple en Mi, con Mi, La y Si7. Por ahora con un rasgueo simple: el rasguido de zamba llega en Ritmo y rasgueo IV.' }),

    practica('2.6 · Stand By Me', acordes('Stand By Me', ['Sol', 'Mim', 'Do', 'Re', 'Sol']), { texto: 'Ben E. King: Sol, Mim, Do y Re.' }),
    practica('2.6 · Zombie', acordes('Zombie (simplificada)', ['Mim', 'Do', 'Sol', 'Re', 'Mim', 'Do', 'Sol', 'Re']), { texto: 'The Cranberries, simplificada: Mim, Do, Sol y Re.' }),
    practica('2.6 · De música ligera', acordes('De música ligera (tono adaptado)', ['Mim', 'Do', 'Sol', 'Re', 'Mim', 'Do', 'Sol', 'Re']),
      { texto: 'Soda Stereo en un tono adaptado: los mismos acordes que Zombie. En Musicalidad y tu primer concierto II vuelve en su tono original, con capo.' }),
    practica('2.6 · Wish You Were Here', acordes('Wish You Were Here (simplificada)', ['Mim', 'Sol', 'Do', 'Re', 'Lam', 'Sol', 'Re', 'Do', 'Lam', 'Sol']),
      { texto: 'Pink Floyd, simplificada: Do, Re, Lam, Sol y Mim.' }),

    proximamente('Prueba de salida · Curso 2', 'Para terminar el curso: los 8 acordes con "acorde perfecto" y 2 canciones completas.',
      ['Acorde perfecto de Mim, Lam, Re, La, Mi, Do, Sol y Si7.', 'Dos canciones completas a elección.']),
  ],
};

// ───────────────────────── Curso 3: Cambios de acordes ─────────────────────────

const AVISO_30_SEGUNDOS = 'Alterná los dos acordes. 🚧 El contador de cambios limpios en 30 segundos (y tu récord) llega próximamente: por ahora la app te guía cambio por cambio.';

const curso3 = {
  id: 'b0000000-0000-4000-a000-000000000003',
  nombre: 'Cambios de acordes',
  descripcion: 'Se hace en paralelo con el curso de Acordes. Técnicas para cambiar rápido: dedos fijos, dedo guía, formas que se trasladan y cambio anticipado. Meta: 20 cambios en 30 segundos.',
  nivel: 'principiante',
  orden: 2, // Mismo orden que "Acordes": se desbloquean juntos y se hacen en paralelo
  lecciones: [
    teoria('3.1 · Cómo se cambia de acorde',
      'Mirá el próximo acorde antes de cambiar. Mové los dedos juntos, en bloque, no de a uno. No los levantes más de lo necesario. Apoyá primero el dedo del bajo (la cuerda más grave del acorde). Y aprovechá los atajos: los dedos fijos (no se levantan), los dedos guía (se deslizan por la cuerda) y las formas que se trasladan (la misma forma de mano, movida).',
      { practica: { tipo: 'quiz', nombre: 'Cómo se cambia de acorde', preguntas: [
        { pregunta: '¿Cuándo hay que mirar el próximo acorde?', opciones: ['Antes de cambiar', 'Después de cambiar', 'Nunca'], correcta: 0 },
        { pregunta: '¿Cómo se mueven los dedos al cambiar?', opciones: ['De a uno', 'Juntos, en bloque', 'Primero el meñique'], correcta: 1 },
        { pregunta: '¿Qué dedo conviene apoyar primero?', opciones: ['El del bajo', 'El más agudo', 'Cualquiera'], correcta: 0, explicacion: 'El bajo es lo primero que suena al rasguear.' },
        { pregunta: '¿Qué es un dedo fijo?', opciones: ['Uno que no se levanta entre los dos acordes', 'El pulgar', 'Uno que no se usa'], correcta: 0 },
      ] } }),
    practica('3.1 · Primer cambio: Mim ↔ Lam', cambio('Mim', 'Lam'), { destacado: AVISO_30_SEGUNDOS, descripcion: 'Meta: 12 cambios en 30 segundos' }),
    conParteProxima('3.1 · Cambio lento', cambio('Mim', 'Lam', 3), 'Un cambio cada 4 tiempos a 60 BPM, sin cortar el sonido.', 'El tempo'),

    teoria('3.2 · Dedos fijos', 'Cuando dos acordes comparten un dedo en el mismo lugar, ese dedo no se levanta: queda apoyado y los demás se mueven alrededor. Do ↔ Lam: los dedos 1 y 2 quedan fijos. Mi ↔ Si7 y Mim ↔ Si7: queda fijo el dedo 2. Sol ↔ Re: con el Sol de 4 dedos, queda fijo el dedo 3.'),
    practica('3.2 · Do ↔ Lam', cambio('Do', 'Lam'), { texto: 'Los dedos 1 y 2 no se levantan.', destacado: AVISO_30_SEGUNDOS }),
    practica('3.2 · Mi ↔ Si7', cambio('Mi', 'Si7'), { texto: 'El dedo 2 no se levanta.', destacado: AVISO_30_SEGUNDOS }),
    practica('3.2 · Mim ↔ Si7', cambio('Mim', 'Si7'), { texto: 'El dedo 2 no se levanta.', destacado: AVISO_30_SEGUNDOS }),
    practica('3.2 · Sol ↔ Re', cambio('Sol4', 'Re'), { texto: 'Con el Sol de 4 dedos, el dedo 3 queda fijo en la cuerda 2.', destacado: AVISO_30_SEGUNDOS }),
    practica('3.2 · Estribillo de Zamba de mi esperanza', acordes('Estribillo en loop', ['Mi', 'La', 'Si7', 'Mi', 'La', 'Si7', 'Mi']),
      { texto: 'El estribillo en loop, con Mi, La y Si7.' }),

    teoria('3.3 · Dedo guía y formas que se trasladan', 'Dedo guía: en La ↔ Re, el dedo 3 se desliza por la cuerda 2 sin despegarse. Forma que se traslada: Mi ↔ Lam y Mim ↔ Lam usan la misma forma de mano, movida una cuerda.'),
    practica('3.3 · La ↔ Re', cambio('La', 'Re'), { texto: 'El dedo 3 se desliza por la cuerda 2.', destacado: AVISO_30_SEGUNDOS }),
    practica('3.3 · Mi ↔ Lam', cambio('Mi', 'Lam'), { texto: 'La misma forma, movida una cuerda.', destacado: AVISO_30_SEGUNDOS }),
    practica('3.3 · Mim ↔ Lam', cambio('Mim', 'Lam'), { texto: 'La misma forma, movida una cuerda.', destacado: AVISO_30_SEGUNDOS }),
    practica('3.3 · Three Little Birds completa', acordes('Three Little Birds', ['La', 'Re', 'La', 'Re', 'La', 'Mi', 'La', 'Re', 'La', 'Mi', 'La', 'Re', 'La'])),

    teoria('3.4 · Cambios sin dedos en común', 'Cuando dos acordes no comparten nada, mové la mano en bloque: pensá la forma completa del acorde que viene y apoyá primero el dedo del bajo.'),
    practica('3.4 · Do ↔ Sol', cambio('Do', 'Sol'), { destacado: AVISO_30_SEGUNDOS }),
    practica('3.4 · Re ↔ Mi', cambio('Re', 'Mi'), { destacado: AVISO_30_SEGUNDOS }),
    practica('3.4 · Stand By Me completa', acordes('Stand By Me', ['Sol', 'Mim', 'Do', 'Re', 'Sol', 'Mim', 'Do', 'Re', 'Sol'])),

    teoria('3.5 · Cambio anticipado', 'En el último golpe del compás se suelta el acorde para llegar a tiempo al siguiente. Suena una cuerda al aire por un instante, y está bien: el pulso no se corta.'),
    conParteProxima('3.5 · Sol - Re - Mim - Do', acordes('Sol - Re - Mim - Do', ['Sol', 'Re', 'Mim', 'Do', 'Sol', 'Re', 'Mim', 'Do']),
      'La progresión a 70 BPM, con cambio anticipado.', 'El tempo'),
    practica("3.5 · Knockin' on Heaven's Door completa", acordes("Knockin' on Heaven's Door", ['Sol', 'Re', 'Lam', 'Sol', 'Re', 'Do', 'Sol', 'Re', 'Lam', 'Sol', 'Re', 'Do'])),

    conParteProxima('3.6 · Forzar el cambio', acordes('Lam - Do - Sol - Mim', ['Lam', 'Do', 'Sol', 'Mim', 'Lam', 'Do', 'Sol', 'Mim']),
      'El pulso no se detiene aunque el acorde no esté listo: rasgueá igual y llegá como puedas.', 'El pulso'),
    conParteProxima('3.6 · De música ligera, cada vez más rápido', acordes('De música ligera', ['Mim', 'Do', 'Sol', 'Re', 'Mim', 'Do', 'Sol', 'Re']),
      'La canción con el tempo subiendo de a poco.', 'El tempo'),

    proximamente('Prueba de salida · Curso 3', 'Para terminar el curso: 20 cambios en 30 segundos en 5 pares (uno con Si7) y Zombie completa a tempo.',
      ['20 cambios limpios en 30 segundos en 5 pares de acordes, uno de ellos con Si7.', 'Zombie completa, a tempo.']),
  ],
};

// ───────────────────────── Curso 4: Ritmo y rasgueo ─────────────────────────

const curso4 = {
  id: 'b0000000-0000-4000-a000-000000000004',
  nombre: 'Ritmo y rasgueo',
  descripcion: 'Negras, corcheas, patrones de rasgueo, dinámica, golpe percusivo, 3/4 y 6/8, y tocar con banda. ≈5 semanas.',
  nivel: 'principiante',
  orden: 3,
  lecciones: [
    teoria('4.1 · Negras', 'Una negra es un golpe por tiempo: 1, 2, 3, 4. Rasgueá hacia abajo con la muñeca suelta.', { practica: QUIZZES['Tu primer rasgueo'] }),
    practica('4.1 · Negras con las cuerdas apagadas', ritmo('Negras', [[60, 2], [75, 2], [90, 2]]),
      { texto: 'Rasgueá negras con la mano que pisa apoyada sobre las cuerdas, sin apretarlas, de 60 a 90 BPM.' }),
    proximamente('4.1 · Acentos', 'Primero acentuá el tiempo 1; después el 2 y el 4.'),
    practica('4.1 · Stand By Me en negras', acordes('Stand By Me', ['Sol', 'Mim', 'Do', 'Re', 'Sol']),
      { destacado: '🚧 El rasgueo en negras todavía no lo mide la app: por ahora se aprueba con los acordes.' }),

    teoria('4.2 · Corcheas', 'Dos golpes por tiempo: abajo en el número y arriba en la "y". La mano no se detiene nunca.', { practica: QUIZZES['Abajo y arriba'] }),
    practica('4.2 · Abajo-arriba continuo', ritmo('Corcheas', [[60, 4]], { subdivision: 2 }),
      { texto: 'Corcheas abajo-arriba sin parar: abajo en los números, arriba en las "y". Primero con las cuerdas apagadas y después con un acorde.' }),
    practica('4.2 · Patrón universal', ritmo('Patrón universal', [[65, 4]], { subdivision: 2, patron: [1, 0, 1, 1, 0, 1, 1, 1] }),
      { texto: 'El patrón ↓ · ↓↑ · ↑↓↑: la mano sigue moviéndose en los huecos, sin tocar las cuerdas.' }),
    practica("4.2 · Knockin' on Heaven's Door con el patrón universal", acordes("Knockin' on Heaven's Door", ['Sol', 'Re', 'Lam', 'Sol', 'Re', 'Do']),
      { destacado: '🚧 El patrón todavía no lo mide la app: por ahora se aprueba con los acordes.' }),

    teoria('4.3 · Patrones esenciales', 'Cuatro patrones nuevos para variar el rasgueo según la canción.'),
    practica('4.3 · Patrón 1: abajo y arriba en el 2 y el 4', ritmo('Patrón 1', [[70, 4]], { subdivision: 2, patron: [1, 0, 1, 1, 1, 0, 1, 1] }),
      { texto: '↓ · ↓↑ ↓ · ↓↑: abajo en cada tiempo y un arriba extra después del 2 y del 4.' }),
    practica('4.3 · Patrón 2: rock', ritmo('Patrón 2', [[70, 4]], { subdivision: 2, patron: [1, 0, 1, 0, 1, 1, 1, 1] }),
      { texto: '↓ · ↓ · ↓↑ ↓↑: la primera mitad en negras y la segunda en corcheas.' }),
    practica('4.3 · Patrón 3: pop', ritmo('Patrón 3', [[70, 4]], { subdivision: 2, patron: [1, 0, 1, 1, 0, 1, 1, 0] }),
      { texto: '↓ · ↓↑ · ↑ ↓ ·: el arriba del 3 queda solo, sin el abajo antes.' }),
    practica('4.3 · Patrón 4: contratiempo', ritmo('Patrón 4', [[70, 4]], { subdivision: 2, patron: [0, 1, 0, 1, 0, 1, 0, 1] }),
      { texto: '· ↑ · ↑ · ↑ · ↑: solo los arriba, en las "y". Es el rasgueo del reggae y del ska.' }),
    proximamente('4.3 · Creatividad: tu patrón', 'Armá un patrón propio en la grilla y tocalo.'),
    proximamente('4.3 · De música ligera en corcheas', 'De música ligera con rasgueo en corcheas.'),
    proximamente('4.3 · Wish You Were Here con patrón', 'Wish You Were Here con uno de los patrones nuevos.'),

    teoria('4.4 · Dinámica', 'La dinámica es tocar más suave o más fuerte. El mismo patrón cambia muchísimo según el volumen.'),
    proximamente('4.4 · Tres volúmenes', 'El mismo patrón suave, medio y fuerte.'),
    proximamente('4.4 · Crescendo', 'Un crescendo de 4 compases: de muy suave a fuerte.'),
    proximamente('4.4 · Zombie con dinámica', 'Zombie con la estrofa suave y el estribillo fuerte.'),

    teoria('4.5 · Golpe percusivo', 'El golpe percusivo es un rasgueo apagado que suena como un tambor. Se hace apoyando la mano que pisa (o la palma de la que rasguea) sobre las cuerdas en el momento del golpe.'),
    proximamente('4.5 · Acorde y golpe', 'Acorde en 1 y 3, golpe apagado en 2 y 4. Primero apagando con la mano que pisa, después con la que rasguea.'),
    proximamente('4.5 · Three Little Birds con golpe', 'Three Little Birds con el golpe percusivo en 2 y 4.'),

    teoria('4.6 · 3/4 y 6/8', 'No todas las canciones van en 4. En 3/4 (vals) se cuenta 1-2-3 con acento en el 1. En 6/8 se cuenta 1-2-3-4-5-6 con acento en el 1 y en el 4.'),
    practica('4.6 · Rasgueo de vals', ritmo('Vals', [[90, 8]], { compas: 3 }),
      { texto: 'Tres golpes por compás, con el acento en el 1: UNO dos tres, UNO dos tres.' }),
    practica('4.6 · Rasgueo en 6/8', ritmo('Seis por ocho', [[120, 6]], { compas: 6 }),
      { texto: 'Seis golpes por compás, con el acento en el 1 y en el 4: UNO dos tres CUATRO cinco seis.' }),
    practica('4.6 · Perfect', acordes('Perfect', ['Sol', 'Mim', 'Do', 'Re', 'Sol', 'Mim', 'Do', 'Re']),
      { texto: 'Ed Sheeran, en 6/8: Sol, Mim, Do y Re.', destacado: '🚧 El rasgueo en 6/8 todavía no lo mide la app: por ahora se aprueba con los acordes.' }),
    proximamente('4.6 · Zamba de mi esperanza con rasguido', 'Zamba de mi esperanza con un rasguido de zamba simplificado.'),

    proximamente('4.7 · Entrar en el 1', 'Después de la cuenta de la batería, entrá justo en el 1. Meta: 5 de 5.'),
    practica('4.7 · Tres minutos sin parar', ritmo('Tres minutos', [[80, 60]], { aprobar: 0.7 }),
      { texto: 'Tres minutos sin parar, a 80 BPM. Al final la app te dice si tendés a apurarte o a atrasarte.',
        destacado: '🚧 Por ahora con el metrónomo: tocar con la banda llega próximamente.' }),
    proximamente('4.7 · De música ligera con banda', 'De música ligera con banda completa.'),

    proximamente('Prueba de salida · Curso 4', "Para terminar el curso: Knockin' on Heaven's Door y Zombie completas, con patrón de rasgueo, a 80 BPM."),
  ],
};

// ───────────────────────── Curso 5: Punteo y riffs ─────────────────────────

const curso5 = {
  id: 'b0000000-0000-4000-a000-000000000005',
  nombre: 'Punteo y riffs',
  descripcion: 'Notas sueltas, púa alternada, riffs clásicos, melodías y las notas del mástil. ≈4 semanas.',
  nivel: 'principiante',
  orden: 4,
  lecciones: [
    teoria('5.1 · Notas sueltas', 'Para puntear, apoyá la púa justo sobre la cuerda y tocá solo esa, sin rozar las vecinas. Golpes cortos, con la muñeca.'),
    practica('5.1 · Golpes hacia abajo', ritmo('Golpes hacia abajo', [[70, 4]]),
      { texto: 'Golpes hacia abajo en la cuerda 6 al aire, parejos y al ritmo del metrónomo.' }),
    practica('5.1 · Cruce de cuerdas', secuencia('Cruce de cuerdas', notas([[6, 0], [5, 0], [6, 0], [4, 0], [5, 0], [3, 0], [4, 0], [2, 0], [3, 0], [1, 0]])),
      { texto: 'Saltá de cuerda sin tocar las vecinas.' }),

    teoria('5.2 · Púa alternada', 'Abajo-arriba-abajo-arriba: la púa alterna siempre, así la mano trabaja la mitad y podés tocar más rápido.'),
    practica('5.2 · Abajo-arriba parejo', ritmo('Púa alternada', [[60, 4]], { subdivision: 2 }),
      { texto: 'Púa alternada en la cuerda 6: abajo en los números y arriba en las "y", con los dos golpes iguales de fuerte.' }),
    practica('5.2 · Cromático en las 6 cuerdas', secuencia('Cromático', [6, 5, 4, 3, 2, 1].flatMap((c) => notas([[c, 1, 1], [c, 2, 2], [c, 3, 3], [c, 4, 4]]))),
      { texto: 'Trastes 1 a 4 en cada cuerda, con púa alternada.' }),
    practica('5.2 · Dos notas por cuerda', secuencia('Pentatónica de Mim', notas([[6, 0], [6, 3, 3], [5, 0], [5, 2, 2], [4, 0], [4, 2, 2], [3, 0], [3, 2, 2], [2, 0], [2, 3, 3], [1, 0], [1, 3, 3]])),
      { texto: 'Dos notas en cada cuerda, de la 6 a la 1: es la pentatónica de Mi menor.' }),

    teoria('5.3 · Riffs', 'Un riff es una frase corta que se repite y le da identidad a la canción. Al tocarlo, apagá las cuerdas que no usás apoyando suavemente la mano.'),
    practica('5.3 · Smoke on the Water', secuencia('Riff de Smoke on the Water', notas([
      [6, 3, 3], [5, 1, 1], [5, 3, 3],
      [6, 3, 3], [5, 1, 1], [5, 4, 4], [5, 3, 3],
      [6, 3, 3], [5, 1, 1], [5, 3, 3],
      [5, 1, 1], [6, 3, 3],
    ]), { bpm: 90, duraciones: [1, 1, 2, 1, 1, 0.5, 2.5, 1, 1, 2, 1, 3] }),
    { texto: 'Deep Purple, en las cuerdas 6 y 5, trastes 0 a 5.', destacado: DOS_PARTES }),
    practica('5.3 · Come As You Are', secuencia('Riff de Come As You Are', notas([
      [6, 0], [6, 0], [6, 1, 1], [6, 2, 2], [5, 0], [6, 2, 2], [5, 0], [6, 2, 2], [6, 2, 2], [6, 1, 1], [6, 0], [5, 2, 2], [6, 0],
    ]), { bpm: 90, duraciones: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1] }),
    { texto: 'Nirvana, en las cuerdas 6 y 5, trastes 0 a 2.', destacado: DOS_PARTES }),
    proximamente('5.3 · Apagar las cuerdas', 'Tocá los riffs apagando las cuerdas que no se usan. La app va a detectar las que quedan sonando.'),

    teoria('5.4 · Melodías', 'Una melodía es una línea de notas que se canta. Con la escala de Do en posición abierta ya tenés casi todas las notas que necesitás.'),
    practica('5.4 · Escala de Do', secuencia('Escala de Do mayor', notas([[5, 3, 3], [4, 0], [4, 2, 2], [4, 3, 3], [3, 0], [3, 2, 2], [2, 0], [2, 1, 1]])),
      { texto: 'Do, Re, Mi, Fa, Sol, La, Si, Do, en posición abierta.' }),
    proximamente('5.4 · Muchachos', 'La melodía del estribillo de Muchachos (La Mosca), transportada para que entre en los primeros 5 trastes.'),
    proximamente('5.4 · Melodía + acordes', '4 compases de melodía y 4 de acordes, sin cortar.'),

    teoria('5.5 · Las notas del mástil', 'Si sabés cómo suena cada cuerda al aire, podés encontrar cualquier nota: cada traste sube un semitono. Entre Mi y Fa, y entre Si y Do, no hay notas con #.',
      { practica: { tipo: 'quiz', nombre: 'Notas de las cuerdas 6 y 5', preguntas: [
        { pregunta: '¿Qué nota es la cuerda 6, traste 3?', opciones: ['Sol', 'Fa', 'La', 'Mi'], correcta: 0, explicacion: 'Mi (0) → Fa (1) → Fa# (2) → Sol (3).' },
        { pregunta: '¿Qué nota es la cuerda 6, traste 1?', opciones: ['Fa#', 'Fa', 'Mi#', 'Sol'], correcta: 1, explicacion: 'Entre Mi y Fa hay un solo semitono.' },
        { pregunta: '¿Qué nota es la cuerda 5, traste 3?', opciones: ['Si', 'Re', 'Do', 'La#'], correcta: 2, explicacion: 'La (0) → La# (1) → Si (2) → Do (3).' },
        { pregunta: '¿Qué nota es la cuerda 5, traste 2?', opciones: ['Si', 'Do', 'La#', 'Re'], correcta: 0 },
        { pregunta: '¿Qué nota es la cuerda 6, traste 5?', opciones: ['Sol', 'La', 'Si', 'Re'], correcta: 1, explicacion: 'Por eso la cuerda 6 en el traste 5 suena igual que la 5 al aire.' },
      ] } }),
    proximamente('5.5 · Encontrá la nota', 'La app nombra una nota y vos la encontrás y la tocás en las cuerdas 6 y 5, trastes 0 a 5, sin ver el mástil.'),
    proximamente('5.5 · Tocá y cantá (opcional)', 'Tocá una nota y cantala a la misma altura.'),

    proximamente('Prueba de salida · Curso 5', 'Para terminar el curso: los riffs de Smoke on the Water y Come As You Are a tempo, y la melodía de Muchachos.'),
  ],
};

// ───────────────────────── Curso 6: Musicalidad y tu primer concierto ─────────────────────────

const curso6 = {
  id: 'b0000000-0000-4000-a000-000000000006',
  nombre: 'Musicalidad y tu primer concierto',
  descripcion: 'Semitonos, cómo se forma un acorde, oído, capo, una canción jefe y tu primer concierto. ≈4 semanas.',
  nivel: 'intermedio',
  orden: 5,
  lecciones: [
    teoria('6.1 · Notas y semitonos', 'Un semitono es la distancia de un traste. Un tono son dos trastes. Entre Mi y Fa, y entre Si y Do, hay un semitono; entre las demás notas naturales, un tono.',
      { practica: { tipo: 'quiz', nombre: '¿Tono o semitono?', preguntas: [
        { pregunta: 'De Mi a Fa hay…', opciones: ['Un tono', 'Un semitono'], correcta: 1 },
        { pregunta: 'De Do a Re hay…', opciones: ['Un tono', 'Un semitono'], correcta: 0 },
        { pregunta: 'De Si a Do hay…', opciones: ['Un tono', 'Un semitono'], correcta: 1 },
        { pregunta: 'De Sol a La hay…', opciones: ['Un tono', 'Un semitono'], correcta: 0 },
        { pregunta: 'Un semitono en la guitarra es…', opciones: ['Un traste', 'Dos trastes', 'Una cuerda'], correcta: 0 },
      ] } }),
    practica('6.1 · Escala cromática', secuencia('Escala cromática', notas([
      [5, 0], [5, 1, 1], [5, 2, 2], [5, 3, 3], [5, 4, 4],
      [4, 0], [4, 1, 1], [4, 2, 2], [4, 3, 3], [4, 4, 4],
      [3, 0], [3, 1, 1], [3, 2, 2],
    ])), { texto: 'Todas las notas, de semitono en semitono, dentro de los primeros trastes. Nombrá cada una en voz alta.' }),
    proximamente('6.1 · Afinar sin afinador', 'Afiná por el traste 5: la cuerda 6 en el traste 5 suena igual que la 5 al aire. Lo mismo con las demás, salvo la cuerda 3, que se compara en el traste 4.',
      ['Cuerda 6 traste 5 = cuerda 5 al aire.', 'Cuerda 5 traste 5 = cuerda 4 al aire.', 'Cuerda 4 traste 5 = cuerda 3 al aire.', 'Cuerda 3 traste 4 = cuerda 2 al aire.', 'Cuerda 2 traste 5 = cuerda 1 al aire.']),

    teoria('6.2 · Cómo se forma un acorde', 'Un acorde mayor se forma con tres notas: la raíz, la tercera y la quinta. Do mayor = Do, Mi y Sol. En el menor, la tercera baja un semitono: por eso Mi y Mim (o La y Lam) cambian un solo dedo.'),
    practica('6.2 · Do, Mi y Sol dentro de Do', secuencia('Las notas de Do', [...notas([[5, 3, 3], [4, 2, 2], [3, 0], [2, 1, 1], [1, 0]]), acorde('Do')]),
      { texto: 'Tocá cada nota del acorde de Do y nombrala: Do, Mi, Sol, Do, Mi.' }),
    proximamente('6.2 · Bajo + rasgueo', 'La nota raíz sola en el tiempo 1 y el rasgueo en el 2, 3 y 4.'),
    practica('6.2 · Mayor vs. menor', acordes('Mayor y menor', ['Mi', 'Mim', 'La', 'Lam', 'Mi', 'Mim']),
      { texto: 'Escuchá la diferencia: Mi y Mim, La y Lam. Cambia un solo dedo.' }),

    proximamente('6.3 · Cantar las cuerdas al aire (opcional)', 'Tocá cada cuerda al aire y cantala a la misma altura.'),
    proximamente('6.3 · ¿Mayor o menor? (difícil)', 'La app toca un acorde y vos decís si es mayor o menor.'),
    proximamente('6.3 · Cumpleaños feliz de oído', 'Sacá Cumpleaños feliz de oído: la app solo te muestra la primera nota.'),

    teoria('6.4 · El capo', 'El capo es una abrazadera que pisa todas las cuerdas en un traste. Con el capo puesto, ese traste pasa a ser el "traste 0": las formas de los acordes son las mismas, pero suenan más agudas.'),
    proximamente('6.4 · Formas con capo', 'Armá las formas de siempre con el capo puesto: la app va a esperar escuchar el acorde transportado.'),
    proximamente('6.4 · De música ligera en su tono original', 'Con capo en el traste 7 y las formas Mim, Do, Sol y Re.'),
    proximamente('6.4 · Wonderwall', 'Oasis, simplificada con capo en el traste 2: Mim, Sol, Re y La.'),

    teoria('6.5 · Sim7, una versión fácil de Si menor', 'Sim7 se toca sin cejilla y reemplaza a Si menor en muchas canciones. No se toca la cuerda 6.'),
    practica('6.5 · Acorde perfecto: Sim7', acordePerfecto('Sim7'), { texto: AVISO_ACORDE_PERFECTO }),
    practica('6.5 · Mim ↔ Sim7', cambio('Mim', 'Sim7'), { destacado: AVISO_30_SEGUNDOS }),
    practica('6.5 · Lam ↔ Si7', cambio('Lam', 'Si7'), { destacado: AVISO_30_SEGUNDOS }),
    practica('6.5 · Lamento boliviano', acordes('Lamento boliviano', ['Mim', 'Sim7', 'Lam', 'Si7', 'Mim', 'Sim7', 'Lam', 'Si7', 'Mim']),
      { texto: 'La canción jefe: Enanitos Verdes completa, con Mim, Sim7, Lam y Si7.' }),

    proximamente('6.6 · Rotación de repertorio', '3 canciones por día durante 5 días.'),
    proximamente('6.6 · Una canción de memoria', 'Tocá una canción entera sin los acordes en pantalla.'),
    proximamente('6.6 · Mini-concierto', 'Grabá un mini-concierto de 3 canciones a elección. Se guarda y se puede compartir.'),
    proximamente('6.6 · Informe de progreso', 'Compará tu mini-concierto con tu primera grabación de Seven Nation Army.'),

    proximamente('Examen final', 'El examen final del tramo.',
      ['Afinar.', '20 cambios en 30 segundos, en 3 pares.', 'Patrón universal a 90 BPM.', 'Riff de Smoke on the Water.', 'Una canción de memoria.', 'Oído: 9 de 10.']),
  ],
};

// ───────────────────────── División en cursos más cortos ─────────────────────────
// Los 6 bloques de arriba siguen el plan original. Para que ningún curso tenga demasiadas clases,
// cada bloque se divide en 2 a 4 cursos (Primeros pasos I, II, III…), cortando siempre entre una
// clase y la siguiente. Acordes y Cambios de acordes se intercalan: cada curso de cambios va justo
// después de los acordes que necesita (por eso Dedos fijos, que usa Si7, va en Cambios II).
// Las lecciones se renumeran según el curso nuevo ("5.2 · …"). `nombreAnterior` guarda el nombre
// viejo para que seedCursos.js encuentre la lección ya cargada y conserve el progreso.

const id = (n) => `b0000000-0000-4000-a000-0000000000${n}`;
const DIVISION = [
  { id: curso1.id, bloque: curso1, parte: 'I', clases: ['1.1', '1.2'], descripcion: 'Conocé tu guitarra: sus partes, el nombre de cada cuerda, cómo afinarla, la postura y la púa.' },
  { id: id(11), bloque: curso1, parte: 'II', clases: ['1.3', '1.4'], descripcion: 'Trastes, notas y el número de cada dedo. Aprendé a leer el mástil de Melodika y tocá tu primer acorde.' },
  { id: id(12), bloque: curso1, parte: 'III', clases: ['1.5', '1.6', '1.7'], prueba: true, descripcion: 'Soltá la mano que pisa, llevá el pulso con el metrónomo y tocá tus primeras melodías.' },
  { id: curso2.id, bloque: curso2, parte: 'I', clases: ['2.1', '2.2'], descripcion: 'Cómo se arma un acorde. Tus primeros tres: Em, Am y D.' },
  { id: id(21), bloque: curso2, parte: 'II', clases: ['2.3', '2.4'], descripcion: 'Cuatro acordes más (A, E, C y G) y tus primeras canciones.' },
  { id: curso3.id, bloque: curso3, parte: 'I', clases: ['3.1', '3.3', '3.4'], descripcion: 'Cómo cambiar de acorde sin cortar: mover los dedos en bloque, el dedo guía y las formas que se trasladan.' },
  { id: id(22), bloque: curso2, parte: 'III', clases: ['2.5', '2.6'], prueba: true, descripcion: 'B7, el acorde del folklore, y canciones completas con los 8 acordes.' },
  { id: id(31), bloque: curso3, parte: 'II', clases: ['3.2', '3.5', '3.6'], prueba: true, descripcion: 'Dedos fijos, el cambio anticipado y no parar nunca. Meta: 20 cambios en 30 segundos.' },
  { id: curso4.id, bloque: curso4, parte: 'I', clases: ['4.1', '4.2'], descripcion: 'Rasgueo en negras y en corcheas, y el patrón universal.' },
  { id: id(41), bloque: curso4, parte: 'II', clases: ['4.3'], descripcion: 'Cuatro patrones de rasgueo nuevos y uno inventado por vos.' },
  { id: id(42), bloque: curso4, parte: 'III', clases: ['4.4', '4.5'], descripcion: 'Tocá suave y fuerte, y sumá el golpe percusivo.' },
  { id: id(43), bloque: curso4, parte: 'IV', clases: ['4.6', '4.7'], prueba: true, descripcion: 'Vals en 3/4, rasgueo en 6/8 y tocar con la banda sin parar.' },
  { id: curso5.id, bloque: curso5, parte: 'I', clases: ['5.1', '5.2', '5.3'], descripcion: 'Notas sueltas, púa alternada y tus primeros riffs clásicos.' },
  { id: id(51), bloque: curso5, parte: 'II', clases: ['5.4', '5.5'], prueba: true, descripcion: 'Melodías en posición abierta y las notas del mástil.' },
  { id: curso6.id, bloque: curso6, parte: 'I', clases: ['6.1', '6.2', '6.3'], descripcion: 'Tonos y semitonos, cómo se forma un acorde y entrenamiento de oído.' },
  { id: id(61), bloque: curso6, parte: 'II', clases: ['6.4', '6.5'], descripcion: 'El capo, Bm7 y la canción jefe: Lamento boliviano.' },
  { id: id(62), bloque: curso6, parte: 'III', clases: ['6.6'], prueba: true, descripcion: 'Armá tu repertorio, grabá tu mini-concierto y rendí el examen final.' },
];

// Nombres más específicos para las lecciones (nombre del plan -> nombre nuevo, sin el número)
const TITULOS = {
  '1.1 · Cómo funciona la guitarra': 'Las partes de la guitarra y sus cuerdas',
  '1.1 · Quiz: las cuerdas': 'Quiz: nombre y número de cada cuerda',
  '1.1 · Tocá cada cuerda': 'Tocá cada cuerda al aire',
  '1.1 · Afinación guiada': 'Afiná las 6 cuerdas',
  '1.2 · Postura y púa': 'Postura y cómo sostener la púa',
  '1.2 · Púa estable': 'Púa estable: 16 golpes a 60 BPM',
  '1.3 · Trastes, notas y dedos': 'Qué es un traste y el número de cada dedo',
  '1.3 · Presión mínima': 'Presión mínima: una nota limpia',
  '1.4 · El mástil de Melodika': 'Cómo leer el mástil de Melodika',
  '1.4 · Leé y tocá': 'Leé y tocá: tres frases cortas',
  '1.4 · Tu primer acorde: Mim': 'Tu primer acorde: Mi menor (Em)',
  '1.5 · Cromático 1-2-3-4': 'Cromático 1-2-3-4 en la cuerda 6',
  '1.5 · La araña': 'La araña en las 6 cuerdas',
  '1.6 · El pulso': 'Qué es el pulso',
  '1.6 · Escalera de tempo': 'Escalera de tempo: 60, 70 y 80 BPM',
  '1.7 · Seven Nation Army': 'Riff de Seven Nation Army',
  '1.7 · Oda a la alegría': 'Melodía de la Oda a la alegría',
  '1.7 · Creatividad: tu propio riff': 'Inventá tu propio riff',
  '2.1 · Acorde perfecto: Mim': 'Acorde perfecto: Mi menor (Em)',
  '2.1 · Acorde perfecto: Lam': 'Acorde perfecto: La menor (Am)',
  '2.1 · Mim y Lam de memoria': 'Em y Am de memoria',
  '2.1 · Jam rockero en Mim-Lam': 'Jam rockero en Em y Am',
  '2.2 · El acorde de Re': 'Cómo se arma Re (D)',
  '2.2 · Acorde perfecto: Re': 'Acorde perfecto: Re (D)',
  '2.2 · Re de memoria': 'Re (D) de memoria',
  '2.2 · Jam en Re con banda': 'Jam en D con banda',
  '2.3 · Los acordes de La y Mi': 'Cómo se arman La (A) y Mi (E)',
  '2.3 · Acorde perfecto: La': 'Acorde perfecto: La (A)',
  '2.3 · Acorde perfecto: Mi': 'Acorde perfecto: Mi (E)',
  '2.3 · Three Little Birds': 'Canción: Three Little Birds',
  '2.4 · Los acordes de Do y Sol': 'Cómo se arman Do (C) y Sol (G)',
  '2.4 · Acorde perfecto: Do': 'Acorde perfecto: Do (C)',
  '2.4 · Acorde perfecto: Sol (3 dedos)': 'Acorde perfecto: Sol (G) con 3 dedos',
  '2.4 · Acorde perfecto: Sol (4 dedos)': 'Acorde perfecto: Sol (G) con 4 dedos',
  "2.4 · Knockin' on Heaven's Door": "Canción: Knockin' on Heaven's Door",
  '2.5 · Si7, el acorde del folklore': 'B7, el acorde del folklore',
  '2.5 · Acorde perfecto: Si7': 'Acorde perfecto: Si séptima (B7)',
  '2.5 · Zamba de mi esperanza': 'Canción: Zamba de mi esperanza',
  '2.6 · Stand By Me': 'Canción: Stand By Me',
  '2.6 · Zombie': 'Canción: Zombie',
  '2.6 · De música ligera': 'Canción: De música ligera',
  '2.6 · Wish You Were Here': 'Canción: Wish You Were Here',
  '3.1 · Primer cambio: Mim ↔ Lam': 'Primer cambio: Em ↔ Am',
  '3.1 · Cambio lento': 'Cambio lento sin cortar el sonido',
  '3.2 · Dedos fijos': 'Qué son los dedos fijos',
  '3.2 · Do ↔ Lam': 'C ↔ Am con dos dedos fijos',
  '3.2 · Mi ↔ Si7': 'E ↔ B7 con el dedo 2 fijo',
  '3.2 · Mim ↔ Si7': 'Em ↔ B7 con el dedo 2 fijo',
  '3.2 · Sol ↔ Re': 'G ↔ D con el dedo 3 fijo',
  '3.3 · La ↔ Re': 'A ↔ D con el dedo guía',
  '3.3 · Mi ↔ Lam': 'E ↔ Am: la forma se traslada',
  '3.3 · Mim ↔ Lam': 'Em ↔ Am: la forma se traslada',
  '3.3 · Three Little Birds completa': 'Canción completa: Three Little Birds',
  '3.4 · Do ↔ Sol': 'C ↔ G moviendo la mano en bloque',
  '3.4 · Re ↔ Mi': 'D ↔ E moviendo la mano en bloque',
  '3.4 · Stand By Me completa': 'Canción completa: Stand By Me',
  '3.5 · Sol - Re - Mim - Do': 'Progresión G - D - Em - C a 70 BPM',
  "3.5 · Knockin' on Heaven's Door completa": "Canción completa: Knockin' on Heaven's Door",
  '3.6 · Forzar el cambio': 'Forzar el cambio: Am - C - G - Em',
  '4.1 · Negras': 'Qué es una negra',
  '4.1 · Acentos': 'Acentos en el 1, el 2 y el 4',
  '4.2 · Corcheas': 'Qué es una corchea',
  '4.2 · Patrón universal': 'El patrón universal',
  '4.3 · Patrones esenciales': 'Para qué sirven los patrones',
  '4.3 · Creatividad: tu patrón': 'Armá tu propio patrón',
  '4.4 · Dinámica': 'Qué es la dinámica',
  '4.4 · Tres volúmenes': 'Un patrón en tres volúmenes',
  '4.4 · Crescendo': 'Crescendo de 4 compases',
  '4.5 · Golpe percusivo': 'Qué es el golpe percusivo',
  '4.5 · Acorde y golpe': 'Acorde en 1 y 3, golpe en 2 y 4',
  '4.6 · 3/4 y 6/8': 'Compases de 3/4 y 6/8',
  '4.6 · Perfect': 'Canción: Perfect en 6/8',
  '4.7 · Entrar en el 1': 'Entrar justo en el 1',
  '5.1 · Notas sueltas': 'Cómo puntear notas sueltas',
  '5.1 · Golpes hacia abajo': 'Golpes hacia abajo en la cuerda 6',
  '5.2 · Púa alternada': 'Qué es la púa alternada',
  '5.2 · Dos notas por cuerda': 'Dos notas por cuerda: pentatónica de Em',
  '5.3 · Riffs': 'Qué es un riff',
  '5.3 · Smoke on the Water': 'Riff de Smoke on the Water',
  '5.3 · Come As You Are': 'Riff de Come As You Are',
  '5.3 · Apagar las cuerdas': 'Apagar las cuerdas que no se tocan',
  '5.4 · Melodías': 'Melodías en posición abierta',
  '5.4 · Escala de Do': 'La escala de Do',
  '5.4 · Muchachos': 'Melodía de Muchachos',
  '5.4 · Melodía + acordes': 'Melodía y acordes sin cortar',
  '5.5 · Las notas del mástil': 'Las notas de las cuerdas 6 y 5',
  '6.1 · Notas y semitonos': 'Tonos y semitonos',
  '6.1 · Escala cromática': 'La escala cromática',
  '6.1 · Afinar sin afinador': 'Afinar por el traste 5',
  '6.2 · Bajo + rasgueo': 'Bajo y rasgueo',
  '6.2 · Mayor vs. menor': 'Mayor y menor: E / Em y A / Am',
  '6.4 · El capo': 'Cómo funciona el capo',
  '6.4 · Wonderwall': 'Canción: Wonderwall con capo 2',
  '6.5 · Sim7, una versión fácil de Si menor': 'Bm7, un Si menor fácil',
  '6.5 · Acorde perfecto: Sim7': 'Acorde perfecto: Si menor séptima (Bm7)',
  '6.5 · Mim ↔ Sim7': 'Em ↔ Bm7',
  '6.5 · Lam ↔ Si7': 'Am ↔ B7',
  '6.5 · Lamento boliviano': 'Canción jefe: Lamento boliviano',
  '6.6 · Mini-concierto': 'Grabá tu mini-concierto',
};

const esPrueba = (l) => /^(Prueba de salida|Examen final)/.test(l.nombre);

function armarCursos() {
  return DIVISION.map((parte, i) => {
    const numero = i + 1;
    const lecciones = parte.clases.flatMap((clase, k) =>
      parte.bloque.lecciones
        .filter((l) => l.nombre.startsWith(`${clase} · `))
        .map((l) => ({ ...l, nombreAnterior: l.nombre, nombre: `${numero}.${k + 1} · ${TITULOS[l.nombre] ?? l.nombre.split(' · ')[1]}` })));
    if (parte.prueba) {
      parte.bloque.lecciones.filter(esPrueba).forEach((l) => {
        const nombre = l.nombre === 'Examen final' ? 'Examen final' : `Prueba de salida: ${parte.bloque.nombre}`;
        lecciones.push({ ...l, nombreAnterior: l.nombre, nombre });
      });
    }
    return {
      id: parte.id,
      nombre: `${parte.bloque.nombre} ${parte.parte}`,
      descripcion: parte.descripcion,
      nivel: parte.bloque.nivel,
      orden: numero,
      lecciones,
      instrumento_id: GUITARRA,
    };
  });
}

export const CURSOS = armarCursos();

// Control: cada lección de los bloques queda en exactamente un curso
const usadas = CURSOS.flatMap((c) => c.lecciones.map((l) => l.nombreAnterior));
const todas = [curso1, curso2, curso3, curso4, curso5, curso6].flatMap((c) => c.lecciones.map((l) => l.nombre));
const faltan = todas.filter((n) => !usadas.includes(n));
const repetidas = usadas.filter((n, i) => usadas.indexOf(n) !== i);
const titulosSinUso = Object.keys(TITULOS).filter((n) => !todas.includes(n));
if (faltan.length || repetidas.length || titulosSinUso.length) {
  throw new Error(`División de cursos incorrecta. Faltan: ${faltan.join(', ')}. Repetidas: ${repetidas.join(', ')}. Títulos sin uso: ${titulosSinUso.join(', ')}`);
}
