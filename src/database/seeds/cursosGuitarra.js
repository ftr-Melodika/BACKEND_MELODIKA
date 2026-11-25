// Archivo: src/database/seeds/cursosGuitarra.js
// Contenido de los cursos de guitarra. Lo carga seedCursos.js.
//
// Fuente: docs/temario-definitivo.md (cursos 1 a 5, diseñados clase por clase). Los textos son los
// del documento, tal cual. Reglas que se cumplen en todas las clases:
// - Los textos en pantalla nunca dicen "la app".
// - Hay un video por curso (clases 1.1, 2.1, 3.1 y 5.3). Quedan preparadas pero sin video cargado:
//   `youtube_id` queda vacío y los puntos del video están en VIDEO_CURSO_n, solo como referencia.
// - Canciones y riffs a velocidad original; la consigna 1 al 75% y la 2 a la original. Se puede practicar
//   a x0.5 (`escalon: 0.5`), pero la clase se aprueba solo a velocidad original. Excepción: la 1.4 lleva
//   `aprobarLento: true` (arranca en x0.5 y aprueba a x0.5 o a x1).
// - El recordatorio de toda clase a tiempo termina con «¿Te cuesta? Probala a x0.5.»; con `aprobarLento`,
//   con «Cuando te salga, probala a x1.»
//
// Formato de cada práctica (lo valida practica_valida en la base; migraciones 001, 007 y 008):
// - `consignas`: varias prácticas seguidas en una clase; cada una lleva su `instruccion`.
// - `notasAlAzar`: el curso dice cuántas notas, qué cuerdas, qué trastes y qué dedo; las notas se arman
//   distintas cada vez que se entra a la clase.
// - `secuencia` con `tempo`: riff a tiempo. `cancion` con `bpm`: pisa el tempo de la canción en esa consigna.
//
// El nombre de cada lección se arma solo: "<n° de curso>.<n° de lección> · <título>". Es lo que la
// identifica en la base.
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

// Formas de los acordes (los mismos nombres que usa la app)
const ACORDES = {
  Mim: [p(6, 0), p(5, 2, 2), p(4, 2, 3), p(3, 0), p(2, 0), p(1, 0)],
  Mi: [p(6, 0), p(5, 2, 2), p(4, 2, 3), p(3, 1, 1), p(2, 0), p(1, 0)],
  Lam: [p(5, 0), p(4, 2, 2), p(3, 2, 3), p(2, 1, 1), p(1, 0)],
  La: [p(5, 0), p(4, 2, 1), p(3, 2, 2), p(2, 2, 3), p(1, 0)],
  Re: [p(4, 0), p(3, 2, 1), p(2, 3, 3), p(1, 2, 2)],
};
const acorde = (nombre) => ({ tipo: 'acorde', nombre, posiciones: ACORDES[nombre] });

const secuencia = (nombre, pasos, tempo) => ({ tipo: 'secuencia', nombre, pasos, ...(tempo ? { tempo } : {}) });

// Cuánto hay que acertar para aprobar una clase a tiempo, y la consigna 1 (escalón) respecto de la original
const APROBAR_A_TIEMPO = 0.75;
// Selector x0.5: para practicar. Solo aprueba la velocidad de la consigna.
const ESCALON_PRACTICA = 0.5;
// Riff a tiempo: una duración (en pulsos) por nota. Con `escalon` se puede practicar a x0.5 pero no aprueba,
// salvo con `aprobarLento`: la clase arranca en x0.5 y se aprueba en cualquiera de las dos velocidades.
const aTempo = (nombre, lista, bpm, duraciones, { aprobarLento = false } = {}) =>
  secuencia(nombre, notas(lista), {
    bpm, duraciones, aprobar: APROBAR_A_TIEMPO, escalon: ESCALON_PRACTICA,
    ...(aprobarLento ? { aprobarLento } : {}),
  });

