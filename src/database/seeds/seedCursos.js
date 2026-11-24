// Archivo: src/database/seeds/seedCursos.js
// Pone en la base los cursos de guitarra de cursosGuitarra.js.
//
//   npm run seed:cursos -- --probar        Valida todo contra la BD, sin escribir nada
//   npm run seed:cursos -- --simular [--migracion 001_x.sql]
//                                          Hace todo (con la migración, si se indica) y lo deshace:
//                                          muestra qué cambiaría sin guardar nada
//   npm run seed:cursos                    Guarda un backup en backups/ y actualiza los cursos
//   npm run seed:cursos -- --desde-cero    Como el normal, pero primero borra TODOS los cursos de guitarra con su
//                                          progreso: los alumnos arrancan de cero (sirve también con --simular)
//   npm run seed:cursos -- --restaurar backups/cursos-XXXX.json   Vuelve al backup
//
// Cada lección se identifica por su nombre: si ya existe se actualiza en su lugar (y el progreso de
// los alumnos se conserva); si es nueva se crea; si ya no está en el archivo se borra, con su
// progreso. Para renombrar una lección sin perder el progreso, agregá el nombre viejo a `antes`.
// Los cursos de guitarra que no están en el archivo también se borran.
// Todo corre en una transacción: si algo falla, la base queda como estaba.
import pg from 'pg';
import dotenv from 'dotenv';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { CURSOS } from './cursosGuitarra.js';

dotenv.config();

const GUITARRA = '6c990a6d-47cd-4df8-83bd-acbb521da352';
const args = process.argv.slice(2);
const probar = args.includes('--probar');
const restaurar = args.includes('--restaurar') ? args[args.indexOf('--restaurar') + 1] : null;
const simular = args.includes('--simular');
const desdeCero = args.includes('--desde-cero');
const migracion = args.includes('--migracion') ? args[args.indexOf('--migracion') + 1] : null;

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function validar() {
  const errores = [];
  let total = 0;
  const cancionesExistentes = new Set((await client.query('SELECT id FROM canciones_practica')).rows.map((r) => r.id));
  for (const curso of CURSOS) {
    const nombres = new Set();
    for (const leccion of curso.lecciones) {
      total++;
      if (nombres.has(leccion.nombre)) errores.push(`${curso.nombre}: nombre repetido "${leccion.nombre}"`);
      nombres.add(leccion.nombre);
      // La práctica puede ser una sola o varias consignas: se revisa cada canción que use
      const partes = leccion.practica?.tipo === 'consignas' ? leccion.practica.consignas : [leccion.practica];
      for (const parte of partes.filter((x) => x?.tipo === 'cancion')) {
        if (!cancionesExistentes.has(parte.cancionId)) {
          errores.push(`${curso.nombre} / ${leccion.nombre}: la canción "${parte.cancionId}" no está en canciones_practica (¿corriste npm run seed:canciones?)`);
        }
      }
      const { rows } = await client.query('SELECT practica_valida($1::jsonb) AS ok', [leccion.practica ? JSON.stringify(leccion.practica) : null]);
      if (!rows[0].ok) {
        const pista = ['ritmo', 'consignas', 'notasAlAzar'].includes(leccion.practica?.tipo) ? ' (¿aplicaste las migraciones 001 y 008?)' : '';
        errores.push(`${curso.nombre} / ${leccion.nombre}: la BD rechaza la práctica${pista}`);
      }
    }
  }
  return { errores, total };
}

