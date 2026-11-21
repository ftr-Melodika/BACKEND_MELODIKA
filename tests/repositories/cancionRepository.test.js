import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

console.error = () => {};
const { instalarPoolFalso } = await import('../_ayudas/poolFalso.js');
const pool = instalarPoolFalso();

const { default: CancionRepository } = await import('../../src/repositories/cancionRepository.js');
const { MENSAJES_ERROR_DB } = await import('../../src/helpers/manejoErrores/mensajesErrorDB.js');

const repo = new CancionRepository();
const errorBD = (code = '08006') => Object.assign(new Error('boom'), { code });

const fila = (extra = {}) => ({
    id: 1, titulo: 'T', artista: 'A', bpm: 90, capo: 2, progresion: ['C', 'G'], formas: { C: 'x' },
    nota_rasgueo: 'abajo', consejo: 'lento', ...extra,
});

beforeEach(() => pool.reiniciar());

describe('CancionRepository.obtenerCanciones', () => {
    test('mapea filas a camelCase (nota_rasgueo -> notaRasgueo)', async () => {
        pool.responder(/FROM canciones_practica/, { rows: [fila()] });
        assert.deepEqual(await repo.obtenerCanciones(), [{
            id: 1, titulo: 'T', artista: 'A', bpm: 90, capo: 2, progresion: ['C', 'G'], formas: { C: 'x' },
            notaRasgueo: 'abajo', consejo: 'lento',
        }]);
    });
    test('ordena por orden y título, sin parámetros', async () => {
        await repo.obtenerCanciones();
        assert.match(pool.llamadas[0].sql, /ORDER BY orden ASC, titulo ASC/);
        assert.deepEqual(pool.llamadas[0].params, []);
    });
    test('sin filas devuelve []', async () => {
        assert.deepEqual(await repo.obtenerCanciones(), []);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/canciones_practica/, errorBD());
        await assert.rejects(() => repo.obtenerCanciones(), { message: MENSAJES_ERROR_DB.OBTENER_CANCIONES });
    });
});

describe('CancionRepository.obtenerCancionPorId', () => {
    test('devuelve la canción mapeada y pasa el id como $1', async () => {
        pool.responder(/WHERE id = \$1/, { rows: [fila({ id: 5 })] });
        const r = await repo.obtenerCancionPorId(5);
        assert.equal(r.id, 5);
        assert.equal(r.notaRasgueo, 'abajo');
        assert.deepEqual(pool.llamadas[0].params, [5]);
    });
    test('null si no existe', async () => {
        assert.equal(await repo.obtenerCancionPorId(99), null);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/canciones_practica/, errorBD());
        await assert.rejects(() => repo.obtenerCancionPorId(1), { message: MENSAJES_ERROR_DB.OBTENER_CANCION });
    });
});
