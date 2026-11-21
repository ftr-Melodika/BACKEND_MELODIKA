import { test, mock, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as h from '../_ayudas/appControlador.js';

const servicio = h.servicioFalso(['chequearRacha', 'registrarMensaje', 'obtenerPerfiles', 'obtenerPerfil', 'crearPerfil', 'eliminarPerfil', 'actualizarPerfil']);
h.mockearModulo(mock, 'services/perfilService.js', { defaultExport: servicio });
h.mockearSupabase(mock);
const router = (await import(h.rutaSrc('controllers/perfilController.js'))).default;
let app;
before(async () => { app = await h.levantarApp('/api/perfiles', router); });
after(() => app.cerrar());

const P = h.PERFIL_ID;
const llamada = (m) => servicio[m].mock.calls.at(-1).arguments;
const responder = (m, v) => servicio[m].mock.mockImplementationOnce(async () => v);
const fallar = (m, e) => servicio[m].mock.mockImplementationOnce(async () => { throw e; });
const perfilOk = { nombre: '  Ana María ', username: ' Ana_1 ', fecha_nacimiento: '2000-01-31', genero: 'Femenino', pais: ' Argentina ', avatarUrl: 'http://x/a.png', esZurdo: true, extra: 'ignorado' };

test('POST :id/racha: devuelve el resultado (sin message)', async () => {
    responder('chequearRacha', { racha: 3 });
    const r = await app.pedir('POST', `/api/perfiles/${P}/racha`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { success: true, data: { racha: 3 } });
    assert.deepEqual(llamada('chequearRacha'), [h.USUARIO.id, P]);
});

test('POST :id/racha: perfil sin racha -> 404 por mapPerfilError', async () => {
    fallar('chequearRacha', new Error('Perfil no encontrado para racha'));
    const r = await app.pedir('POST', `/api/perfiles/${P}/racha`);
    assert.equal(r.status, 404);
    assert.equal(r.json.message, 'No se encontró el perfil para actualizar la racha.');
});

test('POST :id/mensajes: 201 y el service recibe tipo y datos recortados', async () => {
    responder('registrarMensaje', { enviado: true });
    const r = await app.pedir('POST', `/api/perfiles/${P}/mensajes`, {
        body: { tipo: 'feedback', categoria: 'ui', mensaje: '  Muy buena la app!  ', nombre: ' Ana ', email: ' ana@correo.com ' },
    });
    assert.equal(r.status, 201);
    assert.deepEqual(r.json, { success: true, message: 'Mensaje recibido.', data: { enviado: true } });
    assert.deepEqual(llamada('registrarMensaje'), [h.USUARIO.id, P, 'feedback', { categoria: 'ui', mensaje: 'Muy buena la app!', nombre: 'Ana', email: 'ana@correo.com' }]);
});

test('POST :id/mensajes: validaciones -> 400 sin llamar al service', async () => {
    const antes = servicio.registrarMensaje.mock.callCount();
    const casos = [
        [{ tipo: 'otro', mensaje: 'mensaje largo ok' }, 'Tipo de mensaje no válido.'],
        [{ tipo: 'contacto', mensaje: 'corto' }, 'El mensaje debe tener entre 10 y 2000 caracteres.'],
        [{ tipo: 'contacto', mensaje: 'x'.repeat(2001) }, 'El mensaje debe tener entre 10 y 2000 caracteres.'],
        [{ tipo: 'contacto', mensaje: 'mensaje largo ok', categoria: 'c'.repeat(51) }, 'La categoría no es válida.'],
        [{ tipo: 'contacto', mensaje: 'mensaje largo ok', nombre: '   ' }, 'El nombre no es válido.'],
        [{ tipo: 'contacto', mensaje: 'mensaje largo ok', email: 'x' }, 'El email no es válido.'],
    ];
    for (const [body, mensaje] of casos) {
        const r = await app.pedir('POST', `/api/perfiles/${P}/mensajes`, { body });
        assert.equal(r.status, 400, mensaje);
        assert.equal(r.json.message, mensaje);
    }
    assert.equal(servicio.registrarMensaje.mock.callCount(), antes);
});

test('POST :id/mensajes: falla guardar -> 500 por el mapper de perfiles', async () => {
    fallar('registrarMensaje', new Error('No se pudo guardar el mensaje.'));
    const r = await app.pedir('POST', `/api/perfiles/${P}/mensajes`, { body: { tipo: 'contacto', mensaje: 'mensaje largo ok' } });
    assert.equal(r.status, 500);
    assert.equal(r.json.message, 'Hubo un problema al procesar la solicitud. Intentá de nuevo más tarde.');
});

test('GET /: lista perfiles con mensaje "Tiene perfiles"', async () => {
    responder('obtenerPerfiles', [{ id: P }]);
    const r = await app.pedir('GET', '/api/perfiles/');
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { success: true, message: 'Tiene perfiles', data: [{ id: P }] });
    assert.deepEqual(llamada('obtenerPerfiles'), [h.USUARIO.id]);
});