// Notas al azar: el curso indica cuántas, en qué cuerdas y trastes y con qué dedo.
const notasAlAzar = (nombre, { cantidad, cuerdas, trastes, dedo, dedoPorTraste, vecesPorTraste }) => ({
  tipo: 'notasAlAzar', nombre, cantidad, cuerdas, trastes,
  ...(dedo ? { dedo } : {}),
  ...(dedoPorTraste ? { dedoPorTraste } : {}),
  vecesPorTraste,
  sinRepetirSeguidas: true, // nunca la misma nota dos veces seguidas
});

// Cambio entre dos acordes: A → B → A → B → A (4 cambios), con un rasgueo por acorde
const cambio = (a, b) => secuencia(`${a} ↔ ${b}`, [a, b, a, b, a].map(acorde));
// Acorde: cuerda por cuerda (con el pulgar, de la más grave a la 1) y un rasgueo tres veces
const cuerdaPorCuerda = (nombre) =>
  secuencia(`${nombre}: cuerda por cuerda`, [...ACORDES[nombre]].sort((a, b) => b.cuerda - a.cuerda).map((pos) => ({ tipo: 'nota', nombre: nombreNota(pos.cuerda, pos.traste), posiciones: [pos] })));
const rasgueoTresVeces = (nombre) => secuencia(`${nombre}: un rasgueo, tres veces`, [acorde(nombre), acorde(nombre), acorde(nombre)]);

// Ejercicio de tempo con metrónomo. etapas: [[bpm, compases], …]
const ritmo = (nombre, etapas, { compas = 4 } = {}) => ({
  tipo: 'ritmo', nombre, compas,
  etapas: etapas.map(([bpm, compases]) => ({ bpm, compases })),
  aprobar: APROBAR_A_TIEMPO,
});

// Canción del catálogo (canciones_practica). `bpm` pisa el tempo de la canción en esa consigna.
const cancion = (cancionId, fase, opciones = {}) => ({ tipo: 'cancion', cancionId, fase, ...opciones });
const cancionATiempo = (cancionId, bpm) => cancion(cancionId, 'tocar', { bpm, aprobar: APROBAR_A_TIEMPO, escalon: ESCALON_PRACTICA });

// Una consigna de una clase: la práctica más su instrucción
const consigna = (instruccion, practica) => ({ ...practica, instruccion });
const consignas = (lista) => ({ tipo: 'consignas', consignas: lista });

// ───────────────────────── Tipos de lección ─────────────────────────

const XP_PRACTICA = 50;
const XP_CANCION_TOCAR = 100;
const X05 = '¿Te cuesta? Probala a x0.5.';
const X1 = 'Cuando te salga, probala a x1.';

// Una clase. `objetivo` queda como descripción. Sin teoría en pantalla: la explicación va en el video del curso.
// Si no se pasan instrucciones, se usa la de la primera consigna.
function clase(titulo, practica, { objetivo, destacado = null, instrucciones, xp = XP_PRACTICA }) {
  const porDefecto = practica.tipo === 'consignas' ? [practica.consignas[0].instruccion] : [];
  return {
    titulo, tipo: 'practica', descripcion: objetivo, texto_teoria: null,
    texto_destacado: destacado, instrucciones: instrucciones ?? porDefecto, practica, xp,
  };
}

// Clases de acordes: consigna 1 cuerda por cuerda y consigna 2 un rasgueo tres veces
function claseDeAcorde(titulo, nombre, { objetivo, destacado, primeraCuerda }) {
  return clase(titulo, consignas([
    consigna(`Armá el ${nombre} y tocá cada cuerda con el pulgar, de la ${primeraCuerda} a la 1.`, cuerdaPorCuerda(nombre)),
    consigna(`Armá el ${nombre}, rasgueá una vez y soltá la mano. Tres veces.`, rasgueoTresVeces(nombre)),
  ]), { objetivo, destacado });
}

// Clase de cambio entre dos acordes sin dedos fijos (3.6 y 5.2)
const claseDeCambioEnBloque = (titulo, a, b, objetivo) =>
  clase(titulo, cambio(a, b), {
    objetivo,
    destacado: 'Mové los dedos juntos, como un bloque, no de a uno.',
    instrucciones: [`Armá el ${a}, rasgueá una vez y pasá al ${b} con los tres dedos a la vez.`],
  });