async function backup() {
  const cursos = (await client.query('SELECT * FROM cursos WHERE instrumento_id = $1', [GUITARRA])).rows;
  const ids = cursos.map((c) => c.id);
  const ejercicios = (await client.query('SELECT * FROM ejercicios WHERE curso_id = ANY($1)', [ids])).rows;
  const idsEj = ejercicios.map((e) => e.id);
  const datos = {
    fecha: new Date().toISOString(),
    cursos,
    ejercicios,
    curso_prerequisitos: (await client.query('SELECT * FROM curso_prerequisitos WHERE curso_id = ANY($1) OR prerequisito_id = ANY($1)', [ids])).rows,
    progreso_cursos: (await client.query('SELECT * FROM progreso_cursos WHERE curso_id = ANY($1)', [ids])).rows,
    progreso_ejercicios: (await client.query('SELECT * FROM progreso_ejercicios WHERE ejercicio_id = ANY($1)', [idsEj])).rows,
  };
  mkdirSync('backups', { recursive: true });
  const archivo = `backups/cursos-${datos.fecha.replace(/[:.]/g, '-')}.json`;
  writeFileSync(archivo, JSON.stringify(datos, null, 2));
  console.log(`Backup: ${archivo} (${cursos.length} cursos, ${ejercicios.length} ejercicios, ${datos.progreso_ejercicios.length} progresos de ejercicio, ${datos.progreso_cursos.length} de curso)`);
}

// Borra lecciones con su progreso
async function borrarEjercicios(ids) {
  if (!ids.length) return;
  await client.query('UPDATE progreso_cursos SET ultimo_ejercicio_id = NULL WHERE ultimo_ejercicio_id = ANY($1)', [ids]);
  await client.query('DELETE FROM progreso_ejercicios WHERE ejercicio_id = ANY($1)', [ids]);
  await client.query('DELETE FROM ejercicios WHERE id = ANY($1)', [ids]);
}

// Borra cursos con todo lo que depende de ellos
async function borrarCursos(ids) {
  if (!ids.length) return;
  const ejercicios = (await client.query('SELECT id FROM ejercicios WHERE curso_id = ANY($1)', [ids])).rows.map((r) => r.id);
  await client.query('DELETE FROM progreso_cursos WHERE curso_id = ANY($1)', [ids]);
  await borrarEjercicios(ejercicios);
  await client.query('DELETE FROM curso_prerequisitos WHERE curso_id = ANY($1) OR prerequisito_id = ANY($1)', [ids]);
  await client.query('DELETE FROM cursos WHERE id = ANY($1)', [ids]);
}

// Cada lección se busca en todos los cursos de guitarra, por su nombre o por alguno de sus
// `nombresAnteriores` (si se renombró, se movió de curso o reemplaza a otra): así se actualiza
// en su lugar y el progreso se conserva.
async function sincronizar() {
  if (desdeCero) {
    const viejos = (await client.query('SELECT id FROM cursos WHERE instrumento_id = $1', [GUITARRA])).rows.map((c) => c.id);
    await borrarCursos(viejos);
    console.log(`  Desde cero: se borraron ${viejos.length} cursos de guitarra con su progreso`);
  }
  // Primero los cursos, para poder mover lecciones a los nuevos
  for (const curso of CURSOS) {
    await client.query(
      `INSERT INTO cursos (id, nombre, descripcion, instrumento_id, nivel, orden, obligatorio) VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion, nivel = EXCLUDED.nivel, orden = EXCLUDED.orden`,
      [curso.id, curso.nombre, curso.descripcion, curso.instrumento_id, curso.nivel, curso.orden],
    );
  }

  const filas = (await client.query(
    'SELECT e.id, e.nombre, e.curso_id FROM ejercicios e JOIN cursos c ON c.id = e.curso_id WHERE c.instrumento_id = $1',
    [GUITARRA],
  )).rows;
  const porNombre = new Map();
  filas.forEach((r) => {
    if (!porNombre.has(r.nombre)) porNombre.set(r.nombre, r);
  });
  const usados = new Set();

  for (const curso of CURSOS) {
    let actualizadas = 0;
    let movidas = 0;
    let nuevas = 0;
    for (const [i, l] of curso.lecciones.entries()) {
      const valores = [l.nombre, l.descripcion, i + 1, l.xp, l.tipo, l.texto_teoria, l.texto_destacado, JSON.stringify(l.instrucciones || []), l.practica ? JSON.stringify(l.practica) : null, curso.id];
      const anteriores = l.nombresAnteriores ?? (l.nombreAnterior ? [l.nombreAnterior] : []);
      const existente = [l.nombre, ...anteriores].map((n) => porNombre.get(n)).find((r) => r && !usados.has(r.id));
      if (existente) {
        await client.query(
          `UPDATE ejercicios SET nombre = $1, descripcion = $2, orden = $3, xp_recompensa = $4, tipo = $5, texto_teoria = $6,
             texto_destacado = $7, instrucciones = $8::jsonb, practica = $9::jsonb, curso_id = $10 WHERE id = $11`,
          [...valores, existente.id],
        );
        usados.add(existente.id);
        if (existente.curso_id === curso.id) actualizadas++;
        else movidas++;
      } else {
        await client.query(
          `INSERT INTO ejercicios (nombre, descripcion, orden, xp_recompensa, tipo, texto_teoria, texto_destacado, instrucciones, practica, curso_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10)`,
          valores,
        );
        nuevas++;
      }
    }
    console.log(`  ${curso.orden}. ${curso.nombre}: ${curso.lecciones.length} lecciones (${actualizadas} actualizadas, ${movidas} movidas de otro curso, ${nuevas} nuevas)`);
  }

  // Lo que ya no está en el archivo: lecciones y, después, cursos
  const borradas = filas.filter((r) => !usados.has(r.id));
  await borrarEjercicios(borradas.map((r) => r.id));
  if (borradas.length) console.log(`  Lecciones borradas: ${borradas.map((r) => r.nombre).join(', ')}`);
  const sobran = (await client.query('SELECT id, nombre FROM cursos WHERE instrumento_id = $1 AND NOT (id = ANY($2))', [GUITARRA, CURSOS.map((c) => c.id)])).rows;
  await borrarCursos(sobran.map((c) => c.id));
  sobran.forEach((c) => console.log(`  Curso borrado: ${c.nombre}`));
}

