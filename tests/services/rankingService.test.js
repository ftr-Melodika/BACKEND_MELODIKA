import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const url = (ruta) => new URL(`../../src/${ruta}`, import.meta.url).href;

const rankingFalso = {};
const perfilServiceFalso = {};
const grupoServiceFalso = {};

mock.module(url('repositories/rankingRepository.js'), {
    defaultExport: class { constructor() { return rankingFalso; } },
});
mock.module(url('services/perfilService.js'), { defaultExport: perfilServiceFalso });
mock.module(url('services/grupoService.js'), { defaultExport: grupoServiceFalso });

const { default: servicio } = await import(url('services/rankingService.js'));

let llamadas;
beforeEach(() => {
    llamadas = [];
    for (const o of [rankingFalso, perfilServiceFalso, grupoServiceFalso]) {
        for (const k of Object.keys(o)) delete o[k];
    }
    perfilServiceFalso.validarAccesoPerfil = async (...a) => { llamadas.push(['acceso', ...a]); };
    perfilServiceFalso.reiniciarRachasVencidas = async () => { llamadas.push(['reiniciarRachas']); };
    grupoServiceFalso.exigirMembresia = async (...a) => { llamadas.push(['membresia', ...a]); };
});

const rechazaConEstado = (promesa, mensaje, estado) =>
    assert.rejects(promesa, (e) => { assert.equal(e.message, mensaje); assert.equal(e.status, estado); return true; });

test('listarMisRankings: da formato a las filas', async () => {
    rankingFalso.listarDePerfil = async (p) => { llamadas.push(['listar', p]); return [{ grupo_id: 'G1', grupo_nombre: 'Grupo', total_participantes: 4, mi_posicion: 2, otro: 'x' }]; };
    const r = await servicio.listarMisRankings('auth', 'P1');
    assert.deepEqual(r, [{ grupoId: 'G1', grupoNombre: 'Grupo', totalParticipantes: 4, miPosicion: 2 }]);
    assert.deepEqual(llamadas[0], ['acceso', 'auth', 'P1']);
});

test('obtenerRankingGrupo: exige membresía y, si no hay ranking, responde inactivo sin tocar rachas', async () => {
    rankingFalso.existe = async () => false;
    const r = await servicio.obtenerRankingGrupo('auth', 'P1', 'G1');
    assert.deepEqual(r, { activo: false, unido: false, participantes: [] });
    assert.deepEqual(llamadas.find(l => l[0] === 'membresia'), ['membresia', 'G1', 'P1']);
    assert.ok(!llamadas.some(l => l[0] === 'reiniciarRachas'));
});

test('obtenerRankingGrupo: con ranking reinicia rachas vencidas y marca si estoy unido', async () => {
    rankingFalso.existe = async () => true;
    rankingFalso.listarParticipantes = async () => { llamadas.push(['participantes']); return [{ id: 'p1' }, { id: 'P2' }]; };
    const r = await servicio.obtenerRankingGrupo('auth', 'P1', 'G1');
    assert.equal(r.activo, true);
    assert.equal(r.unido, true); // p1 vs P1 sin distinguir mayúsculas
    assert.equal(r.participantes.length, 2);
    const orden = llamadas.map(l => l[0]);
    assert.ok(orden.indexOf('reiniciarRachas') < orden.indexOf('participantes'));
});

test('obtenerRankingGrupo: invitado que aún no aceptó aparece como no unido', async () => {
    rankingFalso.existe = async () => true;
    rankingFalso.listarParticipantes = async () => [{ id: 'P2' }];
    assert.equal((await servicio.obtenerRankingGrupo('auth', 'P1', 'G1')).unido, false);
});

test('obtenerRankingGrupo: si no es miembro del grupo, el error de membresía se propaga', async () => {
    grupoServiceFalso.exigirMembresia = async () => { throw new Error('No sos miembro de este grupo'); };
    rankingFalso.existe = async () => { throw new Error('no debe llamarse'); };
    await assert.rejects(servicio.obtenerRankingGrupo('auth', 'P1', 'G1'), { message: 'No sos miembro de este grupo' });
});

test('invitar: crea el ranking y devuelve el detalle', async () => {
    rankingFalso.crearConInvitacion = async (g, p) => { llamadas.push(['crear', g, p]); return true; };
    rankingFalso.existe = async () => true;
    rankingFalso.listarParticipantes = async () => [{ id: 'P1' }];
    const r = await servicio.invitar('auth', 'P1', 'G1');
    assert.deepEqual(llamadas.find(l => l[0] === 'crear'), ['crear', 'G1', 'P1']);
    assert.equal(r.activo, true);
});

test('invitar: si el grupo ya tiene ranking responde 409', async () => {
    rankingFalso.crearConInvitacion = async () => false;
    await rechazaConEstado(servicio.invitar('auth', 'P1', 'G1'), 'El grupo ya tiene un ranking', 409);
});

test('aceptar: sin ranking responde 404 y no agrega participante', async () => {
    rankingFalso.existe = async () => false;
    rankingFalso.agregarParticipante = async () => { throw new Error('no debe llamarse'); };
    await rechazaConEstado(servicio.aceptar('auth', 'P1', 'G1'), 'El grupo todavía no tiene un ranking', 404);
});

test('aceptar: agrega al participante y devuelve el detalle', async () => {
    rankingFalso.existe = async () => true;
    rankingFalso.agregarParticipante = async (g, p) => { llamadas.push(['agregar', g, p]); };
    rankingFalso.listarParticipantes = async () => [{ id: 'P1' }];
    const r = await servicio.aceptar('auth', 'P1', 'G1');
    assert.deepEqual(llamadas.find(l => l[0] === 'agregar'), ['agregar', 'G1', 'P1']);
    assert.equal(r.unido, true);
});

test('salir: exige membresía y quita al participante', async () => {
    rankingFalso.quitarParticipante = async (g, p) => { llamadas.push(['quitar', g, p]); };
    assert.deepEqual(await servicio.salir('auth', 'P1', 'G1'), { grupoId: 'G1', unido: false });
    assert.deepEqual(llamadas.find(l => l[0] === 'quitar'), ['quitar', 'G1', 'P1']);
    assert.deepEqual(llamadas.find(l => l[0] === 'membresia'), ['membresia', 'G1', 'P1']);
});

test('todas las operaciones validan primero el acceso al perfil', async () => {
    perfilServiceFalso.validarAccesoPerfil = async () => { throw new Error('Acceso denegado al perfil'); };
    for (const op of ['listarMisRankings', 'obtenerRankingGrupo', 'invitar', 'aceptar', 'salir']) {
        await assert.rejects(servicio[op]('auth', 'P1', 'G1'), { message: 'Acceso denegado al perfil' }, op);
    }
});
