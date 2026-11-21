import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const url = (ruta) => new URL(`../../src/${ruta}`, import.meta.url).href;

const CODIGO_REPETIDO = Symbol('CODIGO_REPETIDO');
const grupoFalso = {};
const amistadFalso = {};
const perfilServiceFalso = {};

mock.module(url('repositories/grupoRepository.js'), {
    defaultExport: class { constructor() { return grupoFalso; } },
    namedExports: { CODIGO_REPETIDO },
});
mock.module(url('repositories/amistadRepository.js'), {
    defaultExport: class { constructor() { return amistadFalso; } },
});
mock.module(url('services/perfilService.js'), { defaultExport: perfilServiceFalso });

const { default: servicio } = await import(url('services/grupoService.js'));
const { esCodigoGrupoValido } = await import(url('helpers/codigoGrupo.js'));

let llamadas;
beforeEach(() => {
    llamadas = [];
    for (const o of [grupoFalso, amistadFalso, perfilServiceFalso]) {
        for (const k of Object.keys(o)) delete o[k];
    }
    perfilServiceFalso.validarAccesoPerfil = async (...a) => { llamadas.push(['acceso', ...a]); return { perfilExistente: { nombre: 'Yo', username: 'yo' } }; };
});

const rechaza = (promesa, mensaje) => assert.rejects(promesa, (e) => { assert.equal(e.message, mensaje); return true; });

const filaGrupo = (extra = {}) => ({
    id: 'G1', nombre: 'Grupo', descripcion: 'desc', total_miembros: 3, creador_id: 'P1',
    es_privado: false, codigo: 'AbC12345', unido: true, ...extra,
});

test('listarMisGrupos: da formato y arma el último mensaje solo si existe', async () => {
    grupoFalso.listarDePerfil = async () => [
        { id: 'G1', nombre: 'A', descripcion: 'd', total_miembros: 2, creador_id: 'p1', es_privado: true, ultimo_created_at: 'f', ultimo_contenido: 'hola', ultimo_remitente_nombre: 'Ana' },
        { id: 'G2', nombre: 'B', descripcion: 'd', total_miembros: 1, creador_id: 'P9', es_privado: false, ultimo_created_at: null },
    ];
    const r = await servicio.listarMisGrupos('auth', 'P1');
    assert.equal(r[0].esCreador, true);
    assert.deepEqual(r[0].ultimoMensaje, { contenido: 'hola', createdAt: 'f', remitenteNombre: 'Ana' });
    assert.equal(r[1].esCreador, false);
    assert.equal(r[1].ultimoMensaje, null);
    assert.deepEqual(llamadas[0], ['acceso', 'auth', 'P1']);
});

test('buscarGrupos: pasa el texto al repositorio y no expone el código ni el creador', async () => {
    grupoFalso.buscar = async (p, t) => { llamadas.push(['buscar', p, t]); return [filaGrupo({ unido: false })]; };
    const r = await servicio.buscarGrupos('auth', 'P1', 'gru');
    assert.deepEqual(llamadas.at(-1), ['buscar', 'P1', 'gru']);
    assert.deepEqual(r, [{ id: 'G1', nombre: 'Grupo', descripcion: 'desc', totalMiembros: 3, esPrivado: false, unido: false }]);
});

test('crearGrupo: grupo público sin código y con detalle del grupo', async () => {
    grupoFalso.crear = async (...a) => { llamadas.push(['crear', ...a]); return 'G1'; };
    grupoFalso.obtenerPorId = async () => filaGrupo();
    grupoFalso.listarMiembros = async () => [{ id: 'P1' }];
    const r = await servicio.crearGrupo('auth', 'P1', 'Grupo', 'desc');
    assert.deepEqual(llamadas.find(l => l[0] === 'crear'), ['crear', 'P1', 'Grupo', 'desc', [], null]);
    assert.equal(r.esCreador, true);
    assert.equal(r.codigo, 'AbC12345');
    assert.deepEqual(r.miembros, [{ id: 'P1' }]);
});

