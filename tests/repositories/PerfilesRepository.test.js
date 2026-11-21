import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

console.error = () => {}; // manejarErrorDB imprime el error real; acá lo silenciamos
const { instalarPoolFalso } = await import('../_ayudas/poolFalso.js');
const pool = instalarPoolFalso();
let liberados = 0;
const conectarOriginal = pool.connect;
pool.connect = async () => { const c = await conectarOriginal(); c.release = () => { liberados++; }; return c; };

const { default: PerfilRepository, DIAS_MAXIMOS_SIN_PRACTICAR } = await import('../../src/repositories/PerfilesRepository.js');
const { default: Perfil } = await import('../../src/entities/Perfiles.js');
const { MENSAJES_ERROR_DB } = await import('../../src/helpers/manejoErrores/mensajesErrorDB.js');

const repo = new PerfilRepository();
const errorBD = (code = '08006') => Object.assign(new Error('boom'), { code });
const sqls = () => pool.llamadas.map(l => l.sql.trim());
const verbos = () => sqls().map(s => s.split(/\s/)[0]);

const fila = (extra = {}) => ({
    id: 'p1', cuenta_id: 'c1', nombre: 'Ana', username: 'ana', avatar_url: 'a.png', pais: 'AR',
    fecha_nacimiento: '2000-01-01', genero: 'F', xp: 10, racha: 3, instrumento_actual_id: 'i1',
    activo: true, es_publico: true, es_zurdo: true, ...extra,
});

beforeEach(() => { pool.reiniciar(); liberados = 0; });

describe('PerfilRepository.reiniciarRachasVencidas', () => {
    test('pasa perfilId y cuentaId como $1 y $2 y es parametrizado', async () => {
        await repo.reiniciarRachasVencidas({ perfilId: 'p1', cuentaId: 'c1' });
        assert.deepEqual(pool.llamadas[0].params, ['p1', 'c1']);
        assert.match(pool.llamadas[0].sql, /SET racha = 0/);
        assert.doesNotMatch(pool.llamadas[0].sql, /'p1'|'c1'/);
        assert.match(pool.llamadas[0].sql, new RegExp(`> ${DIAS_MAXIMOS_SIN_PRACTICAR}`));
    });
    test('sin argumentos manda null en ambos filtros', async () => {
        await repo.reiniciarRachasVencidas();
        assert.deepEqual(pool.llamadas[0].params, [null, null]);
    });
    test('ante error de BD lanza el mensaje de ACTUALIZAR_RACHA conservando el code', async () => {
        pool.responder(/SET racha = 0/, errorBD('XX001'));
        await assert.rejects(() => repo.reiniciarRachasVencidas(), e => {
            assert.equal(e.message, MENSAJES_ERROR_DB.ACTUALIZAR_RACHA);
            assert.equal(e.code, 'XX001');
            return true;
        });
    });
});

describe('PerfilRepository.obtenerPorCuentaId', () => {
    test('reinicia rachas vencidas y mapea filas a entidades Perfil', async () => {
        pool.responder(/SELECT \* FROM perfiles WHERE cuenta_id/, { rows: [fila(), fila({ id: 'p2', es_publico: null, es_zurdo: null })] });
        const r = await repo.obtenerPorCuentaId('c1');
        assert.equal(r.length, 2);
        assert.ok(r[0] instanceof Perfil);
        assert.equal(r[0].cuentaId, 'c1');
        assert.equal(r[0].avatarUrl, 'a.png');
        assert.equal(r[0].instrumentoActualId, 'i1');
        assert.equal(r[0].esPublico, true);
        assert.equal(r[1].esPublico, false);
        assert.equal(r[1].esZurdo, false);
        assert.match(sqls()[0], /SET racha = 0/);
        assert.deepEqual(pool.llamadas[0].params, [null, 'c1']);
        assert.deepEqual(pool.llamadas[1].params, ['c1']);
    });
    test('sin filas devuelve arreglo vacío', async () => {
        assert.deepEqual(await repo.obtenerPorCuentaId('c1'), []);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/SELECT \* FROM perfiles/, errorBD());
        await assert.rejects(() => repo.obtenerPorCuentaId('c1'), { message: MENSAJES_ERROR_DB.BUSCAR_PERFILES });
    });
});