// ───────────────────────── Videos (preparados, sin cargar) ─────────────────────────
// Un video por curso. Los puntos son lo que tiene que explicar; el `youtube_id` se carga cuando exista.

const VIDEO_CURSO_1 = [
  'Cómo funciona una clase: dar permiso al micrófono, buscar un lugar sin ruido, dejar el celular cerca de la guitarra, tocar y esperar el ✓.',
  'Partes de la criolla: clavijero y clavijas, cejuela, mástil y trastes, caja y boca, puente.',
  'Postura: sentado, la guitarra apoyada en la pierna, el mástil apenas hacia arriba, la espalda derecha. Una mano en el mástil y la otra sobre la boca (los zurdos, al revés).',
  'Las cuerdas: la 6 es la más gruesa (queda arriba) y la 1 la más fina. Sus nombres: Mi, La, Re, Sol, Si, Mi.',
  'Cómo afinar: cada cuerda termina en su clavija. Tensar sube la nota y aflojar la baja. Girar de a poco: si se gira de más, la cuerda se puede cortar.',
  'Afinar siempre: el nailon se desafina entre una sesión y otra, y las cuerdas nuevas se estiran durante varios días.',
  'Qué es un traste y cómo se cuentan: el 1 es el más cercano a las clavijas.',
  'Cómo pisar: con la punta del dedo, justo detrás del metal, sin apretar de más. El pulgar de la mano que pisa va detrás del mástil.',
  'Los dedos: 1 índice, 2 mayor, 3 anular, 4 meñique. En este curso se usa solo el índice.',
  'Cómo leer el mástil: qué cuerda se toca, el círculo con el número de dedo y el 0 para la cuerda al aire.',
];
const VIDEO_CURSO_2 = [
  'Un dedo por traste: cada dedo se ocupa de un traste, así la mano no se mueve.',
  'Dedos arqueados: pisar con la punta y el dedo curvo, para no apagar la cuerda de al lado.',
  'Dedos cerca del mástil: los que no pisan quedan cerca, listos para la próxima nota.',
];
const VIDEO_CURSO_3 = [
  'Cómo leer un acorde en el mástil: cada círculo es un dedo en su cuerda y traste; la X es una cuerda que no se toca y el 0 una cuerda al aire.',
  'Que suenen todas las cuerdas: dedos arqueados, para no apagar las cuerdas al aire.',
  'Cómo hacer un rasgueo único: el pulgar baja por todas las cuerdas de una pasada, sin tocar las que tienen X.',
];
const VIDEO_CURSO_5 = [
  'Cómo apagar las cuerdas: la mano que pisa apoyada sobre las cuerdas, sin apretar, para que suenen secas, como un tambor.',
  'Rasguear parejo con el pulgar: la mano no se frena entre golpe y golpe.',
];
export const VIDEOS_PENDIENTES = { 'Primeros pasos I': VIDEO_CURSO_1, 'Seven Nation Army': VIDEO_CURSO_2, 'Primeros acordes': VIDEO_CURSO_3, 'Re y rasgueo de 4 golpes': VIDEO_CURSO_5 };

// ═════════════════════════ CURSO 1 · PRIMEROS PASOS I ═════════════════════════

// Smoke on the Water, cuerda 6 con el índice: frases 1 a 4 (el 0 es la cuerda al aire)
const SMOKE = {
  frase1: [[6, 0], [6, 3, 1], [6, 5, 1]],
  frase2: [[6, 0], [6, 3, 1], [6, 6, 1], [6, 5, 1]],
  frase3: [[6, 0], [6, 3, 1], [6, 5, 1]],
  frase4: [[6, 3, 1], [6, 0]],
};
const SMOKE_RIFF = [...SMOKE.frase1, ...SMOKE.frase2, ...SMOKE.frase3, ...SMOKE.frase4];
// Pulsos que dura cada nota hasta la siguiente. A CONFIRMAR escuchando el original.
const SMOKE_DURACIONES = [1, 1, 2, 1, 1, 0.5, 2.5, 1, 1, 2, 1, 2];
const INSTRUCCION_SMOKE = 'Pisá con el índice el traste marcado y tocá la cuerda 6 con el pulgar. Esperá el ✓.';