test('crearGrupo: grupo privado genera un código válido de 8 caracteres', async () => {
    let codigoUsado;
    grupoFalso.crear = async (p, n, d, m, codigo) => { codigoUsado = codigo; return 'G1'; };
    grupoFalso.obtenerPorId = async () => filaGrupo({ es_privado: true });
    grupoFalso.listarMiembros = async () => [];
    await servicio.crearGrupo('auth', 'P1', 'G', 'd', [], true);
    assert.ok(esCodigoGrupoValido(codigoUsado));
});

test('crearGrupo: reintenta con otro código si el primero está repetido y se rinde tras 3 intentos', async () => {
    const codigos = [];
    grupoFalso.crear = async (p, n, d, m, codigo) => { codigos.push(codigo); return codigos.length < 2 ? CODIGO_REPETIDO : 'G1'; };
    grupoFalso.obtenerPorId = async () => filaGrupo({ es_privado: true });
    grupoFalso.listarMiembros = async () => [];
    await servicio.crearGrupo('auth', 'P1', 'G', 'd', [], true);
    assert.equal(codigos.length, 2);

    codigos.length = 0;
    grupoFalso.crear = async (p, n, d, m, codigo) => { codigos.push(codigo); return CODIGO_REPETIDO; };
    await rechaza(servicio.crearGrupo('auth', 'P1', 'G', 'd', [], true), 'No se pudo generar el código del grupo');
    assert.equal(codigos.length, 3);
});

test('crearGrupo: nombre repetido (el repositorio devuelve vacío)', async () => {
    grupoFalso.crear = async () => null;
    await rechaza(servicio.crearGrupo('auth', 'P1', 'G', 'd'), 'Ya existe un grupo con ese nombre');
});

test('crearGrupo: solo se pueden agregar amigos', async () => {
    grupoFalso.crear = async () => { throw new Error('no debe crear'); };
    amistadFalso.filtrarAmigos = async (p, ids) => { llamadas.push(['filtrar', p, ids]); return ['A']; };
    await rechaza(servicio.crearGrupo('auth', 'P1', 'G', 'd', ['A', 'B']), 'Solo podés agregar a tus amigos');
    assert.deepEqual(llamadas.at(-1), ['filtrar', 'P1', ['A', 'B']]);
});

test('crearGrupo: con todos amigos pasa los miembros al repositorio', async () => {
    amistadFalso.filtrarAmigos = async (p, ids) => ids;
    grupoFalso.crear = async (p, n, d, m) => { llamadas.push(['crear', m]); return 'G1'; };
    grupoFalso.obtenerPorId = async () => filaGrupo();
    grupoFalso.listarMiembros = async () => [];
    await servicio.crearGrupo('auth', 'P1', 'G', 'd', ['A', 'B']);
    assert.deepEqual(llamadas.find(l => l[0] === 'crear')[1], ['A', 'B']);
});

test('obtenerGrupo: un no miembro no ve código ni miembros; un miembro sí', async () => {
    grupoFalso.listarMiembros = async () => { llamadas.push(['miembros']); return [{ id: 'P1' }]; };
    grupoFalso.obtenerPorId = async () => filaGrupo({ unido: false, creador_id: 'P9' });
    const afuera = await servicio.obtenerGrupo('auth', 'P1', 'G1');
    assert.equal(afuera.codigo, null);
    assert.deepEqual(afuera.miembros, []);
    assert.equal(afuera.esCreador, false);
    assert.ok(!llamadas.some(l => l[0] === 'miembros'));

    grupoFalso.obtenerPorId = async () => filaGrupo({ unido: true });
    const adentro = await servicio.obtenerGrupo('auth', 'P1', 'G1');
    assert.equal(adentro.codigo, 'AbC12345');
    assert.equal(adentro.miembros.length, 1);
});

test('obtenerGrupo: grupo inexistente', async () => {
    grupoFalso.obtenerPorId = async () => null;
    await rechaza(servicio.obtenerGrupo('auth', 'P1', 'G1'), 'Grupo no encontrado');
});

const prepararUnirse = (fila) => {
    grupoFalso.obtenerPorId = async () => fila;
    grupoFalso.agregarMiembro = async (g, p) => { llamadas.push(['agregar', g, p]); };
    grupoFalso.listarMiembros = async () => [];
};

