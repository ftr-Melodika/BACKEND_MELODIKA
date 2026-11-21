import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const url = (ruta) => new URL(`../../src/${ruta}`, import.meta.url).href;

const invitacionFalso = {};
const amistadFalso = {};
const perfilServiceFalso = {};

mock.module(url('repositories/invitacionAmistadRepository.js'), {
    defaultExport: class { constructor() { return invitacionFalso; } },
});
mock.module(url('repositories/amistadRepository.js'), {
    defaultExport: class { constructor() { return amistadFalso; } },
});
mock.module(url('services/perfilService.js'), { defaultExport: perfilServiceFalso });

const { default: servicio } = await import(url('services/invitacionAmistadService.js'));

let llamadas;
beforeEach(() => {
    llamadas = [];
    for (const o of [invitacionFalso, amistadFalso, perfilServiceFalso]) {
        for (const k of Object.keys(o)) delete o[k];
    }
    perfilServiceFalso.validarAccesoPerfil = async (...a) => { llamadas.push(['acceso', ...a]); };
});

const rechaza = (promesa, mensaje) => assert.rejects(promesa, (e) => { assert.equal(e.message, mensaje); return true; });

test('obtenerMiInvitacion: si ya hay token activo lo reutiliza con su link', async () => {
    invitacionFalso.obtenerTokenActivo = async () => 'tokenviejo';
    invitacionFalso.crear = async () => { throw new Error('no debe crear'); };
    const r = await servicio.obtenerMiInvitacion('auth', 'P1');
    assert.deepEqual(r, { token: 'tokenviejo', url: 'melodika://invitar/tokenviejo' });
    assert.deepEqual(llamadas[0], ['acceso', 'auth', 'P1']);
});

test('obtenerMiInvitacion: si no hay token crea uno de 22 caracteres url-safe', async () => {
    invitacionFalso.obtenerTokenActivo = async () => null;
    invitacionFalso.crear = async (perfilId, token) => { llamadas.push(['crear', perfilId, token]); return token; };
    const r = await servicio.obtenerMiInvitacion('auth', 'P1');
    assert.match(r.token, /^[A-Za-z0-9_-]{22}$/);
    assert.equal(r.url, `melodika://invitar/${r.token}`);
    assert.deepEqual(llamadas.at(-1), ['crear', 'P1', r.token]);
});

test('obtenerMiInvitacion: si otro pedido creó el token primero, lee el vigente', async () => {
    let lecturas = 0;
    invitacionFalso.obtenerTokenActivo = async () => (lecturas++ === 0 ? null : 'ganador');
    invitacionFalso.crear = async () => null;
    const r = await servicio.obtenerMiInvitacion('auth', 'P1');
    assert.equal(r.token, 'ganador');
});

test('obtenerMiInvitacion: sin acceso al perfil no consulta tokens', async () => {
    perfilServiceFalso.validarAccesoPerfil = async () => { throw new Error('Acceso denegado al perfil'); };
    invitacionFalso.obtenerTokenActivo = async () => { throw new Error('no debe llamarse'); };
    await rechaza(servicio.obtenerMiInvitacion('auth', 'P1'), 'Acceso denegado al perfil');
});

test('regenerarInvitacion: reemplaza por un token nuevo y distinto cada vez', async () => {
    invitacionFalso.reemplazar = async (perfilId, token) => { llamadas.push(['reemplazar', perfilId, token]); return token; };
    const a = await servicio.regenerarInvitacion('auth', 'P1');
    const b = await servicio.regenerarInvitacion('auth', 'P1');
    assert.notEqual(a.token, b.token);
    assert.equal(a.url, `melodika://invitar/${a.token}`);
    assert.equal(llamadas.filter(l => l[0] === 'reemplazar')[0][1], 'P1');
});

test('regenerarInvitacion: si otra regeneración ganó, devuelve la vigente', async () => {
    invitacionFalso.reemplazar = async () => null;
    invitacionFalso.obtenerTokenActivo = async () => 'vigente';
    assert.equal((await servicio.regenerarInvitacion('auth', 'P1')).token, 'vigente');
});

test('obtenerDuenoDelToken: devuelve el dueño o falla si el token no vale', async () => {
    invitacionFalso.obtenerPerfilPorToken = async (t) => (t === 'ok' ? { id: 'P2' } : null);
    assert.deepEqual(await servicio.obtenerDuenoDelToken('ok'), { id: 'P2' });
    await rechaza(servicio.obtenerDuenoDelToken('malo'), 'Invitación no válida');
});

const dueno = { id: 'P2', nombre: 'Ana', username: 'ana', avatar_url: 'av', secreto: 'no' };

test('verInvitacion: link propio devuelve relación propia sin consultar amistades', async () => {
    invitacionFalso.obtenerPerfilPorToken = async () => ({ ...dueno, id: 'p1' });
    amistadFalso.obtenerEntre = async () => { throw new Error('no debe llamarse'); };
    const r = await servicio.verInvitacion('auth', 'P1', 'tok');
    assert.equal(r.esPropio, true);
    assert.deepEqual(r.relacion, { estado: 'propia', amistadId: null });
});

test('verInvitacion: de otro perfil expone solo datos públicos y la relación', async () => {
    invitacionFalso.obtenerPerfilPorToken = async () => dueno;
    amistadFalso.obtenerEntre = async (a, b) => { llamadas.push(['entre', a, b]); return { id: 9, estado: 'pendiente', perfil_1_id: 'P1' }; };
    const r = await servicio.verInvitacion('auth', 'P1', 'tok');
    assert.deepEqual(r.perfil, { id: 'P2', nombre: 'Ana', username: 'ana', avatarUrl: 'av' });
    assert.equal(r.esPropio, false);
    assert.deepEqual(r.relacion, { estado: 'enviada', amistadId: 9 });
    assert.deepEqual(llamadas.at(-1), ['entre', 'P1', 'P2']);
});

test('verInvitacion: token inválido', async () => {
    invitacionFalso.obtenerPerfilPorToken = async () => null;
    await rechaza(servicio.verInvitacion('auth', 'P1', 'x'), 'Invitación no válida');
});
