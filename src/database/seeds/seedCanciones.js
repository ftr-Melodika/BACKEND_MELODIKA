// Archivo: src/database/seeds/seedCanciones.js
// Pone en la base las canciones de canciones.js (tabla canciones_practica, la crea la migración 002_canciones.sql; género, portada y dificultad, la 009).
//
//   npm run seed:canciones -- --probar     Solo valida el archivo, sin conectarse a la base
//   npm run seed:canciones -- --simular    Hace todo y lo deshace: muestra qué cambiaría
//   npm run seed:canciones                 Actualiza las canciones
//
// Cada canción se identifica por su id: si existe se actualiza, si es nueva se crea y si ya no
// está en el archivo se borra. Todo corre en una transacción: si algo falla, la base queda igual.
import pg from 'pg';
import dotenv from 'dotenv';
import { CANCIONES, FORMAS } from './canciones.js';

dotenv.config();

const args = process.argv.slice(2);
const probar = args.includes('--probar');
const simular = args.includes('--simular');

const CORCHEAS_POR_COMPAS = 8;
// 8 corcheas o 16 semicorcheas, sin contar los "|" que marcan dónde cambia el acorde
const DIFICULTADES = ['facil', 'intermedia', 'dificil'];
const RASGUEO_VALIDO = /^([DUX-]{8}|[DUX-]{16})$/;

const acordesDeCompas = (compas) => compas.acordes.split(' ').filter(Boolean);

// Las formas de todos los acordes de la canción: las propias de la canción y, si no, las comunes
function formasDeCancion(cancion) {
  const formas = {};
  for (const compas of cancion.progresion) {
    for (const acorde of acordesDeCompas(compas)) formas[acorde] = cancion.formas?.[acorde] ?? FORMAS[acorde];
  }
  return formas;
}

function validar() {
  const errores = [];
  const ids = new Set();
  for (const c of CANCIONES) {
    const donde = c.id || c.titulo || '(sin id)';
    if (ids.has(c.id)) errores.push(`${donde}: id repetido`);
    ids.add(c.id);
    if (!c.id || !c.titulo || !c.artista || !c.consejo) errores.push(`${donde}: faltan datos`);
    if (!Number.isInteger(c.bpm) || c.bpm < 40 || c.bpm > 220) errores.push(`${donde}: tempo inválido`);
    if (c.dificultad != null && !DIFICULTADES.includes(c.dificultad)) errores.push(`${donde}: dificultad inválida (facil, intermedia o dificil)`);
    if (c.portada != null && !/^https?:\/\//.test(c.portada)) errores.push(`${donde}: la portada tiene que ser una URL`);
    if (!Number.isInteger(c.capo) || c.capo < 0 || c.capo > 7) errores.push(`${donde}: capo inválido`);
    if (!Array.isArray(c.progresion) || c.progresion.length === 0) {
      errores.push(`${donde}: sin progresión`);
      continue;
    }
    c.progresion.forEach((compas, i) => {
      const acordes = typeof compas?.acordes === 'string' ? acordesDeCompas(compas) : [];
      if (![1, 2].includes(acordes.length)) errores.push(`${donde}, compás ${i + 1}: tiene que tener 1 o 2 acordes`);
      const rasgueo = typeof compas?.rasgueo === 'string' ? compas.rasgueo : '';
      if (!RASGUEO_VALIDO.test(rasgueo.replace(/\|/g, ''))) {
        errores.push(`${donde}, compás ${i + 1}: el rasgueo tiene que ser 8 o 16 letras D, U, X o -`);
      }
      // "|" marca dónde cambia el acorde ('DD|UUDDDU'); sin marca, cada acorde toca la mitad
      const marcas = (rasgueo.match(/\|/g) || []).length;
      if (marcas && marcas !== acordes.length - 1) {
        errores.push(`${donde}, compás ${i + 1}: con ${acordes.length} acorde(s) va ${acordes.length - 1} "|" (o ninguno)`);
        return;
      }
      const partes = rasgueo.replace(/\|/g, '').length;
      const tramos = marcas
        ? rasgueo.split('|')
        : acordes.map((_, j) => rasgueo.slice((j * partes) / acordes.length, ((j + 1) * partes) / acordes.length));
      // Cada acorde tiene que tocarse al menos una vez en su parte del compás
      acordes.forEach((acorde, j) => {
        if (!/[DUX]/.test(tramos[j] ?? '')) errores.push(`${donde}, compás ${i + 1}: ${acorde} no tiene ningún golpe`);
      });
    });
    for (const [acorde, forma] of Object.entries(formasDeCancion(c))) {
      if (!Array.isArray(forma) || forma.length === 0) errores.push(`${donde}: no hay forma para ${acorde}`);
    }
  }
  return errores;
}

const errores = validar();
if (errores.length) {
  console.error('El archivo de canciones tiene errores:\n- ' + errores.join('\n- '));
  process.exit(1);
}
console.log(`${CANCIONES.length} canciones válidas.`);
if (probar) process.exit(0);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query('BEGIN');
  const antes = new Set((await client.query('SELECT id FROM canciones_practica')).rows.map((r) => r.id));

  for (const [orden, c] of CANCIONES.entries()) {
    await client.query(
      `INSERT INTO canciones_practica (id, titulo, artista, bpm, capo, progresion, formas, nota_rasgueo, consejo, orden, genero, portada, dificultad)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, artista = EXCLUDED.artista, bpm = EXCLUDED.bpm,
         capo = EXCLUDED.capo, progresion = EXCLUDED.progresion, formas = EXCLUDED.formas,
         nota_rasgueo = EXCLUDED.nota_rasgueo, consejo = EXCLUDED.consejo, orden = EXCLUDED.orden,
         genero = EXCLUDED.genero, portada = EXCLUDED.portada, dificultad = EXCLUDED.dificultad`,
      [c.id, c.titulo, c.artista, c.bpm, c.capo, JSON.stringify(c.progresion), JSON.stringify(formasDeCancion(c)),
        c.notaRasgueo ?? null, c.consejo, orden + 1, c.genero ?? null, c.portada ?? null, c.dificultad ?? null],
    );
    console.log(`${antes.has(c.id) ? 'Actualizada' : 'Nueva'}: ${c.titulo}`);
  }

  const borradas = (await client.query('DELETE FROM canciones_practica WHERE NOT (id = ANY($1)) RETURNING titulo', [CANCIONES.map((c) => c.id)])).rows;
  borradas.forEach((r) => console.log(`Borrada: ${r.titulo}`));

  await client.query(simular ? 'ROLLBACK' : 'COMMIT');
  console.log(simular ? 'Simulación: no se guardó nada.' : 'Canciones actualizadas.');
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('No se actualizaron las canciones:', error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