const curso1 = {
  id: id('71'),
  nombre: 'Primeros pasos I',
  descripcion: 'Tené la guitarra afinada, conocé las 6 cuerdas y da tus primeros golpes parejos hasta tocar tu primer riff famoso.',
  lecciones: [
    // Lleva el video del curso 1 (VIDEO_CURSO_1): se ve antes del afinador. Todavía sin cargar.
    clase('Afiná tu guitarra',
      { tipo: 'afinacion', nombre: 'Afinación estándar', toleranciaCents: 10, msEstable: 1000, cuerdas: [6, 5, 4, 3, 2, 1].map((cuerda) => ({ cuerda })) },
      { objetivo: 'Dejar las 6 cuerdas afinadas.',
        destacado: 'Girá la clavija de a poco y mirá la aguja. Si se aleja del centro, girá para el otro lado.',
        instrucciones: ['Tocá la cuerda pedida y girá su clavija despacio hasta que la aguja quede en el centro.'] }),

    clase('Tu primer traste',
      notasAlAzar('Tu primer traste', { cantidad: 8, cuerdas: [1, 2, 3, 4, 5, 6], trastes: [1, 2, 3, 4], dedo: 1, vecesPorTraste: 2 }),
      { objetivo: 'Pisar cualquier traste de la primera posición con el índice y que la nota suene limpia.',
        destacado: 'Punta del dedo, pegado al metal del traste.',
        instrucciones: ['Pisá con el índice el traste marcado y tocá la cuerda con el pulgar. Esperá el ✓.'] }),

    clase('Smoke on the Water, nota por nota',
      consignas([
        consigna(INSTRUCCION_SMOKE, secuencia('Consigna 1 · Frases 1 y 2', notas([...SMOKE.frase1, ...SMOKE.frase2]))),
        consigna(INSTRUCCION_SMOKE, secuencia('Consigna 2 · Frases 3 y 4', notas([...SMOKE.frase3, ...SMOKE.frase4]))),
        consigna(INSTRUCCION_SMOKE, secuencia('Consigna 3 · El riff entero', notas(SMOKE_RIFF))),
      ]),
      { objetivo: 'Tocar tu primera melodía famosa, sin apuro.',
        destacado: 'Un solo dedo: el índice va de traste en traste, pegado al metal.' }),

    clase('Smoke on the Water, a tiempo',
      consignas([
        // 75% de 115 BPM
        consigna('Índice en el traste marcado y pulgar en la cuerda 6: tocá cada nota cuando llegue a la línea.',
          aTempo('Consigna 1 · Más lento', SMOKE_RIFF, 86, SMOKE_DURACIONES, { aprobarLento: true })),
        consigna('Índice en el traste marcado y pulgar en la cuerda 6: tocá cada nota cuando llegue a la línea.',
          aTempo('Consigna 2 · Velocidad original', SMOKE_RIFF, 115, SMOKE_DURACIONES, { aprobarLento: true })),
      ]),
      { objetivo: 'Tocar el riff a tiempo, primero más lento y después a la velocidad final.',
        destacado: `Tocá cada nota justo cuando llega a la línea. Si te perdés una, seguí con la siguiente. ${X1}` }),
  ],
};

// ═════════════════════════ CURSO 2 · SEVEN NATION ARMY ═════════════════════════

