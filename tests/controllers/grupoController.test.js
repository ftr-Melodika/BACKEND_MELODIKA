import { test, mock, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as h from '../_ayudas/appControlador.js';

const servicio = h.servicioFalso(['listarMisGrupos', 'buscarGrupos', 'crearGrupo', 'obtenerGrupo', 'unirseConCodigo', 'unirse', 'salir', 'listarMensajes', 'enviarMensaje']);
h.mockearModulo(mock, 'services/grupoService.js', { defaultExport: servicio });
h.mockearSupabase(mock);
const router = (await import(h.rutaSrc('controllers/grupoController.js'))).default;
let app;
before(async () => { app = await h.levantarApp('/api/perfiles', router); });
after(() => app.cerrar());

const P = h.PERFIL_ID;
const G = h.GRUPO_ID;
const base = `/api/perfiles/${P}/grupos`;
const llamada = (m) => servicio[m].mock.calls.at(-1).arguments;
const responder = (m, v) => servicio[m].mock.mockImplementationOnce(async () => v);
const fallar = (m, e) => servicio[m].mock.mockImplementationOnce(async () => { throw e; });

test('GET grupos/mios: no se confunde con :grupoId', async () => {
    responder('listarMisGrupos', [{ id: G }]);
    const r = await app.pedir('GET', `${base}/mios`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { success: true, message: 'Grupos obtenidos correctamente.', data: [{ id: G }] });
    assert.deepEqual(llamada('listarMisGrupos'), [h.USUARIO.id, P]);
});

test('GET grupos/buscar?q=: el texto se recorta y llega al service', async () => {
    responder('buscarGrupos', []);
    const r = await app.pedir('GET', `${base}/buscar?q=%20rock%20`);
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'Búsqueda realizada correctamente.');
    assert.deepEqual(llamada('buscarGrupos'), [h.USUARIO.id, P, 'rock']);
});

test('GET grupos/buscar sin q -> texto vacío', async () => {
    await app.pedir('GET', `${base}/buscar`);
    assert.equal(llamada('buscarGrupos')[2], '');
});

test('GET grupos/buscar con q demasiado largo -> 400', async () => {
    const r = await app.pedir('GET', `${base}/buscar?q=${'a'.repeat(101)}`);
    assert.equal(r.status, 400);
    assert.equal(r.json.message, 'El texto de búsqueda no es válido.');
});

test('POST grupos: crea (201) con los datos normalizados por el validador', async () => {
    responder('crearGrupo', { id: G });
    const r = await app.pedir('POST', base, { body: { nombre: '  Los Rockeros ', descripcion: '  hola ', miembroIds: [h.OTRO_ID.toUpperCase()], esPrivado: true } });
    assert.equal(r.status, 201);
    assert.deepEqual(r.json, { success: true, message: 'Grupo creado.', data: { id: G } });
    assert.deepEqual(llamada('crearGrupo'), [h.USUARIO.id, P, 'Los Rockeros', 'hola', [h.OTRO_ID], true]);
});

test('POST grupos: mínimos -> descripcion null, miembroIds [] y esPrivado false', async () => {
    await app.pedir('POST', base, { body: { nombre: 'Grupo' } });
    assert.deepEqual(llamada('crearGrupo'), [h.USUARIO.id, P, 'Grupo', null, [], false]);
});

test('POST grupos: datos inválidos -> 400 sin llamar al service', async () => {
    const antes = servicio.crearGrupo.mock.callCount();
    const casos = [
        [{}, 'El nombre del grupo es obligatorio.'],
        [{ nombre: 'ab' }, 'El nombre del grupo debe tener entre 3 y 50 caracteres.'],
        [{ nombre: 'Grupo', esPrivado: 'si' }, 'esPrivado debe ser verdadero o falso.'],
        [{ nombre: 'Grupo', descripcion: 'x'.repeat(201) }, 'La descripción puede tener hasta 200 caracteres.'],
        [{ nombre: 'Grupo', miembroIds: 'x' }, 'miembroIds debe ser una lista de IDs de perfil.'],
        [{ nombre: 'Grupo', miembroIds: ['no-uuid'] }, 'Alguno de los integrantes elegidos no tiene un ID válido.'],
        [{ nombre: 'Grupo', miembroIds: [h.OTRO_ID, h.OTRO_ID] }, 'Hay integrantes repetidos en la lista.'],
        [{ nombre: 'Grupo', miembroIds: [P] }, 'No hace falta agregarte: ya sos parte del grupo como creador.'],
    ];
    for (const [body, mensaje] of casos) {
        const r = await app.pedir('POST', base, { body });
        assert.equal(r.status, 400, mensaje);
        assert.equal(r.json.message, mensaje);
    }
    assert.equal(servicio.crearGrupo.mock.callCount(), antes);
});

