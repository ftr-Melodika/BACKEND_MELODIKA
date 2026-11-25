import { test, mock, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as h from '../_ayudas/appControlador.js';

const servicio = h.servicioFalso(['listarCanciones', 'obtenerCancion', 'listarFavoritas', 'marcarFavorita', 'quitarFavorita', 'listarEstrellas', 'guardarEstrellas']);
h.mockearModulo(mock, 'services/cancionService.js', { defaultExport: h.claseFalsa(servicio) });
const supa = h.mockearSupabase(mock);
const router = (await import(h.rutaSrc('controllers/cancionController.js'))).default;
let app;
before(async () => { app = await h.levantarApp('/api/canciones', router); });
after(() => app.cerrar());

test('GET /api/canciones: 200 con la lista del service', async () => {
    servicio.listarCanciones.mock.mockImplementationOnce(async () => [{ id: 1, titulo: 'A' }]);
    const r = await app.pedir('GET', '/api/canciones');
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { success: true, message: 'Canciones obtenidas exitosamente.', data: [{ id: 1, titulo: 'A' }] });
});

test('GET /api/canciones/:id: pasa el id al service y responde 200', async () => {
    servicio.obtenerCancion.mock.mockImplementationOnce(async () => ({ id: '7' }));
    const r = await app.pedir('GET', '/api/canciones/7');
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.data, { id: '7' });
    assert.equal(r.json.message, 'Canción obtenida exitosamente.');
    assert.deepEqual(servicio.obtenerCancion.mock.calls.at(-1).arguments, ['7']);
});

test('sin token -> 401 y no llega al service', async () => {
    const antes = servicio.listarCanciones.mock.callCount();
    const r = await app.pedir('GET', '/api/canciones', { token: null });
    assert.equal(r.status, 401);
    assert.equal(r.json.success, false);
    assert.equal(servicio.listarCanciones.mock.callCount(), antes);
});

test('token inválido -> 401', async () => {
    const r = await app.pedir('GET', '/api/canciones/1', { token: 'malo' });
    assert.equal(r.status, 401);
    assert.equal(r.json.message, 'Token inválido o expirado');
    assert.ok(supa.consultas.includes('malo'));
});

test('canción inexistente: el error del service (con status 404) sale por el mapper de canciones', async () => {
    servicio.obtenerCancion.mock.mockImplementationOnce(async () => { throw Object.assign(new Error('Canción no encontrada.'), { status: 404 }); });
    const r = await app.pedir('GET', '/api/canciones/99');
    assert.equal(r.status, 404);
    assert.deepEqual(r.json, { success: false, message: 'Canción no encontrada.' });
});

test('error interno del service -> 500 con mensaje genérico (no expone el texto)', async () => {
    servicio.listarCanciones.mock.mockImplementationOnce(async () => { throw new Error('select * from secreto'); });
    const r = await app.pedir('GET', '/api/canciones');
    assert.equal(r.status, 500);
    assert.equal(r.json.message, 'Hubo un problema interno al procesar las canciones.');
});

test('ID inválido de Postgres (22P02) -> 400 con mensaje de canción', async () => {
    servicio.obtenerCancion.mock.mockImplementationOnce(async () => { throw Object.assign(new Error('x'), { code: '22P02' }); });
    const r = await app.pedir('GET', '/api/canciones/abc');
    assert.equal(r.status, 400);
    assert.equal(r.json.message, 'El ID de la canción no tiene un formato válido.');
});

const PERFIL = '439d91de-87a2-4ef8-9eba-f8135d63f554';

test('GET favoritas: 200 con la lista de ids del perfil', async () => {
    servicio.listarFavoritas.mock.mockImplementationOnce(async () => ['sera', 'creep']);
    const r = await app.pedir('GET', `/api/canciones/perfil/${PERFIL}/favoritas`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { success: true, message: 'Favoritas obtenidas exitosamente.', data: ['sera', 'creep'] });
    assert.equal(servicio.listarFavoritas.mock.calls.at(-1).arguments[1], PERFIL);
});

test('GET favoritas con perfilId que no es UUID -> 400 y no llega al service', async () => {
    const antes = servicio.listarFavoritas.mock.callCount();
    const r = await app.pedir('GET', '/api/canciones/perfil/abc/favoritas');
    assert.equal(r.status, 400);
    assert.equal(servicio.listarFavoritas.mock.callCount(), antes);
});