// Riff: E E G E D C B (cuerda, traste, dedo)
const SEVEN_PARTE_1 = [[4, 2, 2], [4, 2, 2], [3, 0], [4, 2, 2]];
const SEVEN_PARTE_2 = [[4, 0], [5, 3, 3], [5, 2, 2]];
const SEVEN_RIFF = [...SEVEN_PARTE_1, ...SEVEN_PARTE_2];
const SEVEN_DOS_VECES = [...SEVEN_RIFF, ...SEVEN_RIFF];
// Pulsos de cada nota. A CONFIRMAR escuchando el original.
const SEVEN_DURACIONES = [1.5, 0.5, 0.75, 0.75, 0.5, 2, 2, 1.5, 0.5, 0.75, 0.75, 0.5, 2, 2];
const INSTRUCCION_SEVEN = 'Pisá el traste marcado con el dedo indicado y tocá la cuerda marcada con el pulgar. Esperá el ✓.';
// Escalera por las cuerdas 5, 4, 3, 4, 5 en un mismo traste y con el mismo dedo
const escalera = (traste) => [5, 4, 3, 4, 5].map((cuerda) => [cuerda, traste, traste]);
const ESCALERA_10 = [...escalera(2), ...escalera(3)];
const INSTRUCCION_ESCALERA = 'Pisá el traste marcado con el dedo indicado y tocá con el pulgar solo la cuerda marcada.';

const curso2 = {
  id: id('72'),
  nombre: 'Seven Nation Army',
  descripcion: 'Sumá los dedos 2 y 3 y pasá de una cuerda a otra hasta tocar el riff de Seven Nation Army (The White Stripes).',
  lecciones: [
    // Lleva el video del curso 2 (VIDEO_CURSO_2): se ve al empezar la clase. Todavía sin cargar.
    clase('Dedos 2 y 3',
      notasAlAzar('Dedos 2 y 3', { cantidad: 9, cuerdas: [3, 4, 5], trastes: [1, 2, 3], dedoPorTraste: true, vecesPorTraste: 3 }),
      { objetivo: 'Pisar con el dedo que corresponde a cada traste (1, 2 y 3), sumando los dos dedos nuevos.',
        destacado: 'Un dedo por traste: el 1 en el traste 1, el 2 en el 2 y el 3 en el 3.',
        instrucciones: ['Pisá el traste marcado con el dedo indicado y tocá la cuerda con el pulgar. Esperá el ✓.'] }),

    clase('De cuerda en cuerda',
      consignas([
        consigna(INSTRUCCION_ESCALERA, secuencia('Consigna 1 · Nota por nota', notas(ESCALERA_10))),
        // Una nota por pulso a 60 BPM
        consigna(INSTRUCCION_ESCALERA, secuencia('Consigna 2 · A tiempo', notas(ESCALERA_10),
          { bpm: 60, duraciones: ESCALERA_10.map(() => 1), aprobar: APROBAR_A_TIEMPO })),
      ]),
      { objetivo: 'Pasar de una cuerda a otra con el pulgar, tocando solo la cuerda pedida.',
        destacado: 'El dedo se queda en su traste; solo cambia la cuerda.' }),

    clase('Seven Nation Army, nota por nota',
      consignas([
        consigna(INSTRUCCION_SEVEN, secuencia('Consigna 1 · Primera parte (E E G E)', notas(SEVEN_PARTE_1))),
        consigna(INSTRUCCION_SEVEN, secuencia('Consigna 2 · Segunda parte (D C B)', notas(SEVEN_PARTE_2))),
        consigna(INSTRUCCION_SEVEN, secuencia('Consigna 3 · El riff entero, dos veces', notas(SEVEN_DOS_VECES))),
      ]),
      { objetivo: 'Tocar el riff completo sin apuro.',
        destacado: 'Traste 2 con el dedo 2, traste 3 con el dedo 3.' }),

    clase('Seven Nation Army, a tiempo',
      consignas([
        // 75% de 124 BPM
        consigna('Pisá el traste marcado con el dedo indicado y tocá cada nota cuando llegue a la línea.',
          aTempo('Consigna 1 · Más lento', SEVEN_DOS_VECES, 93, SEVEN_DURACIONES)),
        // A CONFIRMAR: 124 BPM y el ritmo del riff, con la grabación
        consigna('Pisá el traste marcado con el dedo indicado y tocá cada nota cuando llegue a la línea.',
          aTempo('Consigna 2 · Velocidad original', SEVEN_DOS_VECES, 124, SEVEN_DURACIONES)), // A CONFIRMAR
      ]),
      { objetivo: 'Tocar el riff a tiempo, primero más lento y después a la velocidad final.',
        destacado: `Tocá cada nota justo cuando llega a la línea. Si te perdés una, seguí con la siguiente. ${X05}` }),
  ],
};

