// Archivo: src/database/seeds/canciones.js
// Catálogo de canciones de la sección Práctica. Se carga con: npm run seed:canciones
// No lleva letras: tienen derechos de autor. Los acordes van en cifrado americano (Em, C, G…).
//
// `progresion`: un elemento por compás (4/4), con sus acordes y su rasgueo:
//   - acordes: "Em" o "Em C" (dos acordes = medio compás cada uno).
//   - rasgueo: 8 corcheas, "1 y 2 y 3 y 4 y", o 16 semicorcheas, "1 e y a 2 e y a…".
//     D = ↓ abajo, U = ↑ arriba, X = golpe apagado, - = la mano pasa sin tocar. Con dos acordes, las 4 primeras corcheas son del primero y
//     las 4 últimas del segundo: cada acorde tiene su propio rasgueo. Si no duran lo mismo, un
//     "|" marca dónde cambia: 'DD|UUDDDU' = 2 corcheas del primero y 6 del segundo.
// `formas`: solo si la canción usa otra forma de un acorde (Wonderwall). Las demás salen de FORMAS.
// `bpm` es el tempo del original (verificado en Tunebat, SongBPM, GetSongBPM y Karaoke Version, nov. 2026).

// Cómo se arma cada acorde. Cuerda 1 = Mi agudo; las cuerdas que no se tocan no aparecen.
// Con capo, el traste 0 es el capo: las formas son las mismas y suenan más agudas.
const p = (cuerda, traste, dedo) => (traste === 0 ? { cuerda, traste } : { cuerda, traste, dedo });
export const FORMAS = {
  Em: [p(6, 0), p(5, 2, 2), p(4, 2, 3), p(3, 0), p(2, 0), p(1, 0)],
  Am: [p(5, 0), p(4, 2, 2), p(3, 2, 3), p(2, 1, 1), p(1, 0)],
  C: [p(5, 3, 3), p(4, 2, 2), p(3, 0), p(2, 1, 1), p(1, 0)],
  G: [p(6, 3, 2), p(5, 2, 1), p(4, 0), p(3, 0), p(2, 0), p(1, 3, 3)],
  D: [p(4, 0), p(3, 2, 1), p(2, 3, 3), p(1, 2, 2)],
  B7: [p(5, 2, 2), p(4, 1, 1), p(3, 2, 3), p(2, 0), p(1, 2, 4)],
  // Con cejilla en el traste 2 (de la 5ta a la 1ra)
  Bm: [p(5, 2, 1), p(4, 4, 3), p(3, 4, 4), p(2, 3, 2), p(1, 2, 1)],
  // Do con el Sol en el bajo
  'C/G': [p(6, 3, 3), p(5, 3, 4), p(4, 2, 2), p(3, 0), p(2, 1, 1), p(1, 0)],
  // Con cejilla en el traste 1
  F: [p(6, 1, 1), p(5, 3, 3), p(4, 3, 4), p(3, 2, 2), p(2, 1, 1), p(1, 1, 1)],
  Fm: [p(6, 1, 1), p(5, 3, 3), p(4, 3, 4), p(3, 1, 1), p(2, 1, 1), p(1, 1, 1)],
  // Con cejilla en el traste 3
  Gm: [p(6, 3, 1), p(5, 5, 3), p(4, 5, 4), p(3, 3, 1), p(2, 3, 1), p(1, 3, 1)],
  Cm: [p(5, 3, 1), p(4, 5, 3), p(3, 5, 4), p(2, 4, 2), p(1, 3, 1)],
  Em7: [p(6, 0), p(5, 2, 1), p(4, 2, 2), p(3, 0), p(2, 3, 3), p(1, 3, 4)],
  Dsus4: [p(4, 0), p(3, 2, 1), p(2, 3, 3), p(1, 3, 4)],
  A7sus4: [p(5, 0), p(4, 2, 1), p(3, 0), p(2, 3, 3), p(1, 3, 4)],
};

// Todos los compases con el mismo rasgueo
const conRasgueo = (rasgueo, compases) => compases.map((acordes) => ({ acordes, rasgueo }));