test('GET /: si el service devuelve null -> mensaje "No tenes perfiles creados"', async () => {
    responder('obtenerPerfiles', null);
    const r = await app.pedir('GET', '/api/perfiles/');
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'No tenes perfiles creados');
    assert.equal(r.json.data, null);
});

test('GET /:id: perfil por ID', async () => {
    responder('obtenerPerfil', { id: P });
    const r = await app.pedir('GET', `/api/perfiles/${P}`);
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'Perfil obtenido correctamente.');
    assert.deepEqual(llamada('obtenerPerfil'), [h.USUARIO.id, P]);
});

test('GET /:id: ID inválido -> 400; perfil ajeno -> 403; inexistente -> 404', async () => {
    let r = await app.pedir('GET', '/api/perfiles/abc');
    assert.equal(r.status, 400);
    assert.equal(r.json.message, 'El formato del ID no es válido.');
    fallar('obtenerPerfil', new Error('Acceso denegado al perfil'));
    r = await app.pedir('GET', `/api/perfiles/${P}`);
    assert.equal(r.status, 403);
    fallar('obtenerPerfil', new Error('El perfil no existe'));
    r = await app.pedir('GET', `/api/perfiles/${P}`);
    assert.equal(r.status, 404);
});

test('POST /: crea (201); el service recibe solo los campos permitidos y normalizados', async () => {
    responder('crearPerfil', { id: P });
    const r = await app.pedir('POST', '/api/perfiles/', { body: perfilOk });
    assert.equal(r.status, 201);
    assert.deepEqual(r.json, { success: true, message: 'Perfil creado exitosamente', data: { id: P } });
    const [authId, datos] = llamada('crearPerfil');
    assert.equal(authId, h.USUARIO.id);
    assert.deepEqual(datos, {
        nombre: 'Ana María', username: 'ana_1', fecha_nacimiento: '2000-01-31', genero: 'Femenino',
        pais: 'Argentina', avatarUrl: 'http://x/a.png', esZurdo: true,
    });
});

test('POST /: validaciones -> 400', async () => {
    const antes = servicio.crearPerfil.mock.callCount();
    const casos = [
        [{ username: 'ana' }, 'El nombre es obligatorio.'],
        [{ nombre: 'Ana' }, 'El username es obligatorio.'],
        [{ nombre: 'A1', username: 'ana' }, 'El nombre debe tener al menos 3 letras y no contener números ni símbolos.'],
        [{ nombre: 'Ana', username: 'a b' }, 'El username debe tener entre 3 y 20 caracteres. Solo letras, números o guiones bajos.'],
        [{ nombre: 'Ana', username: 'ana', pais: '1' }, 'El formato del país no es válido.'],
        [{ nombre: 'Ana', username: 'ana', fecha_nacimiento: '31/01/2000' }, 'Formato de fecha inválido (debe ser AAAA-MM-DD).'],
        [{ nombre: 'Ana', username: 'ana', genero: 'X' }, 'Género no válido.'],
        [{ nombre: 'Ana', username: 'ana', esZurdo: 'si' }, 'esZurdo debe ser verdadero o falso.'],
    ];
    for (const [body, mensaje] of casos) {
        const r = await app.pedir('POST', '/api/perfiles/', { body });
        assert.equal(r.status, 400, mensaje);
        assert.equal(r.json.message, mensaje);
    }
    assert.equal(servicio.crearPerfil.mock.callCount(), antes);
});

test('POST / sin body JSON: hoy responde 500 (el validador desestructura req.body undefined)', async () => {
    const r = await app.pedir('POST', '/api/perfiles/');
    assert.equal(r.status, 500);
    assert.equal(r.json.success, false);
});

