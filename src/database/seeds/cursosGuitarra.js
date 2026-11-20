// Archivo: src/database/seeds/cursosGuitarra.js
// Contenido de los cursos de guitarra. Lo carga seedCursos.js.
//
// Cómo está pensado (el detalle pedagógico está en docs/temario-guitarra.md):
// - Cada lección enseña UNA cosa y la aterriza enseguida en algo que se toca.
// - La teoría se enseña con videos: acá no hay lecciones de teoría ni texto de teoría en las
//   prácticas. Todas las lecciones son prácticas que la app mide.
// - `instrucciones` es el texto de la barra lateral: un solo paso, el de la práctica.
// - Todo lo que se pide se puede medir con la app: notas y acordes (micrófono), riffs a tempo
//   (secuencia con `tempo`), golpes a tiempo (ritmo) y la afinación.
//
// El nombre de cada lección se arma solo: "<n° de curso>.<n° de lección> · <título>".
// El nombre es lo que identifica a la lección en la base: `antes` lista los nombres que tenía
// (o los de las lecciones que reemplaza) para que seedCursos.js la actualice en su lugar y el
// progreso de los alumnos se conserve.
import { readFileSync } from 'node:fs';

const QUIZZES = JSON.parse(readFileSync(new URL('./quizzesBase.json', import.meta.url), 'utf8'));

const GUITARRA = '6c990a6d-47cd-4df8-83bd-acbb521da352';
const id = (n) => `b0000000-0000-4000-a000-0000000000${n}`;

// ───────────────────────── Ayudas para armar prácticas ─────────────────────────

const NOTAS = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
const MIDI_AL_AIRE = { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 };
const nombreNota = (cuerda, traste) => NOTAS[(MIDI_AL_AIRE[cuerda] + traste) % 12];

// Posición: cuerda (1 = Mi agudo), traste (0 = al aire) y dedo (1 índice … 4 meñique)
const p = (cuerda, traste, dedo) => (traste === 0 ? { cuerda, traste } : { cuerda, traste, dedo });
const nota = (cuerda, traste, dedo) => ({ tipo: 'nota', nombre: nombreNota(cuerda, traste), posiciones: [p(cuerda, traste, dedo)] });
// Lista de [cuerda, traste, dedo] -> pasos de nota
const notas = (lista) => lista.map(([c, t, d]) => nota(c, t, d));
// La misma nota repetida
const repetir = (veces, cuerda, traste, dedo) => Array.from({ length: veces }, () => [cuerda, traste, dedo]);
// El cromático 1-2-3-4 desde un traste, en una cuerda
const cromatico = (cuerda, desde) => [0, 1, 2, 3].map((i) => [cuerda, desde + i, i + 1]);

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
const nombreAcorde = (nombre) => (nombre === 'Sol4' ? 'Sol' : nombre);
const acorde = (nombre) => ({ tipo: 'acorde', nombre: nombreAcorde(nombre), posiciones: ACORDES[nombre] });

// Con `tempo` ({ bpm, duraciones: pulsos de cada paso }), después de las notas una por una la app
// muestra el riff en movimiento: las notas avanzan y hay que tocarlas a tiempo. Solo notas sueltas.
const secuencia = (nombre, pasos, tempo) => ({ tipo: 'secuencia', nombre, pasos, ...(tempo ? { tempo } : {}) });
// Riff a tempo: todas las notas con la misma duración salvo que se indiquen
const aTempo = (nombre, lista, bpm, duraciones = lista.map(() => 1)) => secuencia(nombre, notas(lista), { bpm, duraciones });
const acordes = (nombre, lista) => secuencia(nombre, lista.map(acorde));
// Alterna dos acordes: A B A B …
const cambio = (a, b, veces = 4) =>
  acordes(`${nombreAcorde(a)} ↔ ${nombreAcorde(b)}`, Array.from({ length: veces * 2 }, (_, i) => (i % 2 ? b : a)));

// "Acorde perfecto": cuerda por cuerda, de la más grave a la más aguda, y al final el acorde entero
function acordePerfecto(nombre) {
  const posiciones = [...ACORDES[nombre]].sort((a, b) => b.cuerda - a.cuerda);
  const pasos = posiciones.map((pos) => ({ tipo: 'nota', nombre: nombreNota(pos.cuerda, pos.traste), posiciones: [pos] }));
  return secuencia(`${nombreAcorde(nombre)} perfecto`, [...pasos, acorde(nombre)]);
}

// Ejercicio de tempo con metrónomo (ver src/utils/ritmo.js en el frontend).
// etapas: [[bpm, compases], …]. patron: qué partes del compás se tocan (en corcheas, 1 y 2 y 3 y 4 y).
const ritmo = (nombre, etapas, { compas = 4, subdivision, patron, cuenta, clicQueDesaparece, aprobar } = {}) => ({
  tipo: 'ritmo', nombre, compas,
  ...(subdivision ? { subdivision } : {}),
  ...(patron ? { patron } : {}),
  etapas: etapas.map(([bpm, compases]) => ({ bpm, compases })),
  ...(cuenta !== undefined ? { cuenta } : {}),
  ...(clicQueDesaparece ? { clicQueDesaparece } : {}),
  ...(aprobar ? { aprobar } : {}),
});

// Patrones de rasgueo en corcheas: 1 y 2 y 3 y 4 y
const PATRON = {
  universal: [1, 0, 1, 1, 0, 1, 1, 1], // ↓ · ↓↑ · ↑↓↑
  uno: [1, 0, 1, 1, 1, 0, 1, 1], // ↓ · ↓↑ ↓ · ↓↑
  rock: [1, 0, 1, 0, 1, 1, 1, 1], // ↓ · ↓ · ↓↑ ↓↑
  pop: [1, 0, 1, 1, 0, 1, 1, 0], // ↓ · ↓↑ · ↑ ↓ ·
  contratiempo: [0, 1, 0, 1, 0, 1, 0, 1], // · ↑ · ↑ · ↑ · ↑
};

// ───────────────────────── Tipos de lección ─────────────────────────

const XP_PRACTICA = 50;
const XP_PRUEBA = 100;

// Cómo se hacen los ejercicios de ritmo: la app escucha golpes (sonidos fuertes que aparecen de golpe)
const AVISO_RITMO = {
  palmas: '👏 Con palmas: la app escucha cada aplauso.',
  rasgueo: '🎸 Rasgueá con ganas y con las cuerdas apagadas (la mano que pisa apoyada, sin apretar): suena seco, como un tambor, y la app lo escucha. Si no te detecta, hacelo con palmas.',
};
const DOS_PARTES = 'Primero las notas una por una. Después a tempo: avanzan por el mástil y tocás cada una cuando pasa por la línea amarilla.';

// Aviso que se suma al destacado según cómo se hace la práctica
function avisoDePractica(practica, modo) {
  if (practica.tipo === 'ritmo') return AVISO_RITMO[modo];
  if (practica.tipo === 'secuencia' && practica.tempo) return DOS_PARTES;
  return null;
}

// Práctica que la app mide. La teoría va en videos, así que no lleva texto_teoria.
// modo (solo ritmo): 'rasgueo' o 'palmas'. meta: objetivo extra que se guarda como descripción.
function practicar(titulo, practica, { destacado = null, instrucciones = [], antes = [], meta = null, modo = 'rasgueo', xp = XP_PRACTICA } = {}) {
  return {
    titulo, tipo: 'practica', descripcion: meta, texto_teoria: null,
    texto_destacado: [destacado, avisoDePractica(practica, modo)].filter(Boolean).join('\n\n') || null,
    instrucciones, practica, xp, antes,
  };
}
// Prueba de salida de un tramo: no lleva número, suma más XP
const prueba = (titulo, practica, opciones = {}) => ({ ...practicar(titulo, practica, { ...opciones, xp: XP_PRUEBA }), prueba: true });

