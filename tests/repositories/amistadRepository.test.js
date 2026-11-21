import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

console.error = () => {};
const { instalarPoolFalso } = await import('../_ayudas/poolFalso.js');
const pool = instalarPoolFalso();
let liberados = 0;
const conectarOriginal = pool.connect;
pool.connect = async () => { const c = await conectarOriginal(); c.release = () => { liberados++; }; return c; };

const { default: AmistadRepository } = await import('../../src/repositories/amistadRepository.js');
const { MENSAJES_ERROR_DB } = await import('../../src/helpers/manejoErrores/mensajesErrorDB.js');

const repo = new AmistadRepository();
const errorBD = (code = '08006', extra = {}) => Object.assign(new Error('boom'), { code, ...extra });
const verbos = () => pool.llamadas.map(l => l.sql.trim().split(/\s/)[0]);
const MSG = MENSAJES_ERROR_DB.GESTIONAR_AMISTADES;

beforeEach(() => { pool.reiniciar(); liberados = 0; });

describe('AmistadRepository.obtenerPorId', () => {
    test('devuelve la fila y pasa el id como $1', async () => {
        const f = { id: 'a1', perfil_1_id: 'p1', perfil_2_id: 'p2', estado: 'pendiente' };
        pool.responder(/FROM amistades WHERE id = \$1/, { rows: [f] });
        assert.deepEqual(await repo.obtenerPorId('a1'), f);
        assert.deepEqual(pool.llamadas[0].params, ['a1']);
    });
    test('null si no existe', async () => {
        assert.equal(await repo.obtenerPorId('a1'), null);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/FROM amistades/, errorBD());
        await assert.rejects(() => repo.obtenerPorId('a1'), { message: MSG });
    });
});

describe('AmistadRepository.obtenerEntre', () => {
    test('busca el par en ambos sentidos con ($1, $2)', async () => {
        const f = { id: 'a1', estado: 'aceptada' };
        pool.responder(/LIMIT 1/, { rows: [f] });
        assert.deepEqual(await repo.obtenerEntre('p1', 'p2'), f);
        assert.deepEqual(pool.llamadas[0].params, ['p1', 'p2']);
        assert.match(pool.llamadas[0].sql, /perfil_1_id = \$1 AND perfil_2_id = \$2.*perfil_1_id = \$2 AND perfil_2_id = \$1/s);
    });
    test('null si no hay relación', async () => {
        assert.equal(await repo.obtenerEntre('p1', 'p2'), null);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/LIMIT 1/, errorBD());
        await assert.rejects(() => repo.obtenerEntre('p1', 'p2'), { message: MSG });
    });
});

describe('AmistadRepository.enviarSolicitud', () => {
    test('sin relación previa: BEGIN, SELECT FOR UPDATE, INSERT, COMMIT y libera', async () => {
        pool.responder(/INSERT INTO amistades/, { rows: [{ id: 'a1', estado: 'pendiente' }] });
        const r = await repo.enviarSolicitud('p1', 'p2');
        assert.deepEqual(r, { amistad: { id: 'a1', estado: 'pendiente' } });
        assert.deepEqual(verbos(), ['BEGIN', 'SELECT', 'INSERT', 'COMMIT']);
        assert.match(pool.llamadas[1].sql, /FOR UPDATE/);
        assert.deepEqual(pool.llamadas[1].params, ['p1', 'p2']);
        assert.deepEqual(pool.llamadas[2].params, ['p1', 'p2']);
        assert.equal(liberados, 1);
    });
    test('par ya ocupado (pendiente/aceptada): ROLLBACK y devuelve { existente }', async () => {
        const previa = { id: 'a9', estado: 'aceptada' };
        pool.responder(/FOR UPDATE/, { rows: [previa] });
        assert.deepEqual(await repo.enviarSolicitud('p1', 'p2'), { existente: previa });
        assert.deepEqual(verbos(), ['BEGIN', 'SELECT', 'ROLLBACK']);
        assert.equal(liberados, 1);
    });
    test('solicitud rechazada se reenvía con UPDATE sobre la misma fila', async () => {
        pool.responder(/FOR UPDATE/, { rows: [{ id: 'a9', estado: 'rechazada' }] });
        pool.responder(/UPDATE amistades/, { rows: [{ id: 'a9', estado: 'pendiente' }] });
        const r = await repo.enviarSolicitud('p1', 'p2');
        assert.deepEqual(r, { amistad: { id: 'a9', estado: 'pendiente' } });
        assert.deepEqual(verbos(), ['BEGIN', 'SELECT', 'UPDATE', 'COMMIT']);
        assert.deepEqual(pool.llamadas[2].params, ['p1', 'p2', 'a9']);
    });
    test('violación de unicidad (carrera): ROLLBACK y { existente: null }, sin lanzar', async () => {
        pool.responder(/INSERT INTO amistades/, errorBD('23505'));
        assert.deepEqual(await repo.enviarSolicitud('p1', 'p2'), { existente: null });
        assert.equal(verbos().at(-1), 'ROLLBACK');
        assert.equal(liberados, 1);
    });
    test('otro error: ROLLBACK, libera y lanza el error traducido', async () => {
        pool.responder(/INSERT INTO amistades/, errorBD('08006'));
        await assert.rejects(() => repo.enviarSolicitud('p1', 'p2'), { message: MSG });
        assert.equal(verbos().at(-1), 'ROLLBACK');
        assert.ok(!verbos().includes('COMMIT'));
        assert.equal(liberados, 1);
    });
});