test('POST favorita: 201 y pasa perfil y canción al service', async () => {
    servicio.marcarFavorita.mock.mockImplementationOnce(async () => ({ cancionId: 'sera', favorita: true }));
    const r = await app.pedir('POST', `/api/canciones/perfil/${PERFIL}/sera/favorita`);
    assert.equal(r.status, 201);
    assert.deepEqual(r.json, { success: true, message: 'Canción agregada a favoritas.', data: { cancionId: 'sera', favorita: true } });
    assert.deepEqual(servicio.marcarFavorita.mock.calls.at(-1).arguments.slice(1), [PERFIL, 'sera']);
});

test('POST favorita de una canción inexistente -> 404', async () => {
    servicio.marcarFavorita.mock.mockImplementationOnce(async () => { throw Object.assign(new Error('Canción no encontrada.'), { status: 404 }); });
    const r = await app.pedir('POST', `/api/canciones/perfil/${PERFIL}/no-existe/favorita`);
    assert.equal(r.status, 404);
    assert.equal(r.json.message, 'Canción no encontrada.');
});

test('POST favorita con id de canción inválido -> 400', async () => {
    const r = await app.pedir('POST', `/api/canciones/perfil/${PERFIL}/Mala%20Id/favorita`);
    assert.equal(r.status, 400);
});

test('POST favorita de un perfil ajeno -> 403 con mensaje del mapper', async () => {
    servicio.marcarFavorita.mock.mockImplementationOnce(async () => { throw new Error('Acceso denegado al perfil'); });
    const r = await app.pedir('POST', `/api/canciones/perfil/${PERFIL}/sera/favorita`);
    assert.equal(r.status, 403);
    assert.equal(r.json.success, false);
});

test('DELETE favorita: 200', async () => {
    servicio.quitarFavorita.mock.mockImplementationOnce(async () => ({ cancionId: 'sera', favorita: false }));
    const r = await app.pedir('DELETE', `/api/canciones/perfil/${PERFIL}/sera/favorita`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { success: true, message: 'Canción quitada de favoritas.', data: { cancionId: 'sera', favorita: false } });
});

test('las rutas de favoritas no chocan con GET /api/canciones/:id', async () => {
    servicio.obtenerCancion.mock.mockImplementationOnce(async () => ({ id: 'perfil' }));
    const r = await app.pedir('GET', '/api/canciones/perfil');
    assert.equal(r.status, 200);
    assert.deepEqual(servicio.obtenerCancion.mock.calls.at(-1).arguments, ['perfil']);
});

test('GET estrellas: 200 con el objeto idCancion -> estrellas', async () => {
    servicio.listarEstrellas.mock.mockImplementationOnce(async () => ({ sera: 2, creep: 3 }));
    const r = await app.pedir('GET', `/api/canciones/perfil/${PERFIL}/estrellas`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { success: true, message: 'Estrellas obtenidas exitosamente.', data: { sera: 2, creep: 3 } });
});

test('PUT estrellas: 200, pasa las estrellas al service y devuelve el mejor resultado', async () => {
    servicio.guardarEstrellas.mock.mockImplementationOnce(async () => ({ cancionId: 'sera', estrellas: 3 }));
    const r = await app.pedir('PUT', `/api/canciones/perfil/${PERFIL}/sera/estrellas`, { body: { estrellas: 2 } });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { success: true, message: 'Estrellas guardadas.', data: { cancionId: 'sera', estrellas: 3 } });
    assert.deepEqual(servicio.guardarEstrellas.mock.calls.at(-1).arguments.slice(1), [PERFIL, 'sera', 2]);
});

test('PUT estrellas inválidas (0, 4, 1.5, texto o sin body) -> 400 y no llega al service', async () => {
    const antes = servicio.guardarEstrellas.mock.callCount();
    for (const body of [{ estrellas: 0 }, { estrellas: 4 }, { estrellas: 1.5 }, { estrellas: '2' }, {}]) {
        const r = await app.pedir('PUT', `/api/canciones/perfil/${PERFIL}/sera/estrellas`, { body });
        assert.equal(r.status, 400, JSON.stringify(body));
    }
    assert.equal(servicio.guardarEstrellas.mock.callCount(), antes);
});

test('PUT estrellas de una canción inexistente -> 404', async () => {
    servicio.guardarEstrellas.mock.mockImplementationOnce(async () => { throw Object.assign(new Error('Canción no encontrada.'), { status: 404 }); });
    const r = await app.pedir('PUT', `/api/canciones/perfil/${PERFIL}/no-existe/estrellas`, { body: { estrellas: 1 } });
    assert.equal(r.status, 404);
});
