import { test, mock, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as h from '../_ayudas/appControlador.js';

const amistad = h.servicioFalso(['obtenerPerfilSocial', 'enviarSolicitud', 'listarSolicitudes', 'responderSolicitud', 'eliminarAmistad', 'listarAmigos']);
const invitacion = h.servicioFalso(['obtenerMiInvitacion', 'regenerarInvitacion', 'verInvitacion']);
h.mockearModulo(mock, 'services/amistadService.js', { defaultExport: amistad });
h.mockearModulo(mock, 'services/invitacionAmistadService.js', { defaultExport: invitacion });
h.mockearSupabase(mock);
const router = (await import(h.rutaSrc('controllers/amistadController.js'))).default;
let app;
before(async () => { app = await h.levantarApp('/api/perfiles', router); });
after(() => app.cerrar());

const P = h.PERFIL_ID;
const OTRO = h.OTRO_ID;
const TOKEN_INV = 'abcdefghijklmnopqrstuv'; // 22 caracteres
const base = `/api/perfiles/${P}`;
const llamada = (svc, m) => svc[m].mock.calls.at(-1).arguments;
const responder = (svc, m, v) => svc[m].mock.mockImplementationOnce(async () => v);
const fallar = (svc, m, e) => svc[m].mock.mockImplementationOnce(async () => { throw e; });

test('GET :id/invitacion: devuelve mi invitación', async () => {
    responder(invitacion, 'obtenerMiInvitacion', { token: TOKEN_INV });
    const r = await app.pedir('GET', `${base}/invitacion`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { success: true, message: 'Invitación obtenida correctamente.', data: { token: TOKEN_INV } });
    assert.deepEqual(llamada(invitacion, 'obtenerMiInvitacion'), [h.USUARIO.id, P]);
});

test('POST :id/invitacion/regenerar: 200 con mensaje propio', async () => {
    responder(invitacion, 'regenerarInvitacion', { token: 'nuevo' });
    const r = await app.pedir('POST', `${base}/invitacion/regenerar`);
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'Invitación regenerada.');
    assert.deepEqual(llamada(invitacion, 'regenerarInvitacion'), [h.USUARIO.id, P]);
});

test('GET :id/invitacion/:token: token válido llega al service', async () => {
    responder(invitacion, 'verInvitacion', { relacion: { estado: 'ninguna' } });
    const r = await app.pedir('GET', `${base}/invitacion/${TOKEN_INV}`);
    assert.equal(r.status, 200);
    assert.deepEqual(llamada(invitacion, 'verInvitacion'), [h.USUARIO.id, P, TOKEN_INV]);
});

test('GET :id/invitacion/:token: token mal formado -> 404 del validador (igual que uno inexistente)', async () => {
    const antes = invitacion.verInvitacion.mock.callCount();
    const r = await app.pedir('GET', `${base}/invitacion/corto`);
    assert.equal(r.status, 404);
    assert.equal(r.json.message, 'Este link de invitación no es válido o ya fue reemplazado.');
    assert.equal(invitacion.verInvitacion.mock.callCount(), antes);
});

test('GET :id/invitacion/:token: "Invitación no válida" del service -> 404 por mapAmistadError', async () => {
    fallar(invitacion, 'verInvitacion', new Error('Invitación no válida'));
    const r = await app.pedir('GET', `${base}/invitacion/${TOKEN_INV}`);
    assert.equal(r.status, 404);
    assert.equal(r.json.message, 'Este link de invitación no es válido o ya fue reemplazado.');
});

test('GET :id/social/:otroId: perfil social con (authId, perfilId, otroId)', async () => {
    responder(amistad, 'obtenerPerfilSocial', { nombre: 'Beto' });
    const r = await app.pedir('GET', `${base}/social/${OTRO}`);
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'Perfil obtenido correctamente.');
    assert.deepEqual(llamada(amistad, 'obtenerPerfilSocial'), [h.USUARIO.id, P, OTRO]);
});

test('GET :id/social/:otroId: otroId inválido -> 400', async () => {
    const r = await app.pedir('GET', `${base}/social/xyz`);
    assert.equal(r.status, 400);
    assert.equal(r.json.message, 'El formato del ID no es válido.');
});

test('POST :id/solicitudes por destinoId -> 201 y el service recibe el body limpio', async () => {
    responder(amistad, 'enviarSolicitud', { id: 'a1' });
    const r = await app.pedir('POST', `${base}/solicitudes`, { body: { destinoId: OTRO } });
    assert.equal(r.status, 201);
    assert.deepEqual(r.json, { success: true, message: 'Solicitud enviada.', data: { id: 'a1' } });
    assert.deepEqual(llamada(amistad, 'enviarSolicitud'), [h.USUARIO.id, P, { destinoId: OTRO, token: undefined }]);
});

test('POST :id/solicitudes por username -> el body se reduce a { username } sin espacios', async () => {
    await app.pedir('POST', `${base}/solicitudes`, { body: { username: '  beto_1 ' } });
    assert.deepEqual(llamada(amistad, 'enviarSolicitud')[2], { username: 'beto_1' });
});

test('POST :id/solicitudes: sin destino, con dos destinos o username inválido -> 400', async () => {
    const antes = amistad.enviarSolicitud.mock.callCount();
    let r = await app.pedir('POST', `${base}/solicitudes`, { body: {} });
    assert.equal(r.status, 400);
    r = await app.pedir('POST', `${base}/solicitudes`, { body: { destinoId: OTRO, username: 'beto' } });
    assert.equal(r.status, 400);
    r = await app.pedir('POST', `${base}/solicitudes`, { body: { username: 'a b' } });
    assert.equal(r.json.message, 'El username no es válido.');
    r = await app.pedir('POST', `${base}/solicitudes`, { body: { token: 'corto' } });
    assert.equal(r.json.message, 'El link de invitación no es válido.');
    assert.equal(amistad.enviarSolicitud.mock.callCount(), antes);
});