// ═════════════════════════ PRIMEROS PASOS ═════════════════════════

const primerosPasos1 = {
  id: id('01'),
  nombre: 'Primeros pasos I',
  descripcion: 'Conocé tu guitarra: sus partes, el número y el nombre de cada cuerda, la postura, cómo afinarla y tus primeros golpes con la púa.',
  lecciones: [
    practicar('Las 6 cuerdas: número y nombre',
      secuencia('Las cuerdas de la 6 a la 1', notas([[6, 0], [5, 0], [4, 0], [3, 0], [2, 0], [1, 0]])),
      { destacado: '6 Mi · 5 La · 4 Re · 3 Sol · 2 Si · 1 Mi',
        instrucciones: ['Tocá cada cuerda al aire (sin pisar), de la 6 a la 1. Esperá el ✓ antes de pasar a la siguiente.'],
        antes: ['1.3 · Las 6 cuerdas: número y nombre', '1.1 · Quiz: nombre y número de cada cuerda'] }),

    practicar('Encontrá cada cuerda',
      secuencia('Cuerdas en desorden', notas([[3, 0], [6, 0], [2, 0], [5, 0], [1, 0], [4, 0]])),
      { instrucciones: ['Contá las cuerdas desde la 6 si dudás. Golpe corto, una sola cuerda.'],
        antes: ['1.4 · Encontrá cada cuerda', '1.1 · Tocá cada cuerda al aire'] }),

    practicar('Afiná tu guitarra',
      QUIZZES['Afinación Básica (Standard)'],
      { destacado: 'Si la nota está baja, tensá la cuerda. Si está alta, aflojala y llegá a la nota subiendo.',
        instrucciones: ['Tocá la cuerda que te pide la app y girá su clavija despacio hasta que la aguja quede en el centro.'],
        antes: ['1.5 · Afiná tu guitarra', '1.1 · Afiná las 6 cuerdas'] }),

    practicar('Púa estable: golpes parejos',
      aTempo('Golpes parejos', [...repetir(4, 6, 0), ...repetir(4, 5, 0)], 60),
      { instrucciones: ['Un golpe hacia abajo por nota, sin apurarte: la nota tiene que llegar a la línea.'],
        antes: ['1.6 · Púa estable: golpes parejos', '1.2 · Púa estable: 16 golpes a 60 BPM'] }),
  ],
};

const primerosPasos2 = {
  id: id('11'),
  nombre: 'Primeros pasos II',
  descripcion: 'Qué es un traste, el número de cada dedo y cómo leer el mástil de Melodika. Cómo pisar para que la nota suene limpia y tu primera melodía.',
  lecciones: [
    practicar('Cómo leer el mástil de Melodika',
      secuencia('Tu primera lectura', notas([[1, 0], [1, 1, 1], [1, 3, 3], [1, 1, 1], [1, 0]])),
      { destacado: 'Cuerda subrayada = se toca · Círculo con número = traste y dedo · ✕ = no se toca',
        instrucciones: ['Cuerda 1: al aire, dedo 1 en el traste 1, dedo 3 en el traste 3, y de vuelta.'],
        antes: ['2.2 · Cómo leer el mástil de Melodika', '1.4 · Cómo leer el mástil de Melodika'] }),

    practicar('Presión mínima: una nota limpia',
      nota(2, 1, 1),
      { destacado: 'Punta del dedo · Pegado al traste · Pulgar detrás del mástil',
        instrucciones: ['Cuerda 2, traste 1, dedo 1. Mantené la nota sonando hasta el ✓.'],
        antes: ['2.3 · Presión mínima: una nota limpia', '2.1 · Presión mínima: una nota limpia'] }),

    practicar('Un dedo por traste',
      secuencia('Cuerda 1, trastes 1 a 4 y vuelta', notas([...cromatico(1, 1), [1, 3, 3], [1, 2, 2], [1, 1, 1]])),
      { instrucciones: ['Subí del traste 1 al 4 y volvé. Cada dedo en su traste.'],
        antes: ['2.4 · Un dedo por traste', '2.1 · Un dedo por traste'] }),

    practicar('Leé y tocá: tres frases cortas',
      secuencia('Tres frases cortas', notas([
        [3, 0], [3, 2, 2], [2, 0], [2, 1, 1],
        [2, 3, 3], [2, 1, 1], [1, 0], [1, 1, 1],
        [4, 2, 2], [3, 0], [2, 0], [1, 0],
      ])),
      { destacado: 'Cuerda → traste → dedo',
        instrucciones: ['Leé cada posición antes de tocar. Si suena otra nota, mirá de nuevo la cuerda.'],
        antes: ['2.5 · Leé y tocá: tres frases cortas', '2.2 · Leé y tocá: tres frases cortas'] }),

    practicar('Tu primera melodía: Oda a la alegría',
      aTempo('Oda a la alegría', [[1, 0], [1, 0], [1, 1, 1], [1, 3, 3], [1, 3, 3], [1, 1, 1], [1, 0], [2, 3, 3], [2, 1, 1], [2, 1, 1], [2, 3, 3], [1, 0], [1, 0], [2, 3, 3], [2, 3, 3]],
        80, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5, 0.5, 2]),
      { instrucciones: ['Primero nota por nota; después tocala a tempo.'],
        antes: ['2.6 · Tu primera melodía: Oda a la alegría', '3.3 · Melodía de la Oda a la alegría'] }),
  ],
};

const primerosPasos3 = {
  id: id('12'),
  nombre: 'Primeros pasos III',
  descripcion: 'El pulso y el metrónomo, dedos independientes con el cromático y la araña, y tu primer riff de verdad.',
  lecciones: [
    practicar('Un golpe por clic',
      ritmo('Un golpe por clic', [[60, 4]]),
      { modo: 'palmas',
        instrucciones: ['Tocá Empezar, esperá la cuenta y aplaudí con cada clic.'],
        antes: ['3.2 · Un golpe por clic'] }),

    practicar('Escalera de tempo',
      ritmo('Escalera de tempo', [[60, 2], [70, 2], [80, 2]]),
      { modo: 'palmas',
        instrucciones: ['Aplaudí con el clic y acompañá cada subida sin adelantarte.'],
        antes: ['3.3 · Escalera de tempo', '3.2 · Escalera de tempo: 60, 70 y 80 BPM'] }),

    practicar('El clic que desaparece',
      ritmo('El clic que desaparece', [[60, 8]], { clicQueDesaparece: true }),
      { modo: 'palmas',
        instrucciones: ['Seguí aplaudiendo aunque el clic se calle. Contá en voz alta.'],
        antes: ['3.4 · El clic que desaparece', '3.2 · El clic que desaparece'] }),

    practicar('Cromático 1-2-3-4',
      aTempo('Cromático en el traste 5', [...cromatico(6, 5), ...cromatico(6, 5)], 60),
      { instrucciones: ['Dedos 1, 2, 3 y 4 en los trastes 5, 6, 7 y 8 de la cuerda 6, dos veces.'],
        antes: ['3.5 · Cromático 1-2-3-4', '3.1 · Cromático 1-2-3-4 en la cuerda 6'] }),

    practicar('La araña',
      aTempo('La araña', [6, 5, 4, 3, 2, 1].flatMap((c) => cromatico(c, 5)), 60),
      { instrucciones: ['Mismo dedo, mismo traste en todas las cuerdas. Lento y parejo.'],
        antes: ['3.6 · La araña', '3.1 · La araña en las 6 cuerdas'] }),

    practicar('Riff: Seven Nation Army',
      aTempo('Riff de Seven Nation Army', [[4, 2, 2], [4, 2, 2], [3, 0], [4, 2, 2], [4, 0], [5, 3, 3], [5, 2, 2]], 70, [1.5, 0.5, 0.75, 0.75, 0.5, 2, 2]),
      { instrucciones: ['Primero nota por nota; después a tempo.'],
        antes: ['3.7 · Riff: Seven Nation Army', '3.3 · Riff de Seven Nation Army'] }),

    prueba('Prueba de salida: Primeros pasos',
      aTempo('Seven Nation Army a 85 BPM', [[4, 2, 2], [4, 2, 2], [3, 0], [4, 2, 2], [4, 0], [5, 3, 3], [5, 2, 2]], 85, [1.5, 0.5, 0.75, 0.75, 0.5, 2, 2]),
      { instrucciones: ['El riff a 85 BPM: pie marcando el pulso.'],
        antes: ['Prueba de salida: Primeros pasos', '3.3 · Inventá tu propio riff'] }),
  ],
};

