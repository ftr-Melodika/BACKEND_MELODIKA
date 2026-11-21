import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

// Supabase falso: reconoce tokens "ok-*"; cuenta las consultas por token
const consultas = [];
let modo = 'normal';
const getUser = async (token) => {
    consultas.push(token);
    if (modo === 'lanza') throw new Error('red caída');
    if (modo === 'sinUsuario') return { data: { user: null }, error: null };
    if (modo === 'datosNulos') return { data: null, error: null };
    return token.startsWith('ok-')
        ? { data: { user: { id: `u-${token}` } }, error: null }
        : { data: { user: null }, error: { message: 'invalid JWT' } };
};
mock.module(new URL('../../src/database/supabase.js', import.meta.url).href, {
    namedExports: { supabase: { auth: { getUser } }, crearClienteAuth: () => ({}) },
});
const verificarToken = (await import('../../src/middlewares/authMiddleware.js')).default;

function ejecutar(authorization) {
    const req = { headers: authorization === undefined ? {} : { authorization } };
    const salida = { siguio: false, respuesta: null };
    const res = { status: (codigo) => ({ json: (cuerpo) => { salida.respuesta = { codigo, ...cuerpo }; } }) };
    return verificarToken(req, res, () => { salida.siguio = true; }).then(() => ({ ...salida, req }));
}

test('sin header Authorization -> 401 y no consulta a Supabase', async () => {
    const antes = consultas.length;
    const r = await ejecutar(undefined);
    assert.equal(r.siguio, false);
    assert.deepEqual(r.respuesta, { codigo: 401, success: false, message: 'Acceso denegado. Token no provisto.' });
    assert.equal(consultas.length, antes);
});

test('header con otro esquema (Basic) -> 401', async () => {
    const r = await ejecutar('Basic abc');
    assert.equal(r.respuesta.codigo, 401);
    assert.equal(r.respuesta.message, 'Acceso denegado. Token no provisto.');
});

test('"bearer" en minúscula no se acepta (el formato es sensible a mayúsculas)', async () => {
    const r = await ejecutar('bearer ok-1');
    assert.equal(r.respuesta.codigo, 401);
});

test('token válido: guarda el usuario en req.user y llama a next', async () => {
    const r = await ejecutar('Bearer ok-uno');
    assert.equal(r.siguio, true);
    assert.equal(r.respuesta, null);
    assert.deepEqual(r.req.user, { id: 'u-ok-uno' });
});

test('token inválido -> 401 "Token inválido o expirado" y no se recuerda', async () => {
    const antes = consultas.length;
    let r = await ejecutar('Bearer malo');
    assert.equal(r.siguio, false);
    assert.deepEqual(r.respuesta, { codigo: 401, success: false, message: 'Token inválido o expirado' });
    r = await ejecutar('Bearer malo');
    assert.equal(r.respuesta.codigo, 401);
    assert.equal(consultas.length - antes, 2, 'un token inválido se vuelve a consultar cada vez');
});

test('token válido repetido: la segunda vez sale del caché, sin preguntar a Supabase', async () => {
    await ejecutar('Bearer ok-cache');
    const antes = consultas.length;
    const r = await ejecutar('Bearer ok-cache');
    assert.equal(r.siguio, true);
    assert.deepEqual(r.req.user, { id: 'u-ok-cache' });
    assert.equal(consultas.length, antes);
});

test('"Bearer " sin token: se consulta con cadena vacía y se rechaza', async () => {
    const r = await ejecutar('Bearer ');
    assert.equal(r.respuesta.codigo, 401);
    assert.equal(consultas.at(-1), '');
});

test('Supabase responde sin usuario (user null o data null) -> 401', async () => {
    modo = 'sinUsuario';
    let r = await ejecutar('Bearer ok-x1');
    assert.equal(r.respuesta.codigo, 401);
    modo = 'datosNulos';
    r = await ejecutar('Bearer ok-x2');
    assert.equal(r.respuesta.codigo, 401);
    modo = 'normal';
});

test('si Supabase lanza una excepción, verificarToken la propaga (rechaza la promesa)', async () => {
    modo = 'lanza';
    await assert.rejects(() => ejecutar('Bearer ok-x3'), /red caída/);
    modo = 'normal';
});
