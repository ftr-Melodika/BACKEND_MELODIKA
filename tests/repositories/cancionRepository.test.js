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
    nota_rasgueo: 'abajo', consejo: 'lento', genero: 'Rock', portada: null, dificultad: 'facil', ...extra,
});

beforeEach(() => pool.reiniciar());

describe('CancionRepository.obtenerCanciones', () => {
    test('mapea filas a camelCase (nota_rasgueo -> notaRasgueo)', async () => {
        pool.responder(/FROM canciones_practica/, { rows: [fila()] });
        assert.deepEqual(await repo.obtenerCanciones(), [{
            id: 1, titulo: 'T', artista: 'A', bpm: 90, capo: 2, progresion: ['C', 'G'], formas: { C: 'x' },
            notaRasgueo: 'abajo', consejo: 'lento', genero: 'Rock', portada: null, dificultad: 'facil',
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

describe('CancionRepository favoritas', () => {
    test('obtenerIdsFavoritas devuelve solo los ids y pasa el perfil como $1', async () => {
        pool.responder(/FROM canciones_favoritas/, { rows: [{ cancion_id: 'sera' }, { cancion_id: 'creep' }] });
        assert.deepEqual(await repo.obtenerIdsFavoritas('p1'), ['sera', 'creep']);
        assert.deepEqual(pool.llamadas[0].params, ['p1']);
    });
    test('agregarFavorita es idempotente (ON CONFLICT DO NOTHING)', async () => {
        await repo.agregarFavorita('p1', 'sera');
        assert.match(pool.llamadas[0].sql, /ON CONFLICT \(perfil_id, cancion_id\) DO NOTHING/);
        assert.deepEqual(pool.llamadas[0].params, ['p1', 'sera']);
    });
    test('quitarFavorita borra por perfil y canción', async () => {
        await repo.quitarFavorita('p1', 'sera');
        assert.match(pool.llamadas[0].sql, /DELETE FROM canciones_favoritas/);
        assert.deepEqual(pool.llamadas[0].params, ['p1', 'sera']);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/canciones_favoritas/, errorBD());
        await assert.rejects(() => repo.agregarFavorita('p1', 'sera'), { message: MENSAJES_ERROR_DB.AGREGAR_FAVORITA });
    });
});

describe('CancionRepository estrellas', () => {
    test('obtenerEstrellas arma el objeto idCancion -> estrellas', async () => {
        pool.responder(/FROM canciones_estrellas/, { rows: [{ cancion_id: 'sera', estrellas: 2 }, { cancion_id: 'creep', estrellas: 3 }] });
        assert.deepEqual(await repo.obtenerEstrellas('p1'), { sera: 2, creep: 3 });
        assert.deepEqual(pool.llamadas[0].params, ['p1']);
    });
    test('guardarMejorEstrellas usa GREATEST para no bajar y devuelve las que quedaron', async () => {
        pool.responder(/INSERT INTO canciones_estrellas/, { rows: [{ estrellas: 3 }] });
        assert.equal(await repo.guardarMejorEstrellas('p1', 'sera', 1), 3);
        assert.match(pool.llamadas[0].sql, /GREATEST\(canciones_estrellas\.estrellas, EXCLUDED\.estrellas\)/);
        assert.deepEqual(pool.llamadas[0].params, ['p1', 'sera', 1]);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/canciones_estrellas/, errorBD());
        await assert.rejects(() => repo.guardarMejorEstrellas('p1', 'sera', 1), { message: MENSAJES_ERROR_DB.GUARDAR_ESTRELLAS });
    });
});