test('POST /: errores del service -> límite 400, username repetido 409, nombre repetido 409', async () => {
    fallar('crearPerfil', new Error('Límite de perfiles alcanzado'));
    let r = await app.pedir('POST', '/api/perfiles/', { body: perfilOk });
    assert.equal(r.status, 400);
    assert.equal(r.json.message, 'Ya tenés el máximo de 4 perfiles permitidos.');
    fallar('crearPerfil', Object.assign(new Error('dup'), { code: '23505' }));
    r = await app.pedir('POST', '/api/perfiles/', { body: perfilOk });
    assert.equal(r.status, 409);
    assert.equal(r.json.message, 'El nombre de usuario ya está en uso.');
    fallar('crearPerfil', new Error('Ya tienes un perfil con este nombre'));
    r = await app.pedir('POST', '/api/perfiles/', { body: perfilOk });
    assert.equal(r.status, 409);
});

test('DELETE /:id: 200 sin data', async () => {
    const r = await app.pedir('DELETE', `/api/perfiles/${P}`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { success: true, message: 'Perfil eliminado exitosamente.' });
    assert.deepEqual(llamada('eliminarPerfil'), [h.USUARIO.id, P]);
});

test('DELETE /:id: "Perfil no encontrado o no autorizado" -> 404', async () => {
    fallar('eliminarPerfil', new Error('Perfil no encontrado o no autorizado'));
    const r = await app.pedir('DELETE', `/api/perfiles/${P}`);
    assert.equal(r.status, 404);
});

test('PUT /:id: actualiza con solo los campos permitidos (username no se puede cambiar)', async () => {
    responder('actualizarPerfil', { id: P });
    const r = await app.pedir('PUT', `/api/perfiles/${P}`, { body: { nombre: ' Beto ', username: 'otro', esPublico: true, pais: 'Chile' } });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { success: true, message: 'Perfil actualizado correctamente.', data: { id: P } });
    const [authId, id, datos] = llamada('actualizarPerfil');
    assert.deepEqual([authId, id], [h.USUARIO.id, P]);
    assert.equal(datos.nombre, 'Beto');
    assert.equal(datos.esPublico, true);
    assert.equal(datos.pais, 'Chile');
    assert.ok(!('username' in datos));
});

test('PUT /:id: validaciones -> 400', async () => {
    const casos = [
        [{ esPublico: 'si' }, 'esPublico debe ser verdadero o falso.'],
        [{ esZurdo: 1 }, 'esZurdo debe ser verdadero o falso.'],
        [{ nombre: '1' }, 'El nombre debe tener al menos 3 letras y no contener números ni símbolos.'],
        [{ genero: 'Z' }, 'Género no válido.'],
    ];
    for (const [body, mensaje] of casos) {
        const r = await app.pedir('PUT', `/api/perfiles/${P}`, { body });
        assert.equal(r.status, 400, mensaje);
        assert.equal(r.json.message, mensaje);
    }
});

test('ID de perfil inválido en rutas con :id -> 400', async () => {
    for (const [m, ruta] of [['POST', '/x/racha'], ['POST', '/x/mensajes'], ['DELETE', '/x'], ['PUT', '/x']]) {
        const r = await app.pedir(m, `/api/perfiles${ruta}`, { body: {} });
        assert.equal(r.status, 400, `${m} ${ruta}`);
    }
});

test('error de conexión -> 503 con mensaje de perfiles', async () => {
    fallar('obtenerPerfiles', Object.assign(new Error('x'), { code: 'ETIMEDOUT' }));
    const r = await app.pedir('GET', '/api/perfiles/');
    assert.equal(r.status, 503);
});

test('todas las rutas piden token -> 401', async () => {
    const rutas = [
        ['POST', `/${P}/racha`], ['POST', `/${P}/mensajes`], ['GET', '/'], ['GET', `/${P}`],
        ['POST', '/'], ['DELETE', `/${P}`], ['PUT', `/${P}`],
    ];
    for (const [m, ruta] of rutas) {
        const r = await app.pedir(m, `/api/perfiles${ruta}`, { token: null, body: m === 'GET' || m === 'DELETE' ? undefined : {} });
        assert.equal(r.status, 401, `${m} ${ruta}`);
    }
});