// ═════════════════════════ ACORDES ═════════════════════════
// Los cambios de acorde se enseñan junto con cada acorde nuevo (y no en un curso aparte):
// así cada técnica de cambio llega justo cuando hace falta.

const primerRasgueo = 'Rasgueo en negras: ↓ ↓ ↓ ↓ (un golpe hacia abajo por tiempo). Contá en voz alta y cambiá de acorde en el 1.';

const acordes1 = {
  id: id('02'),
  nombre: 'Acordes I',
  descripcion: 'Cómo se arma un acorde, el cifrado americano y tus dos primeros acordes: Em y Am. Tu primer cambio y tu primer rasgueo.',
  lecciones: [
    practicar('Cómo se arma un acorde: Em',
      acordePerfecto('Mim'),
      { destacado: 'Dedos parados · Punta del dedo · Pegado al traste',
        instrucciones: ['Cuerda por cuerda, de la 6 a la 1. Si una no suena, corregí ese dedo y volvé a tocarla.'],
        antes: ['4.1 · Acorde perfecto: Mi menor (Em)', '2.2 · Tu primer acorde: Mi menor (Em)'] }),

    practicar('Acorde perfecto: Am',
      acordePerfecto('Lam'),
      { instrucciones: ['Cuerda por cuerda, desde la 5. La cuerda 1 tiene que sonar clara.'],
        antes: ['4.3 · Acorde perfecto: Am', '4.1 · Acorde perfecto: La menor (Am)'] }),

    practicar('Tu primer cambio: Em ↔ Am',
      cambio('Mim', 'Lam'),
      { destacado: 'La forma no se desarma: se traslada.',
        meta: 'Meta: 12 cambios en 30 segundos',
        instrucciones: ['Alterná Em y Am. Fuera de la app, medí cuántos cambios hacés en 30 segundos: la meta es 12.'],
        antes: ['4.4 · Tu primer cambio: Em ↔ Am', '6.1 · Primer cambio: Em ↔ Am', '6.2 · Em ↔ Am: la forma se traslada', '4.1 · Em y Am de memoria'] }),

    practicar('Tu primer rasgueo: negras',
      ritmo('Negras', [[60, 4]]),
      { destacado: '↓ ↓ ↓ ↓  —  1 2 3 4',
        instrucciones: ['Un rasgueo hacia abajo con cada clic, desde la cuerda 6.'],
        antes: ['4.5 · Tu primer rasgueo: negras', '9.1 · Negras con las cuerdas apagadas'] }),

    practicar('Jam en Em y Am',
      acordes('Jam en Em y Am', ['Mim', 'Lam', 'Mim', 'Lam', 'Mim', 'Lam', 'Mim']),
      { destacado: primerRasgueo,
        instrucciones: ['Cuatro golpes por acorde. Cuando aparezca el ✓, ya estás en el siguiente.'],
        antes: ['4.6 · Jam en Em y Am', '4.1 · Jam rockero en Em y Am'] }),
  ],
};

const acordes2 = {
  id: id('21'),
  nombre: 'Acordes II',
  descripcion: 'El acorde de D, las reglas para cambiar de acorde sin frenar y tus primeras dos canciones.',
  lecciones: [
    practicar('Acorde perfecto: D',
      acordePerfecto('Re'),
      { destacado: 'D: solo 4 cuerdas',
        instrucciones: ['Cuerda por cuerda, desde la 4. La cuerda 1 es la que más se apaga: revisá el dedo 3.'],
        antes: ['4.2 · Acorde perfecto: Re (D)', '4.2 · Cómo se arma Re (D)'] }),

    practicar('Em ↔ D moviendo la mano en bloque',
      cambio('Mim', 'Re'),
      { meta: 'Meta: 10 cambios en 30 segundos',
        instrucciones: ['Alterná Em y D. Acordate: en D se rasguean solo 4 cuerdas.'],
        antes: ['5.3 · Em ↔ D moviendo la mano en bloque', '4.2 · Re (D) de memoria', '6.1 · Cambio lento sin cortar el sonido'] }),

    practicar('Canción: Horse With No Name',
      acordes('Horse With No Name (simplificada)', ['Mim', 'Re', 'Mim', 'Re', 'Mim', 'Re', 'Mim', 'Re']),
      { destacado: primerRasgueo,
        instrucciones: ['Em y D, cuatro golpes cada uno. El pie no para.'],
        antes: ['5.4 · Canción: Horse With No Name'] }),

    practicar('Canción: Oye cómo va',
      acordes('Oye cómo va (simplificada)', ['Lam', 'Re', 'Lam', 'Re', 'Lam', 'Re', 'Lam']),
      { destacado: primerRasgueo,
        instrucciones: ['Am y D, cuatro golpes cada uno.'],
        antes: ['5.5 · Canción: Oye cómo va', '4.2 · Jam en D con banda'] }),
  ],
};

const acordes3 = {
  id: id('22'),
  nombre: 'Acordes III',
  descripcion: 'Los acordes mayores A y E, el dedo guía y tu primera canción completa: Three Little Birds.',
  lecciones: [
    practicar('Acorde perfecto: A',
      acordePerfecto('La'),
      { instrucciones: ['Cuerda por cuerda, desde la 5. La cuerda 1 tiene que sonar.'],
        antes: ['5.1 · Acorde perfecto: La (A)', '5.1 · Cómo se arman La (A) y Mi (E)'] }),

    practicar('Acorde perfecto: E',
      acordePerfecto('Mi'),
      { instrucciones: ['Cuerda por cuerda, las 6.'],
        antes: ['5.1 · Acorde perfecto: Mi (E)'] }),

    practicar('A ↔ D con el dedo guía',
      cambio('La', 'Re'),
      { destacado: 'Dedo guía: se desliza, no se levanta.',
        meta: 'Meta: 15 cambios en 30 segundos',
        instrucciones: ['Alterná A y D. El dedo 3 no se despega.'],
        antes: ['6.2 · A ↔ D con el dedo guía'] }),

    practicar('E ↔ A moviendo la mano en bloque',
      cambio('Mi', 'La'),
      { meta: 'Meta: 12 cambios en 30 segundos',
        instrucciones: ['Alterná E y A. Ojo con la cuerda 6.'],
        antes: ['6.2 · E ↔ Am: la forma se traslada'] }),

    practicar('Canción: Three Little Birds',
      acordes('Three Little Birds', ['La', 'Re', 'La', 'Re', 'La', 'Mi', 'La', 'Re', 'La', 'Mi', 'La', 'Re', 'La']),
      { destacado: primerRasgueo,
        instrucciones: ['La canción completa. Cuatro golpes por acorde.'],
        antes: ['6.2 · Canción completa: Three Little Birds', '5.1 · Canción: Three Little Birds'] }),
  ],
};

