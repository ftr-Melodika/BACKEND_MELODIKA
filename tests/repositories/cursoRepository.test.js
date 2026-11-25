import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

console.error = () => {};
const { instalarPoolFalso } = await import('../_ayudas/poolFalso.js');
const pool = instalarPoolFalso();
let liberados = 0;
const conectarOriginal = pool.connect;
pool.connect = async () => { const c = await conectarOriginal(); c.release = () => { liberados++; }; return c; };

const { default: CursoRepository } = await import('../../src/repositories/cursoRepository.js');
const { default: Curso } = await import('../../src/entities/Curso.js');
const { default: Ejercicio } = await import('../../src/entities/Ejercicio.js');
const { MENSAJES_ERROR_DB: M } = await import('../../src/helpers/manejoErrores/mensajesErrorDB.js');

const repo = new CursoRepository();
const errorBD = (code = '08006') => Object.assign(new Error('boom'), { code });
const verbos = () => pool.llamadas.map(l => l.sql.trim().split(/\s/)[0]);

const filaCurso = () => ({
    id: 'c1', nombre: 'Intro', descripcion: 'd', instrumento_id: 'i1', camino_id: 'k1', nivel: 1, orden: 2, obligatorio: true,
});
const filaEjercicio = (extra = {}) => ({
    id: 'e1', curso_id: 'c1', titulo: 'Ej', descripcion: 'd', tipo: 'video', orden: 1, xp_recompensa: 20,
    youtube_id: 'yt', duracion_segundos: 60, cuerda: 1, traste_objetivo: 3, nota_esperada: 'C',
    dot_left: '10%', dot_bottom: '5%', texto_teoria: 't', texto_destacado: 'td', instrucciones: 'ins', practica: { a: 1 }, ...extra,
});

beforeEach(() => { pool.reiniciar(); liberados = 0; });

describe('CursoRepository.obtenerCursos', () => {
    test('mapea filas a entidades Curso', async () => {
        pool.responder(/FROM cursos/, { rows: [filaCurso()] });
        const r = await repo.obtenerCursos();
        assert.ok(r[0] instanceof Curso);
        assert.deepEqual({ ...r[0] }, {
            id: 'c1', nombre: 'Intro', descripcion: 'd', instrumentoId: 'i1', caminoId: 'k1', nivel: 1, orden: 2, obligatorio: true,
        });
        assert.match(pool.llamadas[0].sql, /ORDER BY orden ASC, nombre ASC/);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/FROM cursos/, errorBD());
        await assert.rejects(() => repo.obtenerCursos(), { message: M.OBTENER_CURSOS });
    });
});

describe('CursoRepository.obtenerCursoPorId', () => {
    test('devuelve Curso con $1 = id', async () => {
        pool.responder(/WHERE id = \$1/, { rows: [filaCurso()] });
        const r = await repo.obtenerCursoPorId('c1');
        assert.ok(r instanceof Curso);
        assert.deepEqual(pool.llamadas[0].params, ['c1']);
    });
    test('null si no existe', async () => {
        assert.equal(await repo.obtenerCursoPorId('zz'), null);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/FROM cursos/, errorBD());
        await assert.rejects(() => repo.obtenerCursoPorId('c1'), { message: M.OBTENER_CURSO_POR_ID });
    });
});

describe('CursoRepository.obtenerEjerciciosDeCurso', () => {
    test('mapea a entidades Ejercicio (nombre AS titulo) y consulta por curso_id', async () => {
        pool.responder(/FROM ejercicios/, { rows: [filaEjercicio()] });
        const r = await repo.obtenerEjerciciosDeCurso('c1');
        assert.ok(r[0] instanceof Ejercicio);
        assert.equal(r[0].titulo, 'Ej');
        assert.equal(r[0].cursoId, 'c1');
        assert.equal(r[0].xpRecompensa, 20);
        assert.equal(r[0].youtubeId, 'yt');
        assert.equal(r[0].duracionSegundos, 60);
        assert.equal(r[0].trasteObjetivo, 3);
        assert.equal(r[0].notaEsperada, 'C');
        assert.equal(r[0].dotLeft, '10%');
        assert.equal(r[0].dotBottom, '5%');
        assert.equal(r[0].textoTeoria, 't');
        assert.equal(r[0].textoDestacado, 'td');
        assert.deepEqual(r[0].practica, { a: 1 });
        assert.deepEqual(pool.llamadas[0].params, ['c1']);
        assert.match(pool.llamadas[0].sql, /nombre AS titulo/);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/FROM ejercicios/, errorBD());
        await assert.rejects(() => repo.obtenerEjerciciosDeCurso('c1'), { message: M.OBTENER_EJERCICIOS });
    });
});

