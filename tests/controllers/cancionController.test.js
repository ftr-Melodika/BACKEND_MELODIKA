import { test, mock, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as h from '../_ayudas/appControlador.js';

const servicio = h.servicioFalso(['listarCanciones', 'obtenerCancion']);
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
