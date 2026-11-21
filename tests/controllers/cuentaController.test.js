import { test, mock, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as h from '../_ayudas/appControlador.js';

const servicio = h.servicioFalso(['login', 'refrescarSesion', 'registrar', 'eliminarCuenta', 'cambiarPassword']);
servicio.tieneContraseña = mock.fn(() => true);
h.mockearModulo(mock, 'services/cuentaService.js', { defaultExport: h.claseFalsa(servicio) });
h.mockearSupabase(mock);
const router = (await import(h.rutaSrc('controllers/cuentaController.js'))).default;
let app;
before(async () => { app = await h.levantarApp('/api/cuentas', router); });
after(() => app.cerrar());

const llamada = (metodo) => servicio[metodo].mock.calls.at(-1).arguments;
const fallar = (metodo, error) => servicio[metodo].mock.mockImplementationOnce(async () => { throw error; });
const registroOk = { email: 'ana@correo.com', password: 'Abcde!', nombre: 'Ana', apellido: 'Pérez', telefono: '1122334455' };

test('GET /: ruta protegida de prueba devuelve id y email del token', async () => {
    const r = await app.pedir('GET', '/api/cuentas/');
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.data, { user: { id: h.USUARIO.id, email: h.USUARIO.email } });
});

test('GET /: sin token -> 401', async () => {
    const r = await app.pedir('GET', '/api/cuentas/', { token: null });
    assert.equal(r.status, 401);
    assert.equal(r.json.success, false);
});

test('GET /yo: devuelve la cuenta pública con proveedor y tienePassword', async () => {
    const r = await app.pedir('GET', '/api/cuentas/yo');
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.data.cuenta, {
        id: h.USUARIO.id, email: h.USUARIO.email, metadata: h.USUARIO.user_metadata, proveedor: 'email', tienePassword: true,
    });
    assert.equal(r.json.message, 'Cuenta obtenida correctamente.');
});

test('GET /yo: sin token -> 401', async () => {
    assert.equal((await app.pedir('GET', '/api/cuentas/yo', { token: null })).status, 401);
});

test('DELETE /yo: pasa el usuario y la contraseña al service', async () => {
    const r = await app.pedir('DELETE', '/api/cuentas/yo', { body: { password: 'Abcde!' } });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { success: true, message: 'Cuenta eliminada correctamente.', data: null });
    const [user, password] = llamada('eliminarCuenta');
    assert.equal(user.id, h.USUARIO.id);
    assert.equal(password, 'Abcde!');
});

test('DELETE /yo sin body: la contraseña llega undefined (cuentas de Google)', async () => {
    const r = await app.pedir('DELETE', '/api/cuentas/yo');
    assert.equal(r.status, 200);
    assert.equal(llamada('eliminarCuenta')[1], undefined);
});

test('DELETE /yo: sin token -> 401', async () => {
    assert.equal((await app.pedir('DELETE', '/api/cuentas/yo', { token: null })).status, 401);
});

test('DELETE /yo: errores del service salen por mapEliminarCuentaError', async () => {
    fallar('eliminarCuenta', new Error('Contraseña incorrecta'));
    let r = await app.pedir('DELETE', '/api/cuentas/yo', { body: { password: 'x' } });
    assert.equal(r.status, 403);
    assert.equal(r.json.message, 'La contraseña es incorrecta.');
    fallar('eliminarCuenta', new Error('Falta la contraseña para confirmar'));
    r = await app.pedir('DELETE', '/api/cuentas/yo');
    assert.equal(r.status, 400);
    fallar('eliminarCuenta', new Error('raro'));
    r = await app.pedir('DELETE', '/api/cuentas/yo');
    assert.equal(r.status, 500);
    assert.equal(r.json.message, 'No se pudo eliminar la cuenta. Intentá de nuevo más tarde.');
});

test('PUT /yo/password: válido -> 200 y el service recibe usuario, actual y nueva', async () => {
    const r = await app.pedir('PUT', '/api/cuentas/yo/password', { body: { passwordActual: 'Vieja1!', passwordNueva: 'Nueva1!' } });
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'Contraseña actualizada correctamente.');
    const [user, actual, nueva] = llamada('cambiarPassword');
    assert.deepEqual([user.id, actual, nueva], [h.USUARIO.id, 'Vieja1!', 'Nueva1!']);
});

test('PUT /yo/password: validador corta con 400 sin llamar al service', async () => {
    const antes = servicio.cambiarPassword.mock.callCount();
    const r = await app.pedir('PUT', '/api/cuentas/yo/password', { body: { passwordActual: 'Vieja1!' } });
    assert.equal(r.status, 400);
    assert.equal(r.json.success, false);
    assert.equal(servicio.cambiarPassword.mock.callCount(), antes);
});

test('PUT /yo/password: sin token -> 401', async () => {
    assert.equal((await app.pedir('PUT', '/api/cuentas/yo/password', { token: null, body: {} })).status, 401);
});

test('PUT /yo/password: errores del service salen por mapCambiarPasswordError (no el de eliminar)', async () => {
    fallar('cambiarPassword', new Error('Contraseña incorrecta'));
    const r = await app.pedir('PUT', '/api/cuentas/yo/password', { body: { passwordActual: 'Vieja1!', passwordNueva: 'Nueva1!' } });
    assert.equal(r.status, 403);
    assert.equal(r.json.message, 'La contraseña actual es incorrecta.');
});