test('POST grupos: nombre repetido (23505) -> 409 por mapGrupoError', async () => {
    fallar('crearGrupo', Object.assign(new Error('dup'), { code: '23505' }));
    const r = await app.pedir('POST', base, { body: { nombre: 'Grupo' } });
    assert.equal(r.status, 409);
    assert.equal(r.json.message, 'Ya existe un grupo con ese nombre. Elegí otro.');
});

test('POST grupos: "Solo podés agregar a tus amigos" -> 400', async () => {
    fallar('crearGrupo', new Error('Solo podés agregar a tus amigos'));
    const r = await app.pedir('POST', base, { body: { nombre: 'Grupo' } });
    assert.equal(r.status, 400);
});

test('GET grupos/:grupoId: detalle', async () => {
    responder('obtenerGrupo', { id: G });
    const r = await app.pedir('GET', `${base}/${G}`);
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'Grupo obtenido correctamente.');
    assert.deepEqual(llamada('obtenerGrupo'), [h.USUARIO.id, P, G]);
});

test('GET grupos/:grupoId: ID inválido -> 400; grupo inexistente -> 404', async () => {
    let r = await app.pedir('GET', `${base}/zzz`);
    assert.equal(r.status, 400);
    assert.equal(r.json.message, 'El formato del ID del grupo no es válido.');
    fallar('obtenerGrupo', new Error('Grupo no encontrado'));
    r = await app.pedir('GET', `${base}/${G}`);
    assert.equal(r.status, 404);
    assert.equal(r.json.message, 'No encontramos ese grupo.');
});

test('POST grupos/unirse-con-codigo: código válido llega al service', async () => {
    responder('unirseConCodigo', { id: G });
    const r = await app.pedir('POST', `${base}/unirse-con-codigo`, { body: { codigo: 'AbC12345' } });
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'Te uniste al grupo.');
    assert.deepEqual(llamada('unirseConCodigo'), [h.USUARIO.id, P, 'AbC12345']);
});

test('POST grupos/unirse-con-codigo: código faltante o mal formado -> 400', async () => {
    for (const body of [{}, { codigo: 'corto' }, { codigo: 'ABC 1234' }, { codigo: 12345678 }]) {
        const r = await app.pedir('POST', `${base}/unirse-con-codigo`, { body });
        assert.equal(r.status, 400);
        assert.equal(r.json.message, 'El código tiene 8 letras o números, sin espacios.');
    }
});

test('POST grupos/unirse-con-codigo: código incorrecto -> 403', async () => {
    fallar('unirseConCodigo', new Error('Código de grupo incorrecto'));
    const r = await app.pedir('POST', `${base}/unirse-con-codigo`, { body: { codigo: 'AbC12345' } });
    assert.equal(r.status, 403);
});

test('POST grupos/:grupoId/unirse: sin código -> null; con código lo pasa', async () => {
    let r = await app.pedir('POST', `${base}/${G}/unirse`);
    assert.equal(r.status, 200);
    assert.deepEqual(llamada('unirse'), [h.USUARIO.id, P, G, null]);
    r = await app.pedir('POST', `${base}/${G}/unirse`, { body: { codigo: 'AbC12345' } });
    assert.deepEqual(llamada('unirse').at(-1), 'AbC12345');
});

test('POST grupos/:grupoId/unirse: código mal formado -> 400; grupo privado sin código -> 403', async () => {
    let r = await app.pedir('POST', `${base}/${G}/unirse`, { body: { codigo: 'x' } });
    assert.equal(r.status, 400);
    fallar('unirse', new Error('El grupo es privado'));
    r = await app.pedir('POST', `${base}/${G}/unirse`);
    assert.equal(r.status, 403);
});