// ═════════════════════════ CURSO 3 · PRIMEROS ACORDES ═════════════════════════

const curso3 = {
  id: id('73'),
  nombre: 'Primeros acordes',
  descripcion: 'Armá Mim, Mi, Lam y La, y aprendé a cambiar entre ellos.',
  lecciones: [
    // Lleva el video del curso 3 (VIDEO_CURSO_3): se ve al empezar la clase. Todavía sin cargar.
    // El Mim es el único con textos propios de cada consigna (el recordatorio es uno para toda la clase).
    claseDeAcorde('Mim', 'Mim', { objetivo: 'Armar el primer acorde y que suenen limpias las 6 cuerdas.', destacado: 'Dedos arqueados: que suenen las 6 cuerdas.', primeraCuerda: 6 }),
    claseDeAcorde('Mi', 'Mi', { objetivo: 'Armar el Mi y que suenen limpias las 6 cuerdas.', destacado: 'El Mim + el índice en la cuerda 3, traste 1.', primeraCuerda: 6 }),
    claseDeAcorde('Lam', 'Lam', { objetivo: 'Armar el Lam y que suenen limpias las cuerdas de la 5 a la 1.', destacado: 'La forma de Mi, una cuerda más abajo. La cuerda 6 no se toca.', primeraCuerda: 5 }),
    claseDeAcorde('La', 'La', { objetivo: 'Armar el La y que suenen limpias las cuerdas de la 5 a la 1.', destacado: 'Tres dedos en fila en el traste 2: cuerdas 4, 3 y 2. La cuerda 6 no se toca.', primeraCuerda: 5 }),

    clase('Cambios fáciles',
      consignas([
        consigna('Los dedos 2 y 3 no se mueven: solo entra y sale el índice.', cambio('Mim', 'Mi')),
        consigna('La forma entera baja o sube una cuerda: los tres dedos se mueven juntos.', cambio('Mi', 'Lam')),
        consigna('Los dedos 2 y 3 bajan juntos una cuerda y, en Lam, se suma el índice.', cambio('Mim', 'Lam')),
      ]),
      { objetivo: 'Cambiar entre Mim, Mi y Lam sin rearmar los acordes, dejando quietos los dedos que se repiten.',
        destacado: 'Si un dedo está en el mismo lugar en los dos acordes, no lo levantes: se queda fijo.' }),

    claseDeCambioEnBloque('Cambio Mim ↔ La', 'Mim', 'La', 'Cambiar entre Mim y La, el cambio que usa Será en el curso 4.'),
  ],
};

// ═════════════════════════ CURSO 4 · PRIMER RASGUEO ═════════════════════════

const INSTRUCCION_PULSO = 'Esperá la cuenta y aplaudí con cada clic.';

