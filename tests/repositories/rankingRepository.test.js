import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

console.error = () => {};
const { instalarPoolFalso } = await import('../_ayudas/poolFalso.js');
const pool = instalarPoolFalso();
let liberados = 0;
const conectarOriginal = pool.connect;
pool.connect = async () => { const c = await conectarOriginal(); c.release = () => { liberados++; }; return c; };

const { default: RankingRepository } = await import('../../src/repositories/rankingRepository.js');
const { MENSAJES_ERROR_DB } = await import('../../src/helpers/manejoErrores/mensajesErrorDB.js');

const repo = new RankingRepository();
const errorBD = (code = '08006') => Object.assign(new Error('boom'), { code });
const verbos = () => pool.llamadas.map(l => l.sql.trim().split(/\s/)[0]);
const MSG = MENSAJES_ERROR_DB.GESTIONAR_RANKING_GRUPO;

beforeEach(() => { pool.reiniciar(); liberados = 0; });

describe('RankingRepository.listarDePerfil', () => {
    test('devuelve las filas y pasa el perfil como $1', async () => {
        const rows = [{ grupo_id: 'g1', grupo_nombre: 'G', total_participantes: 3, mi_posicion: 2 }];
        pool.responder(/WITH posiciones/, { rows });
        assert.deepEqual(await repo.listarDePerfil('p1'), rows);
        assert.deepEqual(pool.llamadas[0].params, ['p1']);
    });
    test('el SQL solo cuenta perfiles activos y desempata por xp, racha y antigüedad', async () => {
        await repo.listarDePerfil('p1');
        assert.match(pool.llamadas[0].sql, /p\.activo = true/);
        assert.match(pool.llamadas[0].sql, /ORDER BY COALESCE\(p\.xp, 0\) DESC, COALESCE\(p\.racha, 0\) DESC, p\.created_at ASC/);
    });
    test('sin filas devuelve []', async () => {
        assert.deepEqual(await repo.listarDePerfil('p1'), []);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/WITH posiciones/, errorBD());
        await assert.rejects(() => repo.listarDePerfil('p1'), { message: MSG });
    });
});

describe('RankingRepository.existe', () => {
    test('true si hay fila, con $1 = grupo', async () => {
        pool.responder(/FROM grupo_rankings/, { rows: [{ '?column?': 1 }] });
        assert.equal(await repo.existe('g1'), true);
        assert.deepEqual(pool.llamadas[0].params, ['g1']);
    });
    test('false si no hay fila', async () => {
        assert.equal(await repo.existe('g1'), false);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/grupo_rankings/, errorBD());
        await assert.rejects(() => repo.existe('g1'), { message: MSG });
    });
});

describe('RankingRepository.listarParticipantes', () => {
    test('devuelve las filas ordenadas por posición con $1 = grupo', async () => {
        const rows = [{ id: 'p1', username: 'a', avatar_url: null, xp: 10, racha: 1, posicion: 1 }];
        pool.responder(/WITH posiciones/, { rows });
        assert.deepEqual(await repo.listarParticipantes('g1'), rows);
        assert.deepEqual(pool.llamadas[0].params, ['g1']);
        assert.match(pool.llamadas[0].sql, /ORDER BY posicion ASC/);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/WITH posiciones/, errorBD());
        await assert.rejects(() => repo.listarParticipantes('g1'), { message: MSG });
    });
});

describe('RankingRepository.crearConInvitacion', () => {
    test('crea ranking, suma al creador y deja el mensaje; COMMIT y libera', async () => {
        pool.responder(/INSERT INTO grupo_rankings/, { rows: [{ chat_id: 'g1' }] });
        assert.equal(await repo.crearConInvitacion('g1', 'p1'), true);
        assert.deepEqual(verbos(), ['BEGIN', 'INSERT', 'INSERT', 'INSERT', 'COMMIT']);
        assert.deepEqual(pool.llamadas[1].params, ['g1', 'p1']);
        assert.deepEqual(pool.llamadas[2].params, ['g1', 'p1']);
        assert.deepEqual(pool.llamadas[3].params, ['g1', 'p1', 'Invitó al grupo a un ranking', 'invitacion_ranking']);
        assert.equal(liberados, 1);
    });
    test('si el grupo ya tenía ranking: ROLLBACK, false y no inserta nada más', async () => {
        assert.equal(await repo.crearConInvitacion('g1', 'p1'), false);
        assert.deepEqual(verbos(), ['BEGIN', 'INSERT', 'ROLLBACK']);
        assert.equal(liberados, 1);
    });
    test('error en un paso intermedio: ROLLBACK, libera y lanza el error traducido', async () => {
        pool.responder(/INSERT INTO grupo_rankings/, { rows: [{ chat_id: 'g1' }] });
        pool.responder(/INSERT INTO mensajes/, errorBD());
        await assert.rejects(() => repo.crearConInvitacion('g1', 'p1'), { message: MSG });
        assert.equal(verbos().at(-1), 'ROLLBACK');
        assert.ok(!verbos().includes('COMMIT'));
        assert.equal(liberados, 1);
    });
});

describe('RankingRepository.agregarParticipante / quitarParticipante', () => {
    test('agregar inserta con ON CONFLICT DO NOTHING y ($1 grupo, $2 perfil)', async () => {
        assert.equal(await repo.agregarParticipante('g1', 'p1'), undefined);
        assert.match(pool.llamadas[0].sql, /ON CONFLICT \(chat_id, perfil_id\) DO NOTHING/);
        assert.deepEqual(pool.llamadas[0].params, ['g1', 'p1']);
    });
    test('quitar borra con ($1 grupo, $2 perfil)', async () => {
        assert.equal(await repo.quitarParticipante('g1', 'p1'), undefined);
        assert.match(pool.llamadas[0].sql, /DELETE FROM ranking_participantes/);
        assert.deepEqual(pool.llamadas[0].params, ['g1', 'p1']);
    });
    test('ambos traducen el error de BD', async () => {
        pool.responder(/ranking_participantes/, errorBD());
        await assert.rejects(() => repo.agregarParticipante('g1', 'p1'), { message: MSG });
        await assert.rejects(() => repo.quitarParticipante('g1', 'p1'), { message: MSG });
    });
});
