import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { errorHandler } from '../../src/middlewares/errorHandler.js';

function manejar(error, { url = '/api/otra', method = 'GET' } = {}) {
    const logs = [];
    const espia = mock.method(console, 'log', (...a) => logs.push(a));
    let salida;
    const res = { status: (codigo) => ({ json: (cuerpo) => { salida = { codigo, cuerpo }; return 'enviado'; } }) };
    const retorno = errorHandler(error, { originalUrl: url, method }, res, () => {});
    espia.mock.restore();
    return { ...salida, logs, retorno };
}

const err = (mensaje, extra = {}) => Object.assign(new Error(mensaje), extra);

test('siempre responde { success:false, message } y devuelve lo que envió res', () => {
    const r = manejar(err('x'), { url: '/api/cursos/1' });
    assert.equal(r.cuerpo.success, false);
    assert.deepEqual(Object.keys(r.cuerpo).sort(), ['message', 'success']);
    assert.equal(r.retorno, 'enviado');
});

test('registra el error oculto exactamente una vez (log de depuración)', () => {
    const r = manejar(err('detalle interno', { status: 418 }), { url: '/api/cursos/1' });
    assert.equal(r.logs.length, 4);
    assert.deepEqual(r.logs[1], ['Mensaje original:', 'detalle interno']);
    assert.deepEqual(r.logs[2], ['Status original:', 418]);
});

test('no expone el mensaje interno al usuario en rutas con mapper', () => {
    const r = manejar(err('select * from cuentas'), { url: '/api/cursos/perfil/1' });
    assert.equal(r.codigo, 500);
    assert.ok(!r.cuerpo.message.includes('select'));
});

test('elige el mapper según la ruta', () => {
    const casos = [
        ['POST', '/api/cuentas/login', err('Invalid login credentials', { status: 400 }), 'El correo electrónico o la contraseña son incorrectos.'],
        ['POST', '/api/cuentas/registrar', err('User already registered', { status: 400 }), 'El correo electrónico ya está registrado.'],
        ['PUT', '/api/cuentas/yo/password', err('Contraseña incorrecta'), 'La contraseña actual es incorrecta.'],
        ['DELETE', '/api/cuentas/yo', err('Contraseña incorrecta'), 'La contraseña es incorrecta.'],
        ['GET', '/api/cursos/perfil/1', err('Curso no encontrado.'), 'Curso no encontrado.'],
        ['GET', '/api/canciones/3', err('Canción no encontrada.', { status: 404 }), 'Canción no encontrada.'],
        ['GET', '/api/perfiles/abc/solicitudes', err('Solicitud no encontrada'), 'No encontramos esa solicitud.'],
        ['GET', '/api/perfiles/abc/amigos', err('Ya son amigos'), 'Ya son amigos.'],
        ['GET', '/api/perfiles/abc/social/def', err('Invitación no válida'), 'Este link de invitación no es válido o ya fue reemplazado.'],
        ['GET', '/api/perfiles/abc/invitacion', err('Invitación no válida'), 'Este link de invitación no es válido o ya fue reemplazado.'],
        ['GET', '/api/perfiles/abc/amistades/x', err('Solicitud no encontrada'), 'No encontramos esa solicitud.'],
        ['GET', '/api/perfiles/abc/grupos/mios', err('Grupo no encontrado'), 'No encontramos ese grupo.'],
        ['GET', '/api/perfiles/abc/grupos?x=1', err('Grupo no encontrado'), 'No encontramos ese grupo.'],
        ['GET', '/api/perfiles/abc/rankings', err('El grupo ya tiene un ranking'), 'Este grupo ya tiene un ranking. Aceptá la invitación para entrar.'],
        ['GET', '/api/perfiles/abc/grupos/g1/ranking', err('El grupo todavía no tiene un ranking'), 'Este grupo todavía no tiene un ranking. Invitá al grupo para crearlo.'],
        ['GET', '/api/perfiles/abc', err('Límite de perfiles alcanzado'), 'Ya tenés el máximo de 4 perfiles permitidos.'],
    ];
    for (const [method, url, error, esperado] of casos) {
        assert.equal(manejar(error, { url, method }).cuerpo.message, esperado, `${method} ${url}`);
    }
});

test('el ranking de un grupo usa el mapper de rankings, no el de grupos', () => {
    // "El grupo ya tiene un ranking" solo lo conoce mapRankingError; mapGrupoError daría el mensaje genérico
    const r = manejar(err('El grupo ya tiene un ranking'), { url: '/api/perfiles/abc/grupos/g1/ranking/aceptar' });
    assert.equal(r.codigo, 409);
});

test('DELETE /api/cuentas/yo/algo distinto de password usa el mapper de eliminar cuenta', () => {
    const r = manejar(err('Falta la contraseña para confirmar'), { url: '/api/cuentas/yo', method: 'DELETE' });
    assert.equal(r.cuerpo.message, 'Ingresá tu contraseña para confirmar que querés eliminar la cuenta.');
});

test('GET /api/cuentas/yo (sin mapper de cuentas) usa el comportamiento por defecto', () => {
    const r = manejar(err('boom', { status: 401 }), { url: '/api/cuentas/yo', method: 'GET' });
    assert.equal(r.codigo, 401);
    assert.equal(r.cuerpo.message, 'boom');
});

test('ruta sin mapper: usa error.status y error.message, o 500 y mensaje genérico', () => {
    let r = manejar(err('Texto del error', { status: 404 }));
    assert.deepEqual([r.codigo, r.cuerpo.message], [404, 'Texto del error']);
    r = manejar(err('otro'));
    assert.deepEqual([r.codigo, r.cuerpo.message], [500, 'otro']);
    r = manejar(err(''));
    assert.equal(r.codigo, 500);
    assert.equal(r.cuerpo.message, 'Hubo un error inesperado.');
});

test('error.mapError tiene prioridad sobre la ruta', () => {
    const error = err('x', { mapError: () => ({ codigoEstado: 418, mensajeUsuario: 'Soy tetera' }) });
    const r = manejar(error, { url: '/api/cursos/1' });
    assert.deepEqual([r.codigo, r.cuerpo.message], [418, 'Soy tetera']);
});

test('un mapper que no devuelve código ni mensaje cae a 500 y mensaje por defecto', () => {
    const error = err('x', { mapError: () => ({}) });
    const r = manejar(error);
    assert.deepEqual([r.codigo, r.cuerpo.message], [500, 'Hubo un error inesperado.']);
});

test('tolera errores que no son Error (undefined o texto)', () => {
    let r = manejar(undefined);
    assert.equal(r.codigo, 500);
    assert.equal(r.cuerpo.message, 'Hubo un error inesperado.');
    r = manejar('texto suelto');
    assert.equal(r.codigo, 500);
});

test('req sin originalUrl no rompe', () => {
    let salida;
    const res = { status: (c) => ({ json: (b) => { salida = [c, b.message]; } }) };
    const espia = mock.method(console, 'log', () => {});
    errorHandler(err('x'), {}, res, () => {});
    espia.mock.restore();
    assert.deepEqual(salida, [500, 'x']);
});