test('unirse: grupo público entra sin código', async () => {
    prepararUnirse(filaGrupo({ unido: false }));
    const r = await servicio.unirse('auth', 'P1', 'G1');
    assert.equal(r.unido, true);
    assert.equal(r.grupoId, 'G1');
    assert.deepEqual(llamadas.find(l => l[0] === 'agregar'), ['agregar', 'G1', 'P1']);
});

test('unirse: grupo privado exige código exacto (distingue mayúsculas)', async () => {
    prepararUnirse(filaGrupo({ unido: false, es_privado: true }));
    await rechaza(servicio.unirse('auth', 'P1', 'G1'), 'El grupo es privado');
    await rechaza(servicio.unirse('auth', 'P1', 'G1', 'abc12345'), 'Código de grupo incorrecto');
    assert.ok(!llamadas.some(l => l[0] === 'agregar'));
    const r = await servicio.unirse('auth', 'P1', 'G1', 'AbC12345');
    assert.equal(r.unido, true);
});

test('unirse: un miembro de grupo privado no necesita código', async () => {
    prepararUnirse(filaGrupo({ unido: true, es_privado: true }));
    const r = await servicio.unirse('auth', 'P1', 'G1');
    assert.equal(r.unido, true);
});

test('unirseConCodigo: código válido y código inexistente', async () => {
    grupoFalso.obtenerIdPorCodigo = async (c) => (c === 'AbC12345' ? 'G1' : null);
    grupoFalso.agregarMiembro = async (g, p) => { llamadas.push(['agregar', g, p]); };
    grupoFalso.obtenerPorId = async () => filaGrupo();
    grupoFalso.listarMiembros = async () => [];
    const r = await servicio.unirseConCodigo('auth', 'P1', 'AbC12345');
    assert.equal(r.grupoId, 'G1');
    assert.deepEqual(llamadas.find(l => l[0] === 'agregar'), ['agregar', 'G1', 'P1']);
    await rechaza(servicio.unirseConCodigo('auth', 'P1', 'xxxxxxxx'), 'Código de grupo incorrecto');
});

test('salir: quita al miembro; grupo inexistente falla', async () => {
    grupoFalso.obtenerPorId = async () => filaGrupo();
    grupoFalso.quitarMiembro = async (g, p) => { llamadas.push(['quitar', g, p]); };
    assert.deepEqual(await servicio.salir('auth', 'P1', 'G1'), { grupoId: 'G1', unido: false });
    assert.deepEqual(llamadas.at(-1), ['quitar', 'G1', 'P1']);
    grupoFalso.obtenerPorId = async () => null;
    await rechaza(servicio.salir('auth', 'P1', 'G1'), 'Grupo no encontrado');
});

test('exigirMembresia: miembro pasa, no miembro y grupo inexistente fallan', async () => {
    grupoFalso.obtenerPorId = async () => filaGrupo({ unido: true });
    await servicio.exigirMembresia('G1', 'P1');
    grupoFalso.obtenerPorId = async () => filaGrupo({ unido: false });
    await rechaza(servicio.exigirMembresia('G1', 'P1'), 'No sos miembro de este grupo');
    grupoFalso.obtenerPorId = async () => null;
    await rechaza(servicio.exigirMembresia('G1', 'P1'), 'Grupo no encontrado');
});

const mensajeFila = (id, remitente = 'P2') => ({
    id, tipo: 'texto', contenido: `m${id}`, created_at: `t${id}`,
    remitente_id: remitente, remitente_nombre: 'N', remitente_username: 'u',
});

test('listarMensajes: no miembro no puede leer', async () => {
    grupoFalso.obtenerPorId = async () => filaGrupo({ unido: false });
    grupoFalso.listarMensajesRecientes = async () => { throw new Error('no debe llamarse'); };
    await rechaza(servicio.listarMensajes('auth', 'P1', 'G1', { limite: 10 }), 'No sos miembro de este grupo');
});

test('listarMensajes: recientes piden uno de más, devuelven en orden cronológico y marcan esMio', async () => {
    grupoFalso.obtenerPorId = async () => filaGrupo();
    grupoFalso.listarMensajesRecientes = async (g, limite, antes) => {
        llamadas.push(['recientes', g, limite, antes]);
        return [mensajeFila(3, 'p1'), mensajeFila(2), mensajeFila(1)]; // de más nuevo a más viejo
    };
    const r = await servicio.listarMensajes('auth', 'P1', 'G1', { limite: 2 });
    assert.deepEqual(llamadas.at(-1), ['recientes', 'G1', 3, undefined]);
    assert.deepEqual(r.mensajes.map(m => m.id), [2, 3]);
    assert.equal(r.hayMasAnteriores, true);
    assert.equal(r.mensajes[1].esMio, true);
    assert.equal(r.mensajes[0].esMio, false);
    assert.ok(!('avatarUrl' in r.mensajes[0].remitente));
});