test('DELETE grupos/:grupoId/salir', async () => {
    responder('salir', { ok: true });
    const r = await app.pedir('DELETE', `${base}/${G}/salir`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { success: true, message: 'Saliste del grupo.', data: { ok: true } });
    assert.deepEqual(llamada('salir'), [h.USUARIO.id, P, G]);
});

test('GET mensajes: sin query usa límite 50; con limit lo pasa, tope 100', async () => {
    responder('listarMensajes', []);
    let r = await app.pedir('GET', `${base}/${G}/mensajes`);
    assert.equal(r.status, 200);
    assert.deepEqual(llamada('listarMensajes'), [h.USUARIO.id, P, G, { limite: 50, despues: null, antes: null }]);
    await app.pedir('GET', `${base}/${G}/mensajes?limit=500&antes=${h.OTRO_ID}`);
    assert.deepEqual(llamada('listarMensajes')[3], { limite: 100, despues: null, antes: h.OTRO_ID });
});

test('GET mensajes: limit inválido, despues+antes juntos o cursor inválido -> 400', async () => {
    const urls = [
        [`?limit=0`, 'El límite debe ser un número mayor a cero.'],
        [`?limit=abc`, 'El límite debe ser un número mayor a cero.'],
        [`?despues=${h.OTRO_ID}&antes=${h.OTRO_ID}`, "No se puede usar 'despues' y 'antes' a la vez."],
        [`?despues=nada`, 'El formato del ID del mensaje no es válido.'],
    ];
    for (const [q, mensaje] of urls) {
        const r = await app.pedir('GET', `${base}/${G}/mensajes${q}`);
        assert.equal(r.status, 400, q);
        assert.equal(r.json.message, mensaje);
    }
});

test('GET mensajes: no ser miembro -> 403', async () => {
    fallar('listarMensajes', new Error('No sos miembro de este grupo'));
    const r = await app.pedir('GET', `${base}/${G}/mensajes`);
    assert.equal(r.status, 403);
});

test('POST mensajes: 201 con el contenido recortado', async () => {
    responder('enviarMensaje', { id: 'm1' });
    const r = await app.pedir('POST', `${base}/${G}/mensajes`, { body: { contenido: '  hola  ' } });
    assert.equal(r.status, 201);
    assert.deepEqual(r.json, { success: true, message: 'Mensaje enviado.', data: { id: 'm1' } });
    assert.deepEqual(llamada('enviarMensaje'), [h.USUARIO.id, P, G, 'hola']);
});

test('POST mensajes: vacío, no texto o muy largo -> 400', async () => {
    for (const contenido of ['   ', 5, 'a'.repeat(1001), undefined]) {
        const r = await app.pedir('POST', `${base}/${G}/mensajes`, { body: { contenido } });
        assert.equal(r.status, 400);
    }
});

test('perfil ajeno (Acceso denegado al perfil) -> 403 y perfil eliminado -> 400', async () => {
    fallar('listarMisGrupos', new Error('Acceso denegado al perfil'));
    let r = await app.pedir('GET', `${base}/mios`);
    assert.equal(r.status, 403);
    fallar('listarMisGrupos', new Error('El perfil se encuentra eliminado'));
    r = await app.pedir('GET', `${base}/mios`);
    assert.equal(r.status, 400);
});

test('error desconocido -> 500 genérico', async () => {
    fallar('listarMisGrupos', new Error('boom interno'));
    const r = await app.pedir('GET', `${base}/mios`);
    assert.equal(r.status, 500);
    assert.equal(r.json.message, 'Hubo un error interno en el servidor');
});

test('ID de perfil inválido -> 400 y sin token -> 401 en todas las rutas', async () => {
    let r = await app.pedir('GET', '/api/perfiles/nada/grupos/mios');
    assert.equal(r.status, 400);
    const rutas = [
        ['GET', '/mios'], ['GET', '/buscar'], ['POST', ''], ['GET', `/${G}`], ['POST', '/unirse-con-codigo'],
        ['POST', `/${G}/unirse`], ['DELETE', `/${G}/salir`], ['GET', `/${G}/mensajes`], ['POST', `/${G}/mensajes`],
    ];
    for (const [m, ruta] of rutas) {
        r = await app.pedir(m, base + ruta, { token: null });
        assert.equal(r.status, 401, `${m} ${ruta}`);
    }
});