const acordes4 = {
  id: id('23'),
  nombre: 'Acordes IV',
  descripcion: 'Los acordes C y G, los dedos fijos (el mejor atajo para cambiar) y dos canciones completas.',
  lecciones: [
    practicar('Acorde perfecto: C',
      acordePerfecto('Do'),
      { instrucciones: ['Cuerda por cuerda, desde la 5. Prestá atención a la cuerda 3.'],
        antes: ['5.2 · Acorde perfecto: Do (C)', '5.2 · Cómo se arman Do (C) y Sol (G)'] }),

    practicar('Dedos fijos: C ↔ Am',
      cambio('Do', 'Lam'),
      { destacado: 'Dedo fijo: no se levanta nunca.',
        meta: 'Meta: 20 cambios en 30 segundos',
        instrucciones: ['Alterná C y Am. Los dedos 1 y 2 no se despegan.'],
        antes: ['8.1 · C ↔ Am con dos dedos fijos', '8.1 · Qué son los dedos fijos'] }),

    practicar('Acorde perfecto: G con 3 dedos',
      acordePerfecto('Sol'),
      { instrucciones: ['Cuerda por cuerda, las 6. Revisá la cuerda 4.'],
        antes: ['5.2 · Acorde perfecto: Sol (G) con 3 dedos'] }),

    practicar('Acorde perfecto: G con 4 dedos',
      acordePerfecto('Sol4'),
      { instrucciones: ['Cuerda por cuerda, las 6.'],
        antes: ['5.2 · Acorde perfecto: Sol (G) con 4 dedos'] }),

    practicar('Dedo fijo: G ↔ D',
      cambio('Sol4', 'Re'),
      { meta: 'Meta: 15 cambios en 30 segundos',
        instrucciones: ['Alterná G y D. El dedo 3 es tu ancla.'],
        antes: ['8.1 · G ↔ D con el dedo 3 fijo'] }),

    practicar('C ↔ G moviendo la mano en bloque',
      cambio('Do', 'Sol'),
      { meta: 'Meta: 12 cambios en 30 segundos',
        instrucciones: ['Alterná C y G. Primero el bajo.'],
        antes: ['6.3 · C ↔ G moviendo la mano en bloque', '6.3 · Cambios sin dedos en común'] }),

    practicar("Canción: Knockin' on Heaven's Door",
      acordes("Knockin' on Heaven's Door", ['Sol', 'Re', 'Lam', 'Sol', 'Re', 'Do', 'Sol', 'Re', 'Lam', 'Sol', 'Re', 'Do']),
      { destacado: primerRasgueo,
        instrucciones: ['La canción completa, cuatro golpes por acorde.'],
        antes: ["8.2 · Canción completa: Knockin' on Heaven's Door", "5.2 · Canción: Knockin' on Heaven's Door"] }),

    practicar('Canción: Stand By Me',
      acordes('Stand By Me', ['Sol', 'Mim', 'Do', 'Re', 'Sol', 'Mim', 'Do', 'Re', 'Sol']),
      { destacado: primerRasgueo,
        instrucciones: ['La canción completa, cuatro golpes por acorde.'],
        antes: ['6.3 · Canción completa: Stand By Me', '7.2 · Canción: Stand By Me', '9.1 · Stand By Me en negras'] }),
  ],
};

const acordes5 = {
  id: id('24'),
  nombre: 'Acordes V',
  descripcion: 'B7, el acorde del folklore y del blues, con sus cambios por dedo fijo, y la Zamba de mi esperanza.',
  lecciones: [
    practicar('Acorde perfecto: B7',
      acordePerfecto('Si7'),
      { instrucciones: ['Cuerda por cuerda, desde la 5. La difícil es la 2.'],
        antes: ['7.1 · Acorde perfecto: Si séptima (B7)', '7.1 · B7, el acorde del folklore'] }),

    practicar('Dedo fijo: E ↔ B7',
      cambio('Mi', 'Si7'),
      { meta: 'Meta: 15 cambios en 30 segundos',
        instrucciones: ['Alterná E y B7.'],
        antes: ['8.1 · E ↔ B7 con el dedo 2 fijo'] }),

    practicar('Dedo fijo: Am ↔ B7',
      cambio('Lam', 'Si7'),
      { meta: 'Meta: 12 cambios en 30 segundos',
        instrucciones: ['Alterná Am y B7, rasgueando desde la cuerda 5.'],
        antes: ['16.2 · Am ↔ B7'] }),

    practicar('Dedo fijo: Em ↔ B7',
      cambio('Mim', 'Si7'),
      { meta: 'Meta: 15 cambios en 30 segundos',
        instrucciones: ['Alterná Em y B7.'],
        antes: ['8.1 · Em ↔ B7 con el dedo 2 fijo'] }),

    practicar('Canción: Zamba de mi esperanza',
      acordes('Zamba de mi esperanza (simple, en Mi)', ['Mi', 'La', 'Si7', 'Mi', 'La', 'Si7', 'Mi']),
      { destacado: 'Rasgueo: ↓ · · ↓ · ·  —  1 2 3 4 5 6',
        instrucciones: ['Toda la canción, cambiando de acorde en el 1.'],
        antes: ['7.1 · Canción: Zamba de mi esperanza', '8.1 · Estribillo de Zamba de mi esperanza'] }),
  ],
};