describe('PerfilRepository.crearPerfil', () => {
    test('inserta con parámetros en orden y devuelve el Perfil', async () => {
        pool.responder(/INSERT INTO perfiles/, { rows: [fila()] });
        const r = await repo.crearPerfil('c1', {
            nombre: 'Ana', username: 'ana', avatarUrl: 'a.png', pais: 'AR', fecha_nacimiento: '2000-01-01', genero: 'F', esZurdo: true,
        });
        assert.ok(r instanceof Perfil);
        assert.deepEqual(pool.llamadas[0].params, ['c1', 'Ana', 'ana', 'a.png', 'AR', '2000-01-01', 'F', true]);
        assert.match(pool.llamadas[0].sql, /VALUES \(\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8\)/);
    });
    test('los opcionales ausentes van como null y esZurdo no booleano true va false', async () => {
        pool.responder(/INSERT INTO perfiles/, { rows: [fila()] });
        await repo.crearPerfil('c1', { nombre: 'Ana', username: 'ana', pais: 'AR', esZurdo: 'si' });
        assert.deepEqual(pool.llamadas[0].params, ['c1', 'Ana', 'ana', null, 'AR', null, null, false]);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/INSERT INTO perfiles/, errorBD('23505'));
        await assert.rejects(() => repo.crearPerfil('c1', { nombre: 'a' }), e => e.message === MENSAJES_ERROR_DB.CREAR_PERFIL && e.code === '23505');
    });
});

describe('PerfilRepository.actualizarRachaDiaria', () => {
    const prepararInfo = (racha, dias_pasados) => pool.responder(/FOR UPDATE/, { rows: [{ racha, dias_pasados }] });

    test('perfil inexistente: BEGIN, ROLLBACK, devuelve undefined y libera el cliente', async () => {
        const r = await repo.actualizarRachaDiaria('x');
        assert.equal(r, undefined);
        assert.deepEqual(verbos(), ['BEGIN', 'SELECT', 'ROLLBACK']);
        assert.equal(liberados, 1);
    });
    test('ya sumó hoy (dias_pasados 0): COMMIT sin modificar nada', async () => {
        prepararInfo(4, 0);
        const r = await repo.actualizarRachaDiaria('p1');
        assert.deepEqual(r, { racha: 4, dias_pasados: 0 });
        assert.deepEqual(verbos(), ['BEGIN', 'SELECT', 'COMMIT']);
        assert.equal(liberados, 1);
    });
    test('ya sumó hoy con racha null devuelve 0', async () => {
        prepararInfo(null, 0);
        assert.deepEqual(await repo.actualizarRachaDiaria('p1'), { racha: 0, dias_pasados: 0 });
    });
    test('practicó ayer: suma 1, actualiza, registra evento y hace COMMIT', async () => {
        prepararInfo(4, 1);
        const r = await repo.actualizarRachaDiaria('p1');
        assert.deepEqual(r, { racha: 5, dias_pasados: 1 });
        assert.deepEqual(verbos(), ['BEGIN', 'SELECT', 'UPDATE', 'INSERT', 'COMMIT']);
        assert.deepEqual(pool.llamadas[2].params, [5, 'p1']);
        assert.deepEqual(pool.llamadas[3].params, ['p1', JSON.stringify({ racha: 5 })]);
        assert.equal(liberados, 1);
    });
    test('racha null practicando ayer arranca en 1', async () => {
        prepararInfo(null, 1);
        assert.equal((await repo.actualizarRachaDiaria('p1')).racha, 1);
    });
    test('pasaron 2 o más días: la racha vuelve a 1', async () => {
        prepararInfo(9, 2);
        assert.equal((await repo.actualizarRachaDiaria('p1')).racha, 1);
        assert.deepEqual(pool.llamadas[2].params, [1, 'p1']);
    });
    test('nunca practicó (999): racha 1', async () => {
        prepararInfo(0, 999);
        assert.equal((await repo.actualizarRachaDiaria('p1')).racha, 1);
    });
    test('error en el medio: ROLLBACK, libera el cliente y lanza el error traducido', async () => {
        prepararInfo(2, 1);
        pool.responder(/INSERT INTO eventos/, errorBD());
        await assert.rejects(() => repo.actualizarRachaDiaria('p1'), { message: MENSAJES_ERROR_DB.ACTUALIZAR_RACHA });
        assert.equal(verbos().at(-1), 'ROLLBACK');
        assert.ok(!verbos().includes('COMMIT'));
        assert.equal(liberados, 1);
    });
});

describe('PerfilRepository.eliminarPerfil', () => {
    test('true cuando alguna fila se actualizó, con parámetros (perfilId, cuentaId)', async () => {
        pool.responder(/UPDATE perfiles/, { rows: [{ id: 'p1' }], rowCount: 1 });
        assert.equal(await repo.eliminarPerfil('p1', 'c1'), true);
        assert.deepEqual(pool.llamadas[0].params, ['p1', 'c1']);
        assert.match(pool.llamadas[0].sql, /SET activo = false/);
    });
    test('false cuando no había nada que borrar', async () => {
        assert.equal(await repo.eliminarPerfil('p1', 'c1'), false);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/UPDATE perfiles/, errorBD());
        await assert.rejects(() => repo.eliminarPerfil('p1', 'c1'), { message: MENSAJES_ERROR_DB.ELIMINAR_PERFIL });
    });
});