describe('CursoRepository.obtenerTodosLosEjerciciosConCurso', () => {
    test('agrega cursoNombre a cada Ejercicio', async () => {
        pool.responder(/JOIN cursos c/, { rows: [filaEjercicio({ curso_nombre: 'Intro' })] });
        const r = await repo.obtenerTodosLosEjerciciosConCurso();
        assert.ok(r[0] instanceof Ejercicio);
        assert.equal(r[0].cursoNombre, 'Intro');
        assert.equal(r[0].titulo, 'Ej');
    });
    test('traduce el error de BD', async () => {
        pool.responder(/JOIN cursos c/, errorBD());
        await assert.rejects(() => repo.obtenerTodosLosEjerciciosConCurso(), { message: M.OBTENER_TODOS_EJERCICIOS });
    });
});

describe('CursoRepository consultas de progreso', () => {
    test('obtenerProgresoCursos devuelve las filas crudas con $1 = perfil', async () => {
        pool.responder(/FROM progreso_cursos/, { rows: [{ curso_id: 'c1' }] });
        assert.deepEqual(await repo.obtenerProgresoCursos('p1'), [{ curso_id: 'c1' }]);
        assert.deepEqual(pool.llamadas[0].params, ['p1']);
    });
    test('obtenerEjerciciosCompletados usa ($1 perfil, $2 curso)', async () => {
        pool.responder(/JOIN ejercicios/, { rows: [{ ejercicio_id: 'e1', omitida: false }] });
        assert.deepEqual(await repo.obtenerEjerciciosCompletados('p1', 'c1'), [{ ejercicio_id: 'e1', omitida: false }]);
        assert.deepEqual(pool.llamadas[0].params, ['p1', 'c1']);
    });
    test('obtenerTodosLosEjerciciosCompletados usa $1 = perfil', async () => {
        pool.responder(/FROM progreso_ejercicios/, { rows: [{ ejercicio_id: 'e1' }] });
        assert.deepEqual(await repo.obtenerTodosLosEjerciciosCompletados('p1'), [{ ejercicio_id: 'e1' }]);
        assert.deepEqual(pool.llamadas[0].params, ['p1']);
    });
    test('verificarCursoCompletado: true con fila, false sin fila, params ($1, $2)', async () => {
        assert.equal(await repo.verificarCursoCompletado('p1', 'c1'), false);
        pool.responder(/SELECT 1 FROM progreso_cursos/, { rows: [{ '?column?': 1 }] });
        assert.equal(await repo.verificarCursoCompletado('p1', 'c1'), true);
        assert.deepEqual(pool.llamadas[0].params, ['p1', 'c1']);
    });
    test('registrarCursoCompletado inserta y devuelve true', async () => {
        assert.equal(await repo.registrarCursoCompletado('p1', 'c1'), true);
        assert.match(pool.llamadas[0].sql, /INSERT INTO progreso_cursos/);
        assert.deepEqual(pool.llamadas[0].params, ['p1', 'c1']);
    });
    test('registrarOmision inserta omitida=true con ($1, $2) y no devuelve nada', async () => {
        assert.equal(await repo.registrarOmision('p1', 'e1'), undefined);
        assert.match(pool.llamadas[0].sql, /VALUES \(\$1, \$2, true, true\)/);
        assert.deepEqual(pool.llamadas[0].params, ['p1', 'e1']);
    });
    test('cada consulta traduce su error de BD', async () => {
        pool.responder(/progreso_cursos|progreso_ejercicios/, errorBD());
        await assert.rejects(() => repo.obtenerProgresoCursos('p'), { message: M.OBTENER_PROGRESO_CURSOS });
        await assert.rejects(() => repo.obtenerEjerciciosCompletados('p', 'c'), { message: M.OBTENER_EJERCICIOS_COMPLETADOS });
        await assert.rejects(() => repo.obtenerTodosLosEjerciciosCompletados('p'), { message: M.OBTENER_TODOS_EJERCICIOS_COMPLETADOS });
        await assert.rejects(() => repo.verificarCursoCompletado('p', 'c'), { message: M.VERIFICAR_CURSO_COMPLETADO });
        await assert.rejects(() => repo.registrarCursoCompletado('p', 'c'), { message: M.REGISTRAR_CURSO_COMPLETADO });
        await assert.rejects(() => repo.registrarOmision('p', 'e'), { message: M.REGISTRAR_LECCION_OMITIDA });
    });
    test('el código de Postgres (p. ej. 23505) se conserva en el error traducido', async () => {
        pool.responder(/INSERT INTO progreso_ejercicios/, errorBD('23505'));
        await assert.rejects(() => repo.registrarOmision('p', 'e'), e => e.code === '23505');
    });
});