const cambios = {
  id: id('03'),
  nombre: 'Cambios de acordes',
  descripcion: 'El cambio anticipado, no frenar nunca y cuatro canciones completas con los 8 acordes. Cierra con las pruebas de acordes y de cambios.',
  lecciones: [
    practicar('El cambio anticipado',
      acordes('G - D - Em - C', ['Sol', 'Re', 'Mim', 'Do', 'Sol', 'Re', 'Mim', 'Do']),
      { destacado: '↓ ↓ ↓ ↗  —  en el 4 ya estás viajando',
        instrucciones: ['La progresión completa, cambiando en el último golpe.'],
        antes: ['8.2 · Progresión G - D - Em - C a 70 BPM', '8.2 · Cambio anticipado'] }),

    practicar('D ↔ E moviendo la mano en bloque',
      cambio('Re', 'Mi'),
      { meta: 'Meta: 12 cambios en 30 segundos',
        instrucciones: ['Alterná D y E. La púa también cambia de cuerda.'],
        antes: ['6.3 · D ↔ E moviendo la mano en bloque'] }),

    practicar('Forzar el cambio',
      acordes('Am - C - G - Em', ['Lam', 'Do', 'Sol', 'Mim', 'Lam', 'Do', 'Sol', 'Mim']),
      { instrucciones: ['Am, C, G y Em sin frenar nunca.'],
        antes: ['8.3 · Forzar el cambio: Am - C - G - Em'] }),

    practicar('Canción: Zombie',
      acordes('Zombie (simplificada)', ['Mim', 'Do', 'Sol', 'Re', 'Mim', 'Do', 'Sol', 'Re']),
      { destacado: primerRasgueo,
        instrucciones: ['La progresión completa, con cambio anticipado.'],
        antes: ['7.2 · Canción: Zombie'] }),

    practicar('Canción: De música ligera',
      acordes('De música ligera (tono adaptado)', ['Mim', 'Do', 'Sol', 'Re', 'Mim', 'Do', 'Sol', 'Re']),
      { destacado: primerRasgueo,
        instrucciones: ['La progresión completa. Subí la velocidad solo si no frenás.'],
        antes: ['7.2 · Canción: De música ligera', '8.3 · De música ligera, cada vez más rápido'] }),

    practicar('Canción: Wish You Were Here',
      acordes('Wish You Were Here (simplificada)', ['Mim', 'Sol', 'Do', 'Re', 'Lam', 'Sol', 'Re', 'Do', 'Lam', 'Sol']),
      { destacado: primerRasgueo,
        instrucciones: ['La canción completa, sin frenar.'],
        antes: ['7.2 · Canción: Wish You Were Here'] }),

    prueba('Prueba de salida: Acordes',
      acordes('Los 8 acordes', ['Mim', 'Lam', 'Re', 'La', 'Mi', 'Do', 'Sol', 'Si7']),
      { instrucciones: ['Cada acorde tiene que sonar limpio, con todas sus cuerdas.'],
        antes: ['Prueba de salida: Acordes'] }),

    prueba('Prueba de salida: Cambios de acordes',
      acordes('Cambios encadenados', ['Mi', 'Si7', 'Mi', 'La', 'Re', 'Sol', 'Re', 'Do', 'Lam', 'Do', 'Sol', 'Mim', 'Si7', 'Mim']),
      { instrucciones: ['Toda la cadena, con cambio anticipado.'],
        antes: ['Prueba de salida: Cambios de acordes'] }),
  ],
};

// ═════════════════════════ RITMO Y RASGUEO ═════════════════════════

const ritmo1 = {
  id: id('04'),
  nombre: 'Ritmo y rasgueo I',
  descripcion: 'Negras y corcheas, la mano como un péndulo y el patrón universal, el rasgueo que sirve para cientos de canciones.',
  lecciones: [
    practicar('Negras hasta 90 BPM',
      ritmo('Negras', [[60, 2], [75, 2], [90, 2]]),
      { instrucciones: ['Un golpe hacia abajo por clic. El tempo sube solo.'],
        antes: ['10.2 · Negras hasta 90 BPM', '9.1 · Qué es una negra'] }),

    practicar('Corcheas: abajo y arriba sin parar',
      ritmo('Corcheas', [[60, 4], [70, 4]], { subdivision: 2 }),
      { instrucciones: ['Ocho golpes por compás, todos iguales de fuertes.'],
        antes: ['10.3 · Corcheas: abajo y arriba sin parar', '9.2 · Abajo-arriba continuo'] }),

    practicar('El patrón universal',
      ritmo('Patrón universal', [[65, 4]], { subdivision: 2, patron: PATRON.universal }),
      { destacado: '↓ · ↓↑ · ↑↓↑  —  1 y 2 y 3 y 4 y',
        instrucciones: ['Tocá el patrón con el clic. La mano no se frena en los huecos.'],
        antes: ['10.4 · El patrón universal', '9.2 · El patrón universal'] }),

    practicar('Patrón universal sin red',
      ritmo('Patrón universal sin clic', [[75, 8]], { subdivision: 2, patron: PATRON.universal, clicQueDesaparece: true }),
      { instrucciones: ['Seguí el patrón aunque el clic se calle.'],
        antes: ['10.5 · Patrón universal sin red'] }),

    practicar("Knockin' on Heaven's Door con el patrón universal",
      acordes("Knockin' on Heaven's Door", ['Sol', 'Re', 'Lam', 'Sol', 'Re', 'Do']),
      { destacado: '↓ · ↓↑ · ↑↓↑ en cada acorde',
        instrucciones: ['La canción con un patrón por acorde.'],
        antes: ['10.6 · Knockin\' on Heaven\'s Door con el patrón universal', "9.2 · Knockin' on Heaven's Door con el patrón universal"] }),
  ],
};

const ritmo2 = {
  id: id('41'),
  nombre: 'Ritmo y rasgueo II',
  descripcion: 'Cuatro patrones de rasgueo esenciales (incluido el contratiempo del reggae) y dos canciones para aplicarlos.',
  lecciones: [
    practicar('Patrón 1: abajo y arriba en el 2 y el 4',
      ritmo('Patrón 1', [[70, 4]], { subdivision: 2, patron: PATRON.uno }),
      { destacado: '↓ · ↓↑ ↓ · ↓↑  —  1 y 2 y 3 y 4 y',
        instrucciones: ['Tocá el patrón con el clic.'],
        antes: ['10.1 · Patrón 1: abajo y arriba en el 2 y el 4', '10.1 · Para qué sirven los patrones'] }),

    practicar('Patrón 2: rock',
      ritmo('Patrón 2', [[70, 4]], { subdivision: 2, patron: PATRON.rock }),
      { destacado: '↓ · ↓ · ↓↑ ↓↑  —  1 y 2 y 3 y 4 y',
        instrucciones: ['Tocá el patrón con el clic.'],
        antes: ['10.1 · Patrón 2: rock'] }),

    practicar('Patrón 3: pop',
      ritmo('Patrón 3', [[70, 4]], { subdivision: 2, patron: PATRON.pop }),
      { destacado: '↓ · ↓↑ · ↑ ↓ ·  —  1 y 2 y 3 y 4 y',
        instrucciones: ['Tocá el patrón con el clic.'],
        antes: ['10.1 · Patrón 3: pop'] }),

    practicar('Patrón 4: contratiempo',
      ritmo('Patrón 4', [[70, 4]], { subdivision: 2, patron: PATRON.contratiempo }),
      { destacado: '· ↑ · ↑ · ↑ · ↑  —  1 y 2 y 3 y 4 y',
        instrucciones: ['Solo los arriba, con ganas.'],
        antes: ['10.1 · Patrón 4: contratiempo'] }),

    practicar('Canción: Three Little Birds en contratiempo',
      acordes('Three Little Birds', ['La', 'Re', 'La', 'Re', 'La', 'Mi', 'La', 'Re', 'La', 'Mi', 'La', 'Re', 'La']),
      { destacado: '· ↑ · ↑ · ↑ · ↑ en cada acorde',
        instrucciones: ['La canción completa en contratiempo.'],
        antes: ['10.1 · De música ligera en corcheas'] }),

    practicar('Canción: Wish You Were Here con patrón',
      acordes('Wish You Were Here (simplificada)', ['Mim', 'Sol', 'Do', 'Re', 'Lam', 'Sol', 'Re', 'Do', 'Lam', 'Sol']),
      { destacado: '↓ · ↓↑ ↓ · ↓↑ en cada acorde',
        instrucciones: ['La canción completa con el patrón.'],
        antes: ['10.1 · Wish You Were Here con patrón', '10.1 · Armá tu propio patrón'] }),
  ],
};