test('listarMensajes: sin más anteriores y con mensaje remitente nulo', async () => {
    grupoFalso.obtenerPorId = async () => filaGrupo();
    grupoFalso.listarMensajesRecientes = async () => [{ ...mensajeFila(1), remitente_id: null }];
    const r = await servicio.listarMensajes('auth', 'P1', 'G1', { limite: 5 });
    assert.equal(r.hayMasAnteriores, false);
    assert.equal(r.mensajes[0].remitente, null);
    assert.equal(r.mensajes[0].esMio, false);
});

test('listarMensajes: con "antes" valida que el mensaje exista en el grupo', async () => {
    grupoFalso.obtenerPorId = async () => filaGrupo();
    grupoFalso.existeMensaje = async (g, m) => { llamadas.push(['existe', g, m]); return false; };
    await rechaza(servicio.listarMensajes('auth', 'P1', 'G1', { limite: 5, antes: 'M9' }), 'Mensaje no encontrado');
    assert.deepEqual(llamadas.at(-1), ['existe', 'G1', 'M9']);

    grupoFalso.existeMensaje = async () => true;
    grupoFalso.listarMensajesRecientes = async (g, l, antes) => { llamadas.push(['recientes', l, antes]); return []; };
    await servicio.listarMensajes('auth', 'P1', 'G1', { limite: 5, antes: 'M9' });
    assert.deepEqual(llamadas.at(-1), ['recientes', 6, 'M9']);
});

test('listarMensajes: con "despues" trae los posteriores e indica si hay anteriores', async () => {
    grupoFalso.obtenerPorId = async () => filaGrupo();
    grupoFalso.existeMensaje = async () => true;
    grupoFalso.listarMensajesPosteriores = async (g, limite, despues) => { llamadas.push(['post', g, limite, despues]); return [mensajeFila(5)]; };
    grupoFalso.listarMensajesRecientes = async (g, limite, despues) => { llamadas.push(['ant', g, limite, despues]); return [mensajeFila(4)]; };
    const r = await servicio.listarMensajes('auth', 'P1', 'G1', { limite: 10, despues: 'M4' });
    assert.deepEqual(r.mensajes.map(m => m.id), [5]);
    assert.equal(r.hayMasAnteriores, true);
    assert.deepEqual(llamadas.find(l => l[0] === 'post'), ['post', 'G1', 10, 'M4']);
    assert.deepEqual(llamadas.find(l => l[0] === 'ant'), ['ant', 'G1', 1, 'M4']);
});

test('listarMensajes: "despues" con mensaje inexistente falla', async () => {
    grupoFalso.obtenerPorId = async () => filaGrupo();
    grupoFalso.existeMensaje = async () => false;
    await rechaza(servicio.listarMensajes('auth', 'P1', 'G1', { limite: 10, despues: 'X' }), 'Mensaje no encontrado');
});

test('enviarMensaje: solo miembros; completa remitente con el perfil validado', async () => {
    grupoFalso.obtenerPorId = async () => filaGrupo({ unido: false });
    await rechaza(servicio.enviarMensaje('auth', 'P1', 'G1', 'hola'), 'No sos miembro de este grupo');

    grupoFalso.obtenerPorId = async () => filaGrupo();
    grupoFalso.crearMensaje = async (g, p, c) => { llamadas.push(['msg', g, p, c]); return { id: 1, tipo: 'texto', contenido: c, created_at: 't', remitente_id: p }; };
    const r = await servicio.enviarMensaje('auth', 'P1', 'G1', 'hola');
    assert.deepEqual(llamadas.at(-1), ['msg', 'G1', 'P1', 'hola']);
    assert.deepEqual(r.remitente, { id: 'P1', nombre: 'Yo', username: 'yo' });
    assert.equal(r.esMio, true);
});