// Inserta filas tal cual estaban (todas sus columnas)
async function insertarFilas(tabla, filas) {
  for (const fila of filas) {
    const columnas = Object.keys(fila);
    const valores = columnas.map((c) => (fila[c] !== null && typeof fila[c] === 'object' && !(fila[c] instanceof Date) ? JSON.stringify(fila[c]) : fila[c]));
    await client.query(`INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES (${columnas.map((_, i) => `$${i + 1}`).join(', ')})`, valores);
  }
}

async function main() {
  await client.connect();
  try {
    if (restaurar) {
      const datos = JSON.parse(readFileSync(restaurar, 'utf8'));
      await client.query('BEGIN');
      const actuales = (await client.query('SELECT id FROM cursos WHERE instrumento_id = $1', [GUITARRA])).rows.map((r) => r.id);
      await borrarCursos(actuales);
      for (const tabla of ['cursos', 'ejercicios', 'curso_prerequisitos', 'progreso_cursos', 'progreso_ejercicios']) await insertarFilas(tabla, datos[tabla]);
      await client.query('COMMIT');
      console.log(`Restaurado el backup del ${datos.fecha}: ${datos.cursos.length} cursos, ${datos.ejercicios.length} ejercicios.`);
      return;
    }

    if (simular) {
      await client.query('BEGIN');
      if (migracion) await client.query(readFileSync(new URL(`../migrations/${migracion}`, import.meta.url), 'utf8'));
    }

    const { errores, total } = await validar();
    if (errores.length) {
      if (simular) await client.query('ROLLBACK');
      console.error('Hay errores, no se cargó nada:\n- ' + errores.join('\n- '));
      process.exitCode = 1;
      return;
    }
    console.log(`Validación OK: ${CURSOS.length} cursos, ${total} lecciones.`);
    if (probar) return;

    if (simular) {
      await sincronizar();
      await client.query('ROLLBACK');
      console.log('Simulación: no se guardó nada.');
      return;
    }

    await backup();
    await client.query('BEGIN');
    await sincronizar();
    await client.query('COMMIT');
    console.log('Cursos actualizados.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error, la base quedó como estaba:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