const ritmo3 = {
  id: id('42'),
  nombre: 'Ritmo y rasgueo III',
  descripcion: 'El golpe percusivo (el «chas» del redoblante) y la dinámica: tocar suave y fuerte para que la canción respire.',
  lecciones: [
    practicar('El golpe percusivo en el 2 y el 4',
      ritmo('Golpe en 2 y 4', [[70, 4]], { patron: [0, 1, 0, 1] }),
      { destacado: '· chas · chas  —  1 2 3 4',
        instrucciones: ['Solo en el 2 y el 4. En el 1 y el 3, silencio.'],
        antes: ['11.2 · Qué es el golpe percusivo'] }),

    practicar('Acorde y golpe: bum - chas',
      ritmo('Bum - chas', [[70, 4], [80, 4]]),
      { destacado: '↓ chas ↓ chas  —  1 2 3 4',
        instrucciones: ['Un golpe por clic, alternando rasgueo y chas.'],
        antes: ['11.2 · Acorde en 1 y 3, golpe en 2 y 4'] }),

    practicar('Canción: Stand By Me con golpe percusivo',
      acordes('Stand By Me', ['Sol', 'Mim', 'Do', 'Re', 'Sol', 'Mim', 'Do', 'Re', 'Sol']),
      { destacado: '↓ chas ↓ chas en cada acorde',
        instrucciones: ['La canción con bum - chas.'],
        antes: ['11.2 · Three Little Birds con golpe'] }),

    practicar('Canción: Zombie con dinámica',
      acordes('Zombie (simplificada)', ['Mim', 'Do', 'Sol', 'Re', 'Mim', 'Do', 'Sol', 'Re']),
      { destacado: 'Vuelta 1: suave · Vuelta 2: fuerte',
        instrucciones: ['Primera vuelta suave, segunda fuerte.'],
        antes: ['12.5 · Canción: Zombie con dinámica', '11.1 · Zombie con dinámica'] }),
  ],
};

const ritmo4 = {
  id: id('43'),
  nombre: 'Ritmo y rasgueo IV',
  descripcion: 'Vals en 3/4, rasgueo en 6/8, entrar justo en el 1 y aguantar tres minutos sin parar.',
  lecciones: [
    practicar('Rasgueo de vals en 3/4',
      ritmo('Vals', [[90, 8]], { compas: 3 }),
      { destacado: '↓ ↓ ↓  —  UNO dos tres',
        instrucciones: ['Tres golpes por compás, el primero más fuerte.'],
        antes: ['12.1 · Rasgueo de vals', '12.1 · Compases de 3/4 y 6/8'] }),

    practicar('Rasgueo en 6/8',
      ritmo('Seis por ocho', [[120, 6]], { compas: 6 }),
      { destacado: '↓ ↓ ↓ ↓ ↓ ↓  —  UNO dos tres CUATRO cinco seis',
        instrucciones: ['Seis golpes por compás, acentuando el 1 y el 4.'],
        antes: ['12.1 · Rasgueo en 6/8'] }),

    practicar('Canción: Perfect en 6/8',
      acordes('Perfect', ['Sol', 'Mim', 'Do', 'Re', 'Sol', 'Mim', 'Do', 'Re']),
      { destacado: 'UNO dos tres CUATRO cinco seis en cada acorde',
        instrucciones: ['La canción completa en 6/8.'],
        antes: ['12.1 · Canción: Perfect en 6/8'] }),

    practicar('Canción: Zamba de mi esperanza en 6/8',
      acordes('Zamba de mi esperanza (simple, en Mi)', ['Mi', 'La', 'Si7', 'Mi', 'La', 'Si7', 'Mi']),
      { destacado: 'UNO dos tres CUATRO cinco seis en cada acorde',
        instrucciones: ['La zamba en 6/8.'],
        antes: ['12.1 · Zamba de mi esperanza con rasguido'] }),

    practicar('Entrar justo en el 1',
      ritmo('Entrar en el 1', [[80, 2]], { cuenta: 2 }),
      { instrucciones: ['Entrá en el 1 justo después de la cuenta. Negras.'],
        antes: ['12.2 · Entrar justo en el 1'] }),

    practicar('Tres minutos sin parar',
      ritmo('Tres minutos', [[80, 60]], { aprobar: 0.7 }),
      { instrucciones: ['Tres minutos, sin parar. Si te perdés, volvé a entrar en el 1.'],
        antes: ['12.2 · Tres minutos sin parar', '12.2 · De música ligera con banda'] }),

    prueba('Prueba de salida: Ritmo y rasgueo',
      ritmo('Patrón universal a 90', [[90, 8]], { subdivision: 2, patron: PATRON.universal, aprobar: 0.8 }),
      { instrucciones: ['El patrón universal a 90 BPM.'],
        antes: ['Prueba de salida: Ritmo y rasgueo'] }),
  ],
};

// ═════════════════════════ PUNTEO Y RIFFS ═════════════════════════

const punteo1 = {
  id: id('05'),
  nombre: 'Punteo y riffs I',
  descripcion: 'Notas sueltas con precisión, púa alternada, la pentatónica de Em y dos riffs clásicos.',
  lecciones: [
    practicar('Cruce de cuerdas',
      aTempo('Cruce de cuerdas', [[6, 0], [5, 0], [6, 0], [4, 0], [5, 0], [3, 0], [4, 0], [2, 0], [3, 0], [1, 0]], 60),
      { instrucciones: ['Golpes hacia abajo, una sola cuerda por vez.'],
        antes: ['13.1 · Cruce de cuerdas', '13.1 · Cómo puntear notas sueltas', '13.1 · Golpes hacia abajo en la cuerda 6'] }),

    practicar('Púa alternada',
      aTempo('Púa alternada', [...repetir(8, 6, 0), ...repetir(8, 5, 0)], 60, Array(16).fill(0.5)),
      { destacado: '↓ ↑ ↓ ↑ ↓ ↑ ↓ ↑  —  1 y 2 y 3 y 4 y',
        instrucciones: ['Ocho notas en la 6 y ocho en la 5, alternando siempre.'],
        antes: ['13.2 · Abajo-arriba parejo', '13.2 · Qué es la púa alternada'] }),

    practicar('Cromático con púa alternada',
      aTempo('Cromático en las cuerdas 6, 5 y 4', [6, 5, 4].flatMap((c) => cromatico(c, 1)), 70, Array(12).fill(0.5)),
      { instrucciones: ['Trastes 1 a 4 en las cuerdas 6, 5 y 4, alternando la púa.'],
        antes: ['13.2 · Cromático en las 6 cuerdas'] }),

    practicar('Pentatónica de Em',
      aTempo('Pentatónica de Mi menor', [[6, 0], [6, 3, 3], [5, 0], [5, 2, 2], [4, 0], [4, 2, 2], [3, 0], [3, 2, 2], [2, 0], [2, 3, 3], [1, 0], [1, 3, 3]], 70),
      { instrucciones: ['Subí de la cuerda 6 a la 1 con púa alternada.'],
        antes: ['13.2 · Dos notas por cuerda: pentatónica de Em'] }),

    practicar('Riff: Smoke on the Water',
      aTempo('Riff de Smoke on the Water', [
        [6, 3, 3], [5, 1, 1], [5, 3, 3],
        [6, 3, 3], [5, 1, 1], [5, 4, 4], [5, 3, 3],
        [6, 3, 3], [5, 1, 1], [5, 3, 3],
        [5, 1, 1], [6, 3, 3],
      ], 90, [1, 1, 2, 1, 1, 0.5, 2.5, 1, 1, 2, 1, 3]),
      { instrucciones: ['Primero nota por nota; después a tempo, apagando las cuerdas que no usás.'],
        antes: ['13.3 · Riff de Smoke on the Water', '13.3 · Qué es un riff'] }),

    practicar('Riff: Come As You Are',
      aTempo('Riff de Come As You Are', [[6, 0], [6, 0], [6, 1, 1], [6, 2, 2], [5, 0], [6, 2, 2], [5, 0], [6, 2, 2], [6, 2, 2], [6, 1, 1], [6, 0], [5, 2, 2], [6, 0]],
        90, [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1]),
      { instrucciones: ['Primero nota por nota; después a tempo.'],
        antes: ['13.3 · Riff de Come As You Are', '13.3 · Apagar las cuerdas que no se tocan'] }),
  ],
};