test('POST /login: válido -> 200 con token, refreshToken, expiresAt y cuenta pública', async () => {
    servicio.login.mock.mockImplementationOnce(async () => ({ token: 't', refreshToken: 'r', expiresAt: 123, user: h.USUARIO }));
    const r = await app.pedir('POST', '/api/cuentas/login', { token: null, body: { email: 'ana@correo.com', password: 'Abcde!' } });
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'logueado correctamente');
    assert.equal(r.json.data.token, 't');
    assert.equal(r.json.data.refreshToken, 'r');
    assert.equal(r.json.data.expiresAt, 123);
    assert.equal(r.json.data.cuenta.email, h.USUARIO.email);
    assert.equal(r.json.data.cuenta.tienePassword, true);
    assert.deepEqual(llamada('login'), ['ana@correo.com', 'Abcde!']);
});

test('POST /login: email o contraseña faltante -> 400 del validador', async () => {
    let r = await app.pedir('POST', '/api/cuentas/login', { token: null, body: { password: 'x' } });
    assert.equal(r.status, 400);
    assert.equal(r.json.message, 'Email mal ingresado');
    r = await app.pedir('POST', '/api/cuentas/login', { token: null, body: { email: 'a@b.com', password: '  ' } });
    assert.equal(r.status, 400);
    assert.equal(r.json.message, 'Contraseña mal ingresada');
});

test('POST /login sin body JSON: hoy termina en 500 (el validador lee req.body.email con body undefined)', async () => {
    const r = await app.pedir('POST', '/api/cuentas/login', { token: null });
    assert.equal(r.status, 500);
    assert.equal(r.json.success, false);
});

test('POST /login: credenciales inválidas -> mapLoginError (400)', async () => {
    fallar('login', Object.assign(new Error('Invalid login credentials'), { status: 400 }));
    const r = await app.pedir('POST', '/api/cuentas/login', { token: null, body: { email: 'a@b.com', password: 'mala' } });
    assert.equal(r.status, 400);
    assert.equal(r.json.message, 'El correo electrónico o la contraseña son incorrectos.');
});

test('POST /refresh: recorta el token y responde con la sesión nueva (sin cuenta)', async () => {
    servicio.refrescarSesion.mock.mockImplementationOnce(async () => ({ token: 't2', refreshToken: 'r2', expiresAt: 9 }));
    const r = await app.pedir('POST', '/api/cuentas/refresh', { token: null, body: { refreshToken: '  abc  ' } });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.data, { token: 't2', refreshToken: 'r2', expiresAt: 9 });
    assert.equal(r.json.message, 'sesión renovada');
    assert.deepEqual(llamada('refrescarSesion'), ['abc']);
});

test('POST /refresh: falta refreshToken -> 400', async () => {
    const r = await app.pedir('POST', '/api/cuentas/refresh', { token: null, body: { refreshToken: '   ' } });
    assert.equal(r.status, 400);
    assert.equal(r.json.message, 'refreshToken requerido');
});

test('POST /refresh: error del service no tiene mapper: responde con su status y mensaje tal cual', async () => {
    fallar('refrescarSesion', Object.assign(new Error('Invalid Refresh Token'), { status: 401 }));
    const r = await app.pedir('POST', '/api/cuentas/refresh', { token: null, body: { refreshToken: 'abc' } });
    assert.equal(r.status, 401);
    assert.equal(r.json.message, 'Invalid Refresh Token');
});

test('POST /registrar: válido -> 201 con usuario y cuenta; el service recibe el body', async () => {
    servicio.registrar.mock.mockImplementationOnce(async () => ({ user: { id: 'u1', email: 'ana@correo.com', secreto: 'no' }, cuenta: { id: 5, nombre: 'Ana' } }));
    const r = await app.pedir('POST', '/api/cuentas/registrar', { token: null, body: registroOk });
    assert.equal(r.status, 201);
    assert.deepEqual(r.json, {
        success: true, message: '¡Usuario registrado con éxito!',
        data: { usuario: { id: 'u1', email: 'ana@correo.com' }, cuenta: { id: 5, nombre: 'Ana' } },
    });
    assert.deepEqual(llamada('registrar')[0], registroOk);
});

test('POST /registrar: datos incompletos -> 400 sin llamar al service', async () => {
    const antes = servicio.registrar.mock.callCount();
    const r = await app.pedir('POST', '/api/cuentas/registrar', { token: null, body: { email: 'a@b.com' } });
    assert.equal(r.status, 400);
    assert.equal(servicio.registrar.mock.callCount(), antes);
});

test('POST /registrar: correo repetido -> mapRegisterError', async () => {
    fallar('registrar', Object.assign(new Error('User already registered'), { status: 400 }));
    const r = await app.pedir('POST', '/api/cuentas/registrar', { token: null, body: registroOk });
    assert.equal(r.status, 400);
    assert.equal(r.json.message, 'El correo electrónico ya está registrado.');
});

test('POST /registrar: rate limit -> 429', async () => {
    fallar('registrar', Object.assign(new Error('email rate limit exceeded'), { status: 429 }));
    const r = await app.pedir('POST', '/api/cuentas/registrar', { token: null, body: registroOk });
    assert.equal(r.status, 429);
});