export const CANCIONES = [
  {
    id: 'de-musica-ligera', titulo: 'De música ligera', artista: 'Soda Stereo', bpm: 124, capo: 0,
    // En semicorcheas, 2 tiempos cada acorde. El primero: ↓ en el 1 y ↓ en el 2. El segundo, más
    // rápido: ↑ ↑ ↓ ↓ ↓ ↑ desde la "e" del 3, que se completa con el ↓ del acorde siguiente.
    //            1 e y a 2 e y a 3 e y a 4 e y a
    progresion: conRasgueo('D---D----UUDDDU-', ['Em C', 'G D']),
    consejo: 'Dos acordes por compás, 2 tiempos cada uno: el primero tranquilo (↓ ↓) y el segundo rápido (↑ ↑ ↓ ↓ ↓ ↑), que termina en el ↓ del acorde siguiente.',
  },
  {
    id: 'lamento-boliviano', titulo: 'Lamento boliviano', artista: 'Enanitos Verdes', bpm: 124, capo: 0,
    progresion: conRasgueo('D-DU-UDU', ['Em', 'Em', 'Bm', 'Bm', 'Am', 'Am', 'Em', 'B7']),
    consejo: 'Bm lleva cejilla en el traste 2. B7 te lleva de vuelta a Em.',
  },
  {
    id: 'flaca', titulo: 'Flaca', artista: 'Andrés Calamaro', bpm: 109, capo: 0,
    progresion: conRasgueo('D-DU-UDU', ['G', 'B7', 'Em', 'C', 'G', 'D', 'G', 'D']),
    consejo: 'Tranquila y sin apuro: dejá sonar cada acorde.',
  },
  {
    id: 'arrancarmelo', titulo: 'Arrancármelo', artista: 'WOS', bpm: 82, capo: 0,
    progresion: conRasgueo('D-DU-UDU', ['C/G', 'F', 'Fm', 'Gm']),
    notaRasgueo: 'En las primeras 2 estrofas, un solo golpe ↓ por acorde.',
    consejo: 'F, Fm y Gm llevan cejilla. De F a Fm solo se mueve un dedo.',
  },
  {
    // Publicada a 87 BPM, pero cada acorde dura 2 de esos tiempos y se rasguea en semicorcheas.
    // Contada al doble (174) entra en el formato de la app: un acorde por compás y 8 golpes cada uno.
    id: 'wonderwall', titulo: 'Wonderwall', artista: 'Oasis', bpm: 174, capo: 2,
    // El rasgueo cambia en cada compás
    progresion: [
      { acordes: 'Em7', rasgueo: 'D-D-D---' },
      { acordes: 'G', rasgueo: 'DUDUD-D-' },
      { acordes: 'Dsus4', rasgueo: 'DUDUD-D-' },
      { acordes: 'A7sus4', rasgueo: 'DUUUDUDU' },
    ],
    // En Wonderwall el Sol se toca con los dedos 3 y 4 en las cuerdas 2 y 1, como en los demás acordes
    formas: { G: [p(6, 3, 2), p(5, 2, 1), p(4, 0), p(3, 0), p(2, 3, 3), p(1, 3, 4)] },
    consejo: 'Los dedos 3 y 4 quedan fijos en las cuerdas 2 y 1 en los cuatro acordes: no los levantes.',
  },
  {
    id: 'creep', titulo: 'Creep', artista: 'Radiohead', bpm: 92, capo: 0,
    progresion: conRasgueo('DDUUDDUD', ['G', 'B7', 'C', 'Cm']),
    consejo: 'Cm lleva cejilla en el traste 3. De C a Cm la mano sube por el mástil.',
  },
  {
    id: 'riptide', titulo: 'Riptide', artista: 'Vance Joy', bpm: 102, capo: 1,
    progresion: conRasgueo('D-DUDUD-', ['Am', 'G', 'C', 'C']),
    consejo: 'Tres acordes abiertos y un rasgueo con mucho movimiento.',
  },
  {
    id: 'stand-by-me', titulo: 'Stand By Me', artista: 'Ben E. King', bpm: 118, capo: 2,
    progresion: conRasgueo('DUXUDUXU', ['G', 'Em', 'C', 'D']),
    consejo: 'La X es un golpe apagado: apoyá la palma sobre las cuerdas al rasguear.',
  },
];