const punteo2 = {
  id: id('51'),
  nombre: 'Punteo y riffs II',
  descripcion: 'Tonos y semitonos, las notas del mástil, la escala de Do y una melodía completa.',
  lecciones: [
    practicar('Las notas naturales en las cuerdas 6 y 5',
      secuencia('Notas naturales', notas([[6, 0], [6, 1, 1], [6, 3, 3], [6, 5, 4], [5, 2, 2], [5, 3, 3], [5, 5, 4]])),
      { destacado: 'Cuerda 6: Mi 0 · Fa 1 · Sol 3 · La 5  —  Cuerda 5: Si 2 · Do 3 · Re 5',
        instrucciones: ['Tocá y nombrá cada nota en voz alta.'],
        antes: ['15.2 · Las notas naturales en las cuerdas 6 y 5', '14.2 · Encontrá la nota'] }),

    practicar('La escala de Do',
      aTempo('Escala de Do mayor, ida y vuelta', [[5, 3, 3], [4, 0], [4, 2, 2], [4, 3, 3], [3, 0], [3, 2, 2], [2, 0], [2, 1, 1], [2, 0], [3, 2, 2], [3, 0], [4, 3, 3], [4, 2, 2], [4, 0], [5, 3, 3]], 70),
      { instrucciones: ['Subí y bajá la escala. Púa alternada.'],
        antes: ['15.4 · La escala de Do', '14.1 · La escala de Do', '14.1 · Melodías en posición abierta'] }),

    practicar('Melodía: Cumpleaños feliz',
      aTempo('Cumpleaños feliz', [
        [3, 0], [3, 0], [3, 2, 2], [3, 0], [2, 1, 1], [2, 0],
        [3, 0], [3, 0], [3, 2, 2], [3, 0], [2, 3, 3], [2, 1, 1],
        [3, 0], [3, 0], [1, 3, 3], [1, 0], [2, 1, 1], [2, 0], [3, 2, 2],
        [1, 1, 1], [1, 1, 1], [1, 0], [2, 1, 1], [2, 3, 3], [2, 1, 1],
      ], 100, [
        0.75, 0.25, 1, 1, 1, 2,
        0.75, 0.25, 1, 1, 1, 2,
        0.75, 0.25, 1, 1, 1, 1, 1,
        0.75, 0.25, 1, 1, 1, 3,
      ]),
      { instrucciones: ['Primero nota por nota; después a tempo.'],
        antes: ['15.5 · Melodía: Cumpleaños feliz', '15.3 · Cumpleaños feliz de oído', '14.1 · Melodía de Muchachos', '14.1 · Melodía y acordes sin cortar'] }),

    prueba('Prueba de salida: Punteo y riffs',
      aTempo('Smoke on the Water a 105 BPM', [
        [6, 3, 3], [5, 1, 1], [5, 3, 3],
        [6, 3, 3], [5, 1, 1], [5, 4, 4], [5, 3, 3],
        [6, 3, 3], [5, 1, 1], [5, 3, 3],
        [5, 1, 1], [6, 3, 3],
      ], 105, [1, 1, 2, 1, 1, 0.5, 2.5, 1, 1, 2, 1, 3]),
      { instrucciones: ['Smoke on the Water a 105 BPM.'],
        antes: ['Prueba de salida: Punteo y riffs', '14.2 · Tocá y cantá (opcional)'] }),
  ],
};

// ═════════════════════════ MUSICALIDAD Y TU PRIMER CONCIERTO ═════════════════════════

const musicalidad1 = {
  id: id('06'),
  nombre: 'Musicalidad I',
  descripcion: 'Por qué suenan como suenan: la escala cromática, afinar de oído por el traste 5, cómo se forma un acorde y la diferencia entre mayor y menor.',
  nivel: 'intermedio',
  lecciones: [
    practicar('La escala cromática',
      secuencia('Escala cromática', notas([
        [5, 0], [5, 1, 1], [5, 2, 2], [5, 3, 3], [5, 4, 4],
        [4, 0], [4, 1, 1], [4, 2, 2], [4, 3, 3], [4, 4, 4],
        [3, 0], [3, 1, 1], [3, 2, 2],
      ])),
      { instrucciones: ['Tocá y nombrá cada nota, de la cuerda 5 a la 3.'],
        antes: ['15.1 · La escala cromática'] }),

    practicar('Afinar por el traste 5',
      secuencia('Notas gemelas', notas([[6, 5, 1], [5, 0], [5, 5, 1], [4, 0], [4, 5, 1], [3, 0], [3, 4, 1], [2, 0], [2, 5, 1], [1, 0]])),
      { destacado: '6 en 5 = 5 al aire · 5 en 5 = 4 · 4 en 5 = 3 · 3 en 4 = 2 · 2 en 5 = 1',
        instrucciones: ['Tocá cada par: la cuerda pisada y después la siguiente al aire. Escuchá que suenen iguales.'],
        antes: ['15.1 · Afinar por el traste 5'] }),

    practicar('Cómo se forma un acorde',
      secuencia('Las notas de Do', [...notas([[5, 3, 3], [4, 2, 2], [3, 0], [2, 1, 1], [1, 0]]), acorde('Do')]),
      { destacado: 'C = Do + Mi + Sol (raíz, tercera y quinta)',
        instrucciones: ['Tocá y nombrá cada nota; al final, el acorde completo.'],
        antes: ['15.2 · Do, Mi y Sol dentro de Do', '15.2 · Cómo se forma un acorde'] }),

    practicar('Mayor y menor',
      acordes('Mayor y menor', ['Mi', 'Mim', 'La', 'Lam', 'Mi', 'Mim']),
      { destacado: 'Mayor → menor: la tercera baja un semitono',
        instrucciones: ['Tocá cada par y escuchá cómo cambia el carácter.'],
        antes: ['15.2 · Mayor y menor: E / Em y A / Am', '15.3 · ¿Mayor o menor? (difícil)'] }),

    practicar('Bajo y rasgueo',
      secuencia('Bajo y rasgueo', [nota(5, 3, 3), acorde('Do'), nota(6, 3, 2), acorde('Sol'), nota(5, 0), acorde('Lam'), nota(6, 0), acorde('Mim')]),
      { destacado: 'bajo ↓ ↓ ↓  —  1 2 3 4',
        instrucciones: ['Para cada acorde: primero el bajo solo, después el rasgueo.'],
        antes: ['15.2 · Bajo y rasgueo', '15.3 · Cantar las cuerdas al aire (opcional)'] }),
  ],
};