describe('AmistadRepository.responderSolicitud', () => {
    test('actualiza con ($1 id, $2 destinatario, $3 estado) y devuelve la fila', async () => {
        pool.responder(/UPDATE amistades/, { rows: [{ id: 'a1', estado: 'aceptada' }] });
        assert.deepEqual(await repo.responderSolicitud('a1', 'p2', 'aceptada'), { id: 'a1', estado: 'aceptada' });
        assert.deepEqual(pool.llamadas[0].params, ['a1', 'p2', 'aceptada']);
        assert.match(pool.llamadas[0].sql, /estado = 'pendiente'/);
    });
    test('null si no era el destinatario o ya no estaba pendiente', async () => {
        assert.equal(await repo.responderSolicitud('a1', 'p2', 'aceptada'), null);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/UPDATE amistades/, errorBD());
        await assert.rejects(() => repo.responderSolicitud('a1', 'p2', 'x'), { message: MSG });
    });
});

describe('AmistadRepository.eliminar', () => {
    test('true si borró alguna fila, con ($1 amistad, $2 perfil)', async () => {
        pool.responder(/DELETE FROM amistades/, { rows: [{ id: 'a1' }], rowCount: 1 });
        assert.equal(await repo.eliminar('a1', 'p1'), true);
        assert.deepEqual(pool.llamadas[0].params, ['a1', 'p1']);
    });
    test('false si no borró nada', async () => {
        assert.equal(await repo.eliminar('a1', 'p1'), false);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/DELETE FROM amistades/, errorBD());
        await assert.rejects(() => repo.eliminar('a1', 'p1'), { message: MSG });
    });
});

describe('AmistadRepository listados', () => {
    test('listarSolicitudesPendientes devuelve las filas y usa solo $1', async () => {
        const rows = [{ amistad_id: 'a1', recibida: true, id: 'p2', nombre: 'B' }];
        pool.responder(/a\.estado = 'pendiente'|AND a\.estado = 'pendiente'/, { rows });
        assert.deepEqual(await repo.listarSolicitudesPendientes('p1'), rows);
        assert.deepEqual(pool.llamadas[0].params, ['p1']);
    });
    test('listarAmigos devuelve las filas ordenadas por nombre (SQL) con $1', async () => {
        const rows = [{ amistad_id: 'a1', id: 'p2', nombre: 'B' }];
        pool.responder(/estado = 'aceptada'/, { rows });
        assert.deepEqual(await repo.listarAmigos('p1'), rows);
        assert.match(pool.llamadas[0].sql, /ORDER BY p\.nombre ASC/);
        assert.deepEqual(pool.llamadas[0].params, ['p1']);
    });
    test('filtrarAmigos devuelve solo los ids, con ($1 perfil, $2 candidatos)', async () => {
        pool.responder(/ANY\(\$2::uuid\[\]\)/, { rows: [{ id: 'p2' }, { id: 'p3' }] });
        assert.deepEqual(await repo.filtrarAmigos('p1', ['p2', 'p3', 'p4']), ['p2', 'p3']);
        assert.deepEqual(pool.llamadas[0].params, ['p1', ['p2', 'p3', 'p4']]);
    });
    test('sin filas devuelven arreglos vacíos', async () => {
        assert.deepEqual(await repo.listarSolicitudesPendientes('p1'), []);
        assert.deepEqual(await repo.listarAmigos('p1'), []);
        assert.deepEqual(await repo.filtrarAmigos('p1', []), []);
    });
    test('los tres traducen el error de BD', async () => {
        pool.responder(/FROM amistades/, errorBD());
        await assert.rejects(() => repo.listarSolicitudesPendientes('p1'), { message: MSG });
        await assert.rejects(() => repo.listarAmigos('p1'), { message: MSG });
        await assert.rejects(() => repo.filtrarAmigos('p1', []), { message: MSG });
    });
});

describe('AmistadRepository.contarAmigos', () => {
    test('devuelve el total de la primera fila', async () => {
        pool.responder(/COUNT\(\*\)/, { rows: [{ total: 7 }] });
        assert.equal(await repo.contarAmigos('p1'), 7);
        assert.deepEqual(pool.llamadas[0].params, ['p1']);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/COUNT\(\*\)/, errorBD());
        await assert.rejects(() => repo.contarAmigos('p1'), { message: MSG });
    });
});