describe('PerfilRepository.actualizarPerfil', () => {
    const base = { nombre: 'N', avatarUrl: 'u', pais: 'AR', fecha_nacimiento: '2000-01-01', genero: 'M' };
    test('sin privacidad ni zurdo: 7 parámetros y SQL sin es_publico/es_zurdo', async () => {
        pool.responder(/UPDATE perfiles/, { rows: [fila()] });
        const r = await repo.actualizarPerfil('p1', 'c1', base);
        assert.ok(r instanceof Perfil);
        assert.deepEqual(pool.llamadas[0].params, ['N', 'u', 'AR', '2000-01-01', 'M', 'p1', 'c1']);
        assert.doesNotMatch(pool.llamadas[0].sql, /es_publico|es_zurdo/);
    });
    test('con esPublico=false lo manda como $8 (false es válido)', async () => {
        pool.responder(/UPDATE perfiles/, { rows: [fila()] });
        await repo.actualizarPerfil('p1', 'c1', { ...base, esPublico: false });
        assert.match(pool.llamadas[0].sql, /es_publico = \$8,/);
        assert.equal(pool.llamadas[0].params[7], false);
        assert.equal(pool.llamadas[0].params.length, 8);
    });
    test('solo esZurdo usa la posición $8', async () => {
        pool.responder(/UPDATE perfiles/, { rows: [fila()] });
        await repo.actualizarPerfil('p1', 'c1', { ...base, esZurdo: true });
        assert.match(pool.llamadas[0].sql, /es_zurdo = \$8,/);
        assert.equal(pool.llamadas[0].params[7], true);
    });
    test('esPublico y esZurdo juntos usan $8 y $9', async () => {
        pool.responder(/UPDATE perfiles/, { rows: [fila()] });
        await repo.actualizarPerfil('p1', 'c1', { ...base, esPublico: true, esZurdo: false });
        assert.match(pool.llamadas[0].sql, /es_publico = \$8,/);
        assert.match(pool.llamadas[0].sql, /es_zurdo = \$9,/);
        assert.deepEqual(pool.llamadas[0].params.slice(7), [true, false]);
    });
    test('campos vacíos van como null (COALESCE conserva el valor)', async () => {
        pool.responder(/UPDATE perfiles/, { rows: [fila()] });
        await repo.actualizarPerfil('p1', 'c1', {});
        assert.deepEqual(pool.llamadas[0].params, [null, null, null, null, null, 'p1', 'c1']);
    });
    test('devuelve null si no es de esa cuenta / no existe', async () => {
        assert.equal(await repo.actualizarPerfil('p1', 'c1', base), null);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/UPDATE perfiles/, errorBD());
        await assert.rejects(() => repo.actualizarPerfil('p1', 'c1', base), { message: MENSAJES_ERROR_DB.ACTUALIZAR_PERFIL });
    });
});

describe('PerfilRepository.obtenerPorId', () => {
    test('reinicia racha del perfil y devuelve la entidad', async () => {
        pool.responder(/SELECT \* FROM perfiles WHERE id/, { rows: [fila()] });
        const r = await repo.obtenerPorId('p1');
        assert.ok(r instanceof Perfil);
        assert.equal(r.username, 'ana');
        assert.deepEqual(pool.llamadas[0].params, ['p1', null]);
        assert.deepEqual(pool.llamadas[1].params, ['p1']);
    });
    test('null si no existe', async () => {
        assert.equal(await repo.obtenerPorId('zz'), null);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/SELECT \* FROM perfiles WHERE id/, errorBD());
        await assert.rejects(() => repo.obtenerPorId('p1'), { message: MENSAJES_ERROR_DB.OBTENER_PERFIL_POR_ID });
    });
});

describe('PerfilRepository.obtenerActivoPorUsername', () => {
    test('devuelve solo datos públicos de la fila y consulta parametrizada', async () => {
        const f = { id: 'p1', nombre: 'Ana', username: 'ana', avatar_url: 'a.png' };
        pool.responder(/lower\(username\)/, { rows: [f] });
        assert.deepEqual(await repo.obtenerActivoPorUsername('ANA'), f);
        assert.deepEqual(pool.llamadas[0].params, ['ANA']);
        assert.doesNotMatch(pool.llamadas[0].sql, /ANA/);
    });
    test('null si no hay coincidencias', async () => {
        assert.equal(await repo.obtenerActivoPorUsername('nadie'), null);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/lower\(username\)/, errorBD());
        await assert.rejects(() => repo.obtenerActivoPorUsername('a'), { message: MENSAJES_ERROR_DB.BUSCAR_PERFILES });
    });
});