const musicalidad2 = {
  id: id('61'),
  nombre: 'Musicalidad II',
  descripcion: 'El capo, Bm7 (un Si menor sin cejilla), Wonderwall y tu canción jefe: Lamento boliviano.',
  nivel: 'intermedio',
  lecciones: [
    practicar('Acorde perfecto: Bm7',
      acordePerfecto('Sim7'),
      { instrucciones: ['Cuerda por cuerda, desde la 5.'],
        antes: ['17.2 · Acorde perfecto: Bm7', '16.2 · Acorde perfecto: Si menor séptima (Bm7)', '16.2 · Bm7, un Si menor fácil'] }),

    practicar('Em ↔ Bm7',
      cambio('Mim', 'Sim7'),
      { meta: 'Meta: 15 cambios en 30 segundos',
        instrucciones: ['Alterná Em y Bm7.'],
        antes: ['17.3 · Em ↔ Bm7', '16.2 · Em ↔ Bm7'] }),

    practicar('Canción: Wonderwall',
      acordes('Wonderwall (simplificada, sin capo)', ['Mim', 'Sol', 'Re', 'La', 'Mim', 'Sol', 'Re', 'La']),
      { destacado: 'Patrón universal: ↓ · ↓↑ · ↑↓↑ en cada acorde',
        instrucciones: ['La progresión completa con el patrón universal.'],
        antes: ['17.4 · Canción: Wonderwall', '16.1 · Canción: Wonderwall con capo 2'] }),

    practicar('Canción jefe: Lamento boliviano',
      acordes('Lamento boliviano', ['Mim', 'Sim7', 'Lam', 'Si7', 'Mim', 'Sim7', 'Lam', 'Si7', 'Mim']),
      { destacado: 'Patrón universal: ↓ · ↓↑ · ↑↓↑ en cada acorde',
        instrucciones: ['La canción completa.'],
        antes: ['17.5 · Canción jefe: Lamento boliviano', '16.2 · Canción jefe: Lamento boliviano'] }),
  ],
};

const concierto = {
  id: id('62'),
  nombre: 'Tu primer concierto',
  descripcion: 'Armá tu repertorio, rendí el examen final y grabá tu primer mini-concierto.',
  nivel: 'intermedio',
  lecciones: [
    practicar('Repertorio: tres canciones seguidas',
      acordes('Stand By Me, Zombie y Knockin’ on Heaven’s Door', [
        'Sol', 'Mim', 'Do', 'Re', 'Sol',
        'Mim', 'Do', 'Sol', 'Re', 'Mim', 'Do', 'Sol', 'Re',
        'Sol', 'Re', 'Lam', 'Sol', 'Re', 'Do',
      ]),
      { instrucciones: ['Las tres canciones seguidas.'],
        antes: ['17.1 · Rotación de repertorio', '17.1 · Una canción de memoria'] }),

    prueba('Examen final 1 · Afinación',
      { ...QUIZZES['Afinación Básica (Standard)'], toleranciaCents: 3 },
      { instrucciones: ['Afiná las 6 cuerdas. La aguja tiene que quedar bien en el centro.'],
        antes: ['Examen final'] }),

    prueba('Examen final 2 · Cambios',
      acordes('Cambios del examen', ['Do', 'Lam', 'Do', 'Lam', 'Sol4', 'Re', 'Sol4', 'Re', 'Mi', 'Si7', 'Mi', 'Si7']),
      { instrucciones: ['Los tres pares, sin frenar.'] }),

    prueba('Examen final 3 · Ritmo',
      ritmo('Patrón universal a 90', [[90, 8]], { subdivision: 2, patron: PATRON.universal, aprobar: 0.85 }),
      { instrucciones: ['El patrón universal a 90 BPM.'] }),

    prueba('Examen final 4 · Riff',
      aTempo('Come As You Are a 110 BPM', [[6, 0], [6, 0], [6, 1, 1], [6, 2, 2], [5, 0], [6, 2, 2], [5, 0], [6, 2, 2], [6, 2, 2], [6, 1, 1], [6, 0], [5, 2, 2], [6, 0]],
        110, [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1]),
      { instrucciones: ['Come As You Are a 110 BPM.'] }),

    prueba('Examen final 5 · Canción jefe',
      acordes('Lamento boliviano', ['Mim', 'Sim7', 'Lam', 'Si7', 'Mim', 'Sim7', 'Lam', 'Si7', 'Mim']),
      { instrucciones: ['La canción completa, sin frenar.'] }),

  ],
};

// ───────────────────────── Armado final ─────────────────────────

const PLAN = [
  primerosPasos1, primerosPasos2, primerosPasos3,
  acordes1, acordes2, acordes3, acordes4, acordes5, cambios,
  ritmo1, ritmo2, ritmo3, ritmo4,
  punteo1, punteo2,
  musicalidad1, musicalidad2, concierto,
];

function armarCursos() {
  return PLAN.map((curso, i) => {
    const orden = i + 1;
    let numero = 0;
    const lecciones = curso.lecciones.map(({ titulo, antes, prueba: esPrueba, ...l }) => ({
      ...l,
      nombre: esPrueba ? titulo : `${orden}.${++numero} · ${titulo}`,
      nombresAnteriores: antes || [],
    }));
    return {
      id: curso.id,
      nombre: curso.nombre,
      descripcion: curso.descripcion,
      nivel: curso.nivel || 'principiante',
      orden,
      lecciones,
      instrumento_id: GUITARRA,
    };
  });
}

export const CURSOS = armarCursos();

// ───────────────────────── Controles ─────────────────────────
// Errores que la base no detecta pero que harían que la app ignore la práctica sin avisar.
(() => {
  const errores = [];
  const nombres = new Set();
  const anteriores = new Set();
  for (const curso of CURSOS) {
    for (const l of curso.lecciones) {
      if (nombres.has(l.nombre)) errores.push(`Nombre repetido: ${l.nombre}`);
      nombres.add(l.nombre);
      for (const a of l.nombresAnteriores) {
        if (anteriores.has(a)) errores.push(`Nombre anterior usado dos veces: ${a}`);
        anteriores.add(a);
      }
      const pr = l.practica;
      if (pr?.tipo === 'secuencia') {
        if (pr.pasos.length < 3) errores.push(`${l.nombre}: una secuencia necesita al menos 3 pasos`);
        if (pr.pasos.some((paso) => paso.posiciones.some((pos) => pos.cuerda < 1 || pos.cuerda > 6))) errores.push(`${l.nombre}: cuerda inválida`);
        if (pr.tempo && pr.tempo.duraciones.length !== pr.pasos.length) errores.push(`${l.nombre}: el tempo tiene ${pr.tempo.duraciones.length} duraciones para ${pr.pasos.length} notas`);
        if (pr.tempo && pr.pasos.some((paso) => paso.tipo !== 'nota')) errores.push(`${l.nombre}: un riff a tempo solo puede tener notas sueltas`);
      }
      if (pr?.tipo === 'ritmo') {
        const partes = pr.compas * (pr.subdivision || 1);
        if (pr.patron && pr.patron.length !== partes) errores.push(`${l.nombre}: el patrón tiene ${pr.patron.length} partes y el compás ${partes}`);
      }
      if (l.instrucciones.length === 0) errores.push(`${l.nombre}: faltan instrucciones`);
    }
  }
  if (errores.length) throw new Error(`Cursos de guitarra con errores:\n- ${errores.join('\n- ')}`);
})();