test('POST :id/solicitudes: errores de negocio -> mapAmistadError', async () => {
    fallar(amistad, 'enviarSolicitud', new Error('Ya son amigos'));
    let r = await app.pedir('POST', `${base}/solicitudes`, { body: { destinoId: OTRO } });
    assert.equal(r.status, 409);
    fallar(amistad, 'enviarSolicitud', new Error('No podés enviarte una solicitud a vos mismo'));
    r = await app.pedir('POST', `${base}/solicitudes`, { body: { destinoId: OTRO } });
    assert.equal(r.status, 400);
    fallar(amistad, 'enviarSolicitud', Object.assign(new Error('dup'), { code: '23505' }));
    r = await app.pedir('POST', `${base}/solicitudes`, { body: { destinoId: OTRO } });
    assert.equal(r.status, 409);
    assert.equal(r.json.message, 'Ya existe una solicitud o amistad con este perfil.');
});

test('GET :id/solicitudes: lista pendientes', async () => {
    responder(amistad, 'listarSolicitudes', []);
    const r = await app.pedir('GET', `${base}/solicitudes`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { success: true, message: 'Solicitudes obtenidas correctamente.', data: [] });
    assert.deepEqual(llamada(amistad, 'listarSolicitudes'), [h.USUARIO.id, P]);
});

test('PUT :id/solicitudes/:amistadId: acepta y pasa la acción', async () => {
    responder(amistad, 'responderSolicitud', { estado: 'aceptada' });
    const r = await app.pedir('PUT', `${base}/solicitudes/${OTRO}`, { body: { accion: 'aceptar' } });
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'Solicitud respondida.');
    assert.deepEqual(llamada(amistad, 'responderSolicitud'), [h.USUARIO.id, P, OTRO, 'aceptar']);
});

test('PUT :id/solicitudes/:amistadId: acción inválida o ID inválido -> 400', async () => {
    let r = await app.pedir('PUT', `${base}/solicitudes/${OTRO}`, { body: { accion: 'borrar' } });
    assert.equal(r.status, 400);
    assert.equal(r.json.message, "La acción debe ser 'aceptar' o 'rechazar'.");
    r = await app.pedir('PUT', `${base}/solicitudes/no-uuid`, { body: { accion: 'aceptar' } });
    assert.equal(r.status, 400);
    assert.equal(r.json.message, 'El formato del ID de la solicitud no es válido.');
});

test('PUT :id/solicitudes/:amistadId: solo el receptor puede responder -> 403', async () => {
    fallar(amistad, 'responderSolicitud', new Error('No podés responder esta solicitud'));
    const r = await app.pedir('PUT', `${base}/solicitudes/${OTRO}`, { body: { accion: 'aceptar' } });
    assert.equal(r.status, 403);
});

test('DELETE :id/amistades/:amistadId: 200 sin campo data', async () => {
    const r = await app.pedir('DELETE', `${base}/amistades/${OTRO}`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { success: true, message: 'Eliminada correctamente.' });
    assert.deepEqual(llamada(amistad, 'eliminarAmistad'), [h.USUARIO.id, P, OTRO]);
});

test('DELETE :id/amistades/:amistadId: no encontrada -> 404', async () => {
    fallar(amistad, 'eliminarAmistad', new Error('Solicitud no encontrada'));
    const r = await app.pedir('DELETE', `${base}/amistades/${OTRO}`);
    assert.equal(r.status, 404);
    assert.equal(r.json.message, 'No encontramos esa solicitud.');
});

test('GET :id/amigos: lista amigos', async () => {
    responder(amistad, 'listarAmigos', [{ id: OTRO }]);
    const r = await app.pedir('GET', `${base}/amigos`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.data, [{ id: OTRO }]);
    assert.equal(r.json.message, 'Amigos obtenidos correctamente.');
});

test('acceso denegado al perfil -> 403 con el mensaje común', async () => {
    fallar(amistad, 'listarAmigos', new Error('Acceso denegado al perfil'));
    const r = await app.pedir('GET', `${base}/amigos`);
    assert.equal(r.status, 403);
    assert.equal(r.json.message, 'No tienes permisos para modificar este perfil.');
});

test('ID de perfil inválido en la URL -> 400 en todas las rutas con :id', async () => {
    for (const ruta of ['/invitacion', '/solicitudes', '/amigos']) {
        const r = await app.pedir('GET', `/api/perfiles/nada${ruta}`);
        assert.equal(r.status, 400, ruta);
    }
});

test('todas las rutas piden token -> 401', async () => {
    const rutas = [
        ['GET', '/invitacion'], ['POST', '/invitacion/regenerar'], ['GET', `/invitacion/${TOKEN_INV}`],
        ['GET', `/social/${OTRO}`], ['POST', '/solicitudes'], ['GET', '/solicitudes'],
        ['PUT', `/solicitudes/${OTRO}`], ['DELETE', `/amistades/${OTRO}`], ['GET', '/amigos'],
    ];
    for (const [m, ruta] of rutas) {
        const r = await app.pedir(m, base + ruta, { token: null, body: m === 'GET' || m === 'DELETE' ? undefined : {} });
        assert.equal(r.status, 401, `${m} ${ruta}`);
    }
});
