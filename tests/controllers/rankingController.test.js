import { test, mock, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as h from '../_ayudas/appControlador.js';

const servicio = h.servicioFalso(['listarMisRankings', 'obtenerRankingGrupo', 'invitar', 'aceptar', 'salir']);
h.mockearModulo(mock, 'services/rankingService.js', { defaultExport: servicio });
h.mockearSupabase(mock);
const router = (await import(h.rutaSrc('controllers/rankingController.js'))).default;
let app;
before(async () => { app = await h.levantarApp('/api/perfiles', router); });
after(() => app.cerrar());

const P = h.PERFIL_ID;
const G = h.GRUPO_ID;
const llamada = (m) => servicio[m].mock.calls.at(-1).arguments;
const responder = (m, v) => servicio[m].mock.mockImplementationOnce(async () => v);
const fallar = (m, e) => servicio[m].mock.mockImplementationOnce(async () => { throw e; });

test('GET :id/rankings: lista mis rankings', async () => {
    responder('listarMisRankings', [{ grupoId: G }]);
    const r = await app.pedir('GET', `/api/perfiles/${P}/rankings`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { success: true, message: 'Rankings obtenidos correctamente.', data: [{ grupoId: G }] });
    assert.deepEqual(llamada('listarMisRankings'), [h.USUARIO.id, P]);
});

test('GET :id/grupos/:grupoId/ranking: ranking del grupo', async () => {
    responder('obtenerRankingGrupo', { activo: false });
    const r = await app.pedir('GET', `/api/perfiles/${P}/grupos/${G}/ranking`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.data, { activo: false });
    assert.equal(r.json.message, 'Ranking obtenido correctamente.');
    assert.deepEqual(llamada('obtenerRankingGrupo'), [h.USUARIO.id, P, G]);
});

test('POST :id/grupos/:grupoId/ranking: invita -> 201', async () => {
    responder('invitar', { creado: true });
    const r = await app.pedir('POST', `/api/perfiles/${P}/grupos/${G}/ranking`);
    assert.equal(r.status, 201);
    assert.deepEqual(r.json, { success: true, message: 'Ranking creado e invitación enviada al grupo.', data: { creado: true } });
    assert.deepEqual(llamada('invitar'), [h.USUARIO.id, P, G]);
});

test('POST .../ranking/aceptar -> 200', async () => {
    responder('aceptar', { unido: true });
    const r = await app.pedir('POST', `/api/perfiles/${P}/grupos/${G}/ranking/aceptar`);
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'Te sumaste al ranking.');
    assert.deepEqual(llamada('aceptar'), [h.USUARIO.id, P, G]);
});

test('DELETE .../ranking/salir -> 200', async () => {
    responder('salir', { ok: true });
    const r = await app.pedir('DELETE', `/api/perfiles/${P}/grupos/${G}/ranking/salir`);
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'Saliste del ranking.');
    assert.deepEqual(llamada('salir'), [h.USUARIO.id, P, G]);
});

test('errores de negocio salen por mapRankingError (no por el de grupos)', async () => {
    fallar('invitar', new Error('El grupo ya tiene un ranking'));
    let r = await app.pedir('POST', `/api/perfiles/${P}/grupos/${G}/ranking`);
    assert.equal(r.status, 409);
    fallar('obtenerRankingGrupo', new Error('El grupo todavía no tiene un ranking'));
    r = await app.pedir('GET', `/api/perfiles/${P}/grupos/${G}/ranking`);
    assert.equal(r.status, 404);
    fallar('obtenerRankingGrupo', new Error('No sos miembro de este grupo'));
    r = await app.pedir('GET', `/api/perfiles/${P}/grupos/${G}/ranking`);
    assert.equal(r.status, 403);
    fallar('listarMisRankings', new Error('Acceso denegado al perfil'));
    r = await app.pedir('GET', `/api/perfiles/${P}/rankings`);
    assert.equal(r.status, 403);
    fallar('aceptar', new Error('algo raro'));
    r = await app.pedir('POST', `/api/perfiles/${P}/grupos/${G}/ranking/aceptar`);
    assert.equal(r.status, 500);
    assert.equal(r.json.message, 'Hubo un error interno en el servidor');
});

test('IDs inválidos -> 400 sin llamar al service', async () => {
    const antes = servicio.obtenerRankingGrupo.mock.callCount();
    let r = await app.pedir('GET', `/api/perfiles/nada/grupos/${G}/ranking`);
    assert.equal(r.status, 400);
    r = await app.pedir('GET', `/api/perfiles/${P}/grupos/nada/ranking`);
    assert.equal(r.status, 400);
    assert.equal(r.json.message, 'El formato del ID del grupo no es válido.');
    assert.equal(servicio.obtenerRankingGrupo.mock.callCount(), antes);
});

test('todas las rutas piden token -> 401', async () => {
    const rutas = [
        ['GET', `/${P}/rankings`], ['GET', `/${P}/grupos/${G}/ranking`], ['POST', `/${P}/grupos/${G}/ranking`],
        ['POST', `/${P}/grupos/${G}/ranking/aceptar`], ['DELETE', `/${P}/grupos/${G}/ranking/salir`],
    ];
    for (const [m, ruta] of rutas) {
        const r = await app.pedir(m, `/api/perfiles${ruta}`, { token: null });
        assert.equal(r.status, 401, `${m} ${ruta}`);
    }
});