const curso4 = {
  id: id('74'),
  nombre: 'Primer rasgueo',
  descripcion: 'Marcá el pulso y tocá el estribillo de Será (Las Pelotas), rasgueando La y Mim a tiempo.',
  lecciones: [
    clase('El pulso',
      consignas([
        consigna(INSTRUCCION_PULSO, ritmo('Consigna 1 · Un aplauso por clic', [[60, 4]])),
        consigna('Aplaudí con el clic y acompañá cada subida de velocidad.', ritmo('Consigna 2 · Subir de a poco', [[60, 1], [70, 1], [80, 1]])),
      ]),
      { objetivo: 'Aplaudir justo con el clic del metrónomo y acompañarlo cuando acelera.',
        destacado: 'Aplaudí justo con el clic, ni antes ni después.' }),

    // El documento no trae instrucción para esta clase: texto propuesto
    clase('Será: acordes y cambio',
      cancion('sera', 'aprender'),
      { objetivo: 'Repasar La y Mim dentro de la canción y el cambio entre ellos, sin tiempo.',
        instrucciones: ['Armá cada acorde de Será y después el cambio entre ellos.'] }),

    clase('Será: el estribillo a tiempo',
      consignas([
        // 75% de 128 BPM
        consigna('Rasgueá una vez con el pulgar cada acorde cuando llegue a la línea.', cancionATiempo('sera', 96)),
        consigna('Rasgueá una vez con el pulgar cada acorde cuando llegue a la línea.', cancionATiempo('sera', 128)),
      ]),
      { objetivo: 'Tocar el estribillo de Será a la velocidad original, con un rasgueo por acorde.',
        destacado: `Tenés 4 tiempos en cada acorde: usá los últimos para preparar el próximo. ${X05}`,
        xp: XP_CANCION_TOCAR }),
  ],
};

// ═════════════════════════ CURSO 5 · RE Y RASGUEO DE 4 GOLPES ═════════════════════════

const curso5 = {
  id: id('75'),
  nombre: 'Re y rasgueo de 4 golpes',
  descripcion: 'Sumá el Re y pasá de un golpe por acorde a cuatro golpes por compás hasta tocar Horse With No Name (America).',
  lecciones: [
    claseDeAcorde('Re', 'Re', { objetivo: 'Armar el Re y que suenen limpias las cuerdas de la 4 a la 1.', destacado: 'Un triángulo en las cuerdas 3, 2 y 1. La 6 y la 5 no se tocan.', primeraCuerda: 4 }),

    claseDeCambioEnBloque('Cambio Mim ↔ Re', 'Mim', 'Re', 'Cambiar entre Mim y Re, el cambio de la canción.'),

    // Lleva el video del curso 5 (VIDEO_CURSO_5): se ve al empezar la clase. Todavía sin cargar.
    // A CONFIRMAR: 100 BPM queda por ahora
    clase('Rasgueo de 4 golpes',
      ritmo('Rasgueo con las cuerdas apagadas', [[100, 4]]), // A CONFIRMAR
      { objetivo: 'Rasguear un golpe por tiempo, parejo y sin frenar la mano.',
        destacado: 'Mano que pisa apoyada, sin apretar: que suene seco. Un golpe por clic.',
        instrucciones: ['Esperá la cuenta y rasgueá con el pulgar un golpe por clic.'] }),

    // El documento no trae instrucción para esta clase: texto propuesto
    clase('Horse With No Name: aprender',
      cancion('horse-with-no-name', 'aprender'),
      { objetivo: 'Repasar Mim y Re dentro de la canción y el cambio entre ellos, sin tiempo.',
        instrucciones: ['Armá cada acorde de Horse With No Name y después el cambio entre ellos.'] }),

    // Una sola consigna, a 94 BPM (75% de los 125 del original): a 125 es demasiado para un principiante
    clase('Horse With No Name a tiempo',
      consignas([
        consigna('Rasgueá con el pulgar un golpe por tiempo: cuatro por acorde.', cancionATiempo('horse-with-no-name', 94)),
      ]),
      { objetivo: 'Tocar Horse With No Name con 4 golpes por compás, a un tempo cómodo para empezar.',
        destacado: `Cuatro golpes por acorde. En el cuarto, ya andá preparando el próximo. ${X05}`,
        xp: XP_CANCION_TOCAR }),
  ],
};

// ───────────────────────── Armado final ─────────────────────────

const PLAN = [curso1, curso2, curso3, curso4, curso5];

