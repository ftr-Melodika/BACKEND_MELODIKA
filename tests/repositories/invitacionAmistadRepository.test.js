import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

console.error = () => {};
const { instalarPoolFalso } = await import('../_ayudas/poolFalso.js');
const pool = instalarPoolFalso();
let liberados = 0;
const conectarOriginal = pool.connect;
pool.connect = async () => { const c = await conectarOriginal(); c.release = () => { liberados++; }; return c; };

const { default: InvitacionAmistadRepository } = await import('../../src/repositories/invitacionAmistadRepository.js');
const { MENSAJES_ERROR_DB } = await import('../../src/helpers/manejoErrores/mensajesErrorDB.js');

const repo = new InvitacionAmistadRepository();
const errorBD = (code = '08006') => Object.assign(new Error('boom'), { code });
const verbos = () => pool.llamadas.map(l => l.sql.trim().split(/\s/)[0]);
const MSG = MENSAJES_ERROR_DB.GESTIONAR_INVITACIONES;

beforeEach(() => { pool.reiniciar(); liberados = 0; });

describe('InvitacionAmistadRepository.obtenerTokenActivo', () => {
    test('devuelve el token y consulta con $1', async () => {
        pool.responder(/FROM invitaciones_amistad/, { rows: [{ token: 'abc' }] });
        assert.equal(await repo.obtenerTokenActivo('p1'), 'abc');
        assert.deepEqual(pool.llamadas[0].params, ['p1']);
    });
    test('null si no hay token activo', async () => {
        assert.equal(await repo.obtenerTokenActivo('p1'), null);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/invitaciones_amistad/, errorBD());
        await assert.rejects(() => repo.obtenerTokenActivo('p1'), { message: MSG });
    });
});

describe('InvitacionAmistadRepository.crear', () => {
    test('inserta con ($1 perfil, $2 token) y devuelve el token', async () => {
        pool.responder(/INSERT INTO invitaciones_amistad/, { rows: [{ token: 'tk' }] });
        assert.equal(await repo.crear('p1', 'tk'), 'tk');
        assert.deepEqual(pool.llamadas[0].params, ['p1', 'tk']);
        assert.match(pool.llamadas[0].sql, /ON CONFLICT \(perfil_id\) WHERE activo DO NOTHING/);
    });
    test('null si ya había uno activo (el INSERT no devolvió filas)', async () => {
        assert.equal(await repo.crear('p1', 'tk'), null);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/INSERT/, errorBD());
        await assert.rejects(() => repo.crear('p1', 'tk'), { message: MSG });
    });
});

describe('InvitacionAmistadRepository.reemplazar', () => {
    test('transacción: BEGIN, desactiva el activo, inserta el nuevo, COMMIT y libera', async () => {
        pool.responder(/INSERT INTO invitaciones_amistad/, { rows: [{ token: 'nuevo' }] });
        assert.equal(await repo.reemplazar('p1', 'nuevo'), 'nuevo');
        assert.deepEqual(verbos(), ['BEGIN', 'UPDATE', 'INSERT', 'COMMIT']);
        assert.match(pool.llamadas[1].sql, /SET activo = false/);
        assert.deepEqual(pool.llamadas[1].params, ['p1']);
        assert.deepEqual(pool.llamadas[2].params, ['p1', 'nuevo']);
        assert.equal(liberados, 1);
    });
    test('null (con COMMIT) si una regeneración simultánea ganó', async () => {
        assert.equal(await repo.reemplazar('p1', 'nuevo'), null);
        assert.equal(verbos().at(-1), 'COMMIT');
        assert.equal(liberados, 1);
    });
    test('error: ROLLBACK, libera y lanza el error traducido', async () => {
        pool.responder(/INSERT INTO invitaciones_amistad/, errorBD());
        await assert.rejects(() => repo.reemplazar('p1', 'n'), { message: MSG });
        assert.equal(verbos().at(-1), 'ROLLBACK');
        assert.ok(!verbos().includes('COMMIT'));
        assert.equal(liberados, 1);
    });
});

describe('InvitacionAmistadRepository.obtenerPerfilPorToken', () => {
    test('devuelve el perfil dueño con $1 = token', async () => {
        const f = { id: 'p1', nombre: 'Ana', username: 'ana', avatar_url: null };
        pool.responder(/JOIN perfiles/, { rows: [f] });
        assert.deepEqual(await repo.obtenerPerfilPorToken('tk'), f);
        assert.deepEqual(pool.llamadas[0].params, ['tk']);
        assert.match(pool.llamadas[0].sql, /i\.activo = true AND p\.activo = true/);
    });
    test('null si el token no existe o no está activo', async () => {
        assert.equal(await repo.obtenerPerfilPorToken('x'), null);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/JOIN perfiles/, errorBD());
        await assert.rejects(() => repo.obtenerPerfilPorToken('x'), { message: MSG });
    });
});
