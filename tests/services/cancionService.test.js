import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const repo = { obtenerCanciones: async () => [], obtenerCancionPorId: async () => null };
class CancionRepositoryFalso {
    obtenerCanciones(...a) { return repo.obtenerCanciones(...a); }
    obtenerCancionPorId(...a) { return repo.obtenerCancionPorId(...a); }
}
mock.module(new URL('../../src/repositories/cancionRepository.js', import.meta.url).href, { defaultExport: CancionRepositoryFalso });
const CancionService = (await import('../../src/services/cancionService.js')).default;
const servicio = new CancionService();

beforeEach(() => {
    repo.obtenerCanciones = async () => [];
    repo.obtenerCancionPorId = async () => null;
});

test('listarCanciones devuelve lo que entrega el repositorio', async () => {
    const canciones = [{ id: 1 }, { id: 2 }];
    repo.obtenerCanciones = async () => canciones;
    assert.deepEqual(await servicio.listarCanciones(), canciones);
});

test('obtenerCancion devuelve la canción y consulta con el id recibido', async () => {
    let idRecibido;
    repo.obtenerCancionPorId = async (id) => { idRecibido = id; return { id, titulo: 'X' }; };
    assert.deepEqual(await servicio.obtenerCancion(7), { id: 7, titulo: 'X' });
    assert.equal(idRecibido, 7);
});

test('obtenerCancion lanza 404 si no existe', async () => {
    await assert.rejects(() => servicio.obtenerCancion(99), (e) => {
        assert.equal(e.message, 'Canción no encontrada.');
        assert.equal(e.status, 404);
        return true;
    });
});