function armarCursos() {
  return PLAN.map((curso, i) => {
    const orden = i + 1;
    const lecciones = curso.lecciones.map(({ titulo, ...l }, j) => ({
      ...l,
      nombre: `${orden}.${j + 1} · ${titulo}`,
      nombresAnteriores: [], // todos los alumnos arrancan de cero: no se enlaza ninguna clase vieja
    }));
    return { id: curso.id, nombre: curso.nombre, descripcion: curso.descripcion, nivel: 'principiante', orden, lecciones, instrumento_id: GUITARRA };
  });
}

export const CURSOS = armarCursos();

// ───────────────────────── Controles ─────────────────────────
// Errores que la base no detecta pero que harían que la app ignore la práctica sin avisar,
// o que rompen las reglas del temario.

const textosDeClase = (l) => [
  l.texto_destacado, ...l.instrucciones,
  ...(l.practica.tipo === 'consignas' ? l.practica.consignas.map((c) => c.instruccion) : []),
].filter(Boolean);

const practicasDeClase = (pr) => (pr.tipo === 'consignas' ? pr.consignas : [pr]);

function controlarPractica(nombre, pr, errores) {
  if (pr.tipo === 'secuencia') {
    if (pr.pasos.length < 3) errores.push(`${nombre}: una secuencia necesita al menos 3 pasos`);
    if (pr.pasos.some((paso) => paso.posiciones.some((pos) => pos.cuerda < 1 || pos.cuerda > 6))) errores.push(`${nombre}: cuerda inválida`);
    if (pr.tempo && pr.tempo.duraciones.length !== pr.pasos.length) errores.push(`${nombre}: el tempo tiene ${pr.tempo.duraciones.length} duraciones para ${pr.pasos.length} notas`);
    if (pr.tempo && pr.pasos.some((paso) => paso.tipo !== 'nota')) errores.push(`${nombre}: un riff a tempo solo puede tener notas sueltas`);
  }
  if (pr.tipo === 'ritmo' && pr.patron && pr.patron.length !== pr.compas * (pr.subdivision || 1)) errores.push(`${nombre}: el patrón no coincide con el compás`);
  if (pr.tipo === 'notasAlAzar') {
    if (pr.vecesPorTraste * pr.trastes.length !== pr.cantidad) errores.push(`${nombre}: ${pr.cantidad} notas no se reparten parejo entre ${pr.trastes.length} trastes`);
    if (pr.cuerdas.length * pr.trastes.length < 2) errores.push(`${nombre}: con una sola nota posible no se puede evitar repetirla`);
  }
}

(() => {
  const errores = [];
  const nombres = new Set();
  for (const curso of CURSOS) {
    for (const l of curso.lecciones) {
      if (nombres.has(l.nombre)) errores.push(`Nombre repetido: ${l.nombre}`);
      nombres.add(l.nombre);
      if (l.instrucciones.length === 0) errores.push(`${l.nombre}: faltan instrucciones`);
      // Regla del temario: los textos en pantalla nunca dicen "la app"
      for (const texto of [...textosDeClase(l), ...practicasDeClase(l.practica).map((c) => c.nombre)].filter(Boolean)) {
        if (/\bla app\b/i.test(texto)) errores.push(`${l.nombre}: un texto en pantalla dice "la app": ${texto}`);
      }
      const partes = practicasDeClase(l.practica);
      if (l.practica.tipo === 'consignas' && partes.some((c) => !c.instruccion)) errores.push(`${l.nombre}: hay una consigna sin instrucción`);
      partes.forEach((pr, i) => controlarPractica(`${l.nombre} (consigna ${i + 1})`, pr, errores));
      // Regla del temario: toda clase con x0.5 cierra el recordatorio invitando a la otra velocidad
      const permiteX05 = partes.some((pr) => pr.escalon || pr.tempo?.escalon);
      const cierre = partes.some((pr) => pr.tempo?.aprobarLento) ? X1 : X05;
      if (permiteX05 && !l.texto_destacado?.endsWith(cierre)) errores.push(`${l.nombre}: el recordatorio tiene que terminar con «${cierre}»`);
    }
  }
  if (errores.length) throw new Error(`Cursos de guitarra con errores:\n- ${errores.join('\n- ')}`);
})();