describe('CursoRepository.registrarProgresoYSumarXP', () => {
    test('transacción: BEGIN, INSERT progreso, UPDATE xp, COMMIT; devuelve el xp total', async () => {
        pool.responder(/INSERT INTO progreso_ejercicios/, { rows: [{ perfil_id: 'p1' }], rowCount: 1 });
        pool.responder(/UPDATE perfiles/, { rows: [{ xp: 150 }] });
        assert.equal(await repo.registrarProgresoYSumarXP('p1', 'e1', 50), 150);
        assert.deepEqual(verbos(), ['BEGIN', 'INSERT', 'UPDATE', 'COMMIT']);
        assert.deepEqual(pool.llamadas[1].params, ['p1', 'e1']);
        assert.deepEqual(pool.llamadas[2].params, [50, 'p1']);
        assert.equal(liberados, 1);
    });
    test('si el UPDATE no devuelve fila, devuelve el xp ganado', async () => {
        pool.responder(/INSERT INTO progreso_ejercicios/, { rows: [{ perfil_id: 'p1' }], rowCount: 1 });
        assert.equal(await repo.registrarProgresoYSumarXP('p1', 'e1', 50), 50);
    });
    test('si otro pedido ya guardó la lección: ROLLBACK, no suma XP y devuelve null', async () => {
        assert.equal(await repo.registrarProgresoYSumarXP('p1', 'e1', 50), null);
        assert.deepEqual(verbos(), ['BEGIN', 'INSERT', 'ROLLBACK']);
        assert.equal(liberados, 1);
    });
    test('error (p. ej. ya completado): ROLLBACK, libera y lanza el error traducido', async () => {
        pool.responder(/INSERT INTO progreso_ejercicios/, errorBD('23505'));
        await assert.rejects(() => repo.registrarProgresoYSumarXP('p1', 'e1', 5), e => {
            assert.equal(e.message, M.REGISTRAR_PROGRESO_XP);
            assert.equal(e.code, '23505');
            return true;
        });
        assert.deepEqual(verbos(), ['BEGIN', 'INSERT', 'ROLLBACK']);
        assert.equal(liberados, 1);
    });
});

describe('CursoRepository.recuperarXPDeOmision', () => {
    test('suma el xp y devuelve el total tras COMMIT', async () => {
        pool.responder(/SET omitida = false/, { rows: [{ id: 'x' }] });
        pool.responder(/UPDATE perfiles/, { rows: [{ xp: 80 }] });
        assert.equal(await repo.recuperarXPDeOmision('p1', 'e1', 30), 80);
        assert.deepEqual(verbos(), ['BEGIN', 'UPDATE', 'UPDATE', 'COMMIT']);
        assert.deepEqual(pool.llamadas[1].params, ['p1', 'e1']);
        assert.deepEqual(pool.llamadas[2].params, [30, 'p1']);
        assert.equal(liberados, 1);
    });
    test('si ya no estaba omitida: ROLLBACK y null, sin sumar XP', async () => {
        assert.equal(await repo.recuperarXPDeOmision('p1', 'e1', 30), null);
        assert.deepEqual(verbos(), ['BEGIN', 'UPDATE', 'ROLLBACK']);
        assert.equal(liberados, 1);
    });
    test('si el UPDATE de xp no devuelve fila, devuelve el xp ganado', async () => {
        pool.responder(/SET omitida = false/, { rows: [{ id: 'x' }] });
        assert.equal(await repo.recuperarXPDeOmision('p1', 'e1', 30), 30);
    });
    test('error: ROLLBACK, libera y lanza el error traducido', async () => {
        pool.responder(/SET omitida = false/, { rows: [{ id: 'x' }] });
        pool.responder(/UPDATE perfiles/, errorBD());
        await assert.rejects(() => repo.recuperarXPDeOmision('p1', 'e1', 30), { message: M.RECUPERAR_XP_OMITIDA });
        assert.equal(verbos().at(-1), 'ROLLBACK');
        assert.ok(!verbos().includes('COMMIT'));
        assert.equal(liberados, 1);
    });
});
