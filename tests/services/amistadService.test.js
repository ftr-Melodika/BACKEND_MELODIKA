import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const url = (ruta) => new URL(`../../src/${ruta}`, import.meta.url).href;

// Dobles de prueba: cada test reasigna lo que necesita
const amistadFalso = {};
const perfilesFalso = {};
const cursoFalso = {};
const perfilServiceFalso = {};
const invitacionFalso = {};

mock.module(url('repositories/amistadRepository.js'), {
    defaultExport: class { constructor() { return amistadFalso; } },
});
mock.module(url('repositories/PerfilesRepository.js'), {
    defaultExport: class { constructor() { return perfilesFalso; } },
});
mock.module(url('services/cursoService.js'), {
    defaultExport: class { constructor() { return cursoFalso; } },
});
mock.module(url('services/perfilService.js'), { defaultExport: perfilServiceFalso });
mock.module(url('services/invitacionAmistadService.js'), { defaultExport: invitacionFalso });

const { default: servicio } = await import(url('services/amistadService.js'));

let llamadas;
beforeEach(() => {
    llamadas = [];
    for (const o of [amistadFalso, perfilesFalso, cursoFalso, perfilServiceFalso, invitacionFalso]) {
        for (const k of Object.keys(o)) delete o[k];
    }
    perfilServiceFalso.validarAccesoPerfil = async (...a) => { llamadas.push(['acceso', ...a]); };
});

const rechaza = (promesa, mensaje) => assert.rejects(promesa, (e) => { assert.equal(e.message, mensaje); return true; });

test('enviarSolicitud: valida acceso y crea la solicitud por destinoId', async () => {
    perfilesFalso.obtenerPorId = async (id) => ({ id, activo: true });
    amistadFalso.enviarSolicitud = async (a, b) => { llamadas.push(['enviar', a, b]); return { amistad: { id: 'A1', estado: 'pendiente' } }; };
    const r = await servicio.enviarSolicitud('auth', 'P1', { destinoId: 'P2' });
    assert.deepEqual(r, { amistadId: 'A1', estado: 'pendiente' });
    assert.deepEqual(llamadas[0], ['acceso', 'auth', 'P1']);
    assert.deepEqual(llamadas[1], ['enviar', 'P1', 'P2']);
});

test('enviarSolicitud: destino por username inexistente', async () => {
    perfilesFalso.obtenerActivoPorUsername = async () => null;
    await rechaza(servicio.enviarSolicitud('a', 'P1', { username: 'nadie' }), 'No existe un perfil con ese username');
});

test('enviarSolicitud: destino por username existente y por token', async () => {
    perfilesFalso.obtenerActivoPorUsername = async (u) => ({ id: 'P9', username: u });
    amistadFalso.enviarSolicitud = async (a, b) => ({ amistad: { id: b, estado: 'pendiente' } });
    assert.equal((await servicio.enviarSolicitud('a', 'P1', { username: 'ana' })).amistadId, 'P9');

    invitacionFalso.obtenerDuenoDelToken = async (t) => ({ id: 'P7', t });
    assert.equal((await servicio.enviarSolicitud('a', 'P1', { token: 'tok' })).amistadId, 'P7');
});

test('enviarSolicitud: perfil inexistente o inactivo', async () => {
    perfilesFalso.obtenerPorId = async () => null;
    await rechaza(servicio.enviarSolicitud('a', 'P1', { destinoId: 'X' }), 'El perfil no existe');
    perfilesFalso.obtenerPorId = async (id) => ({ id, activo: false });
    await rechaza(servicio.enviarSolicitud('a', 'P1', { destinoId: 'X' }), 'El perfil no existe');
});

test('enviarSolicitud: no se puede enviar a uno mismo (sin distinguir mayúsculas)', async () => {
    perfilesFalso.obtenerPorId = async () => ({ id: 'ABC', activo: true });
    await rechaza(servicio.enviarSolicitud('a', 'abc', { destinoId: 'ABC' }), 'No podés enviarte una solicitud a vos mismo');
});

test('enviarSolicitud: errores según la relación existente', async () => {
    perfilesFalso.obtenerPorId = async (id) => ({ id, activo: true });
    const conExistente = (existente) => { amistadFalso.enviarSolicitud = async () => ({ amistad: null, existente }); };

    conExistente({ estado: 'aceptada', perfil_1_id: 'P1' });
    await rechaza(servicio.enviarSolicitud('a', 'P1', { destinoId: 'P2' }), 'Ya son amigos');
    conExistente({ estado: 'pendiente', perfil_1_id: 'P1' });
    await rechaza(servicio.enviarSolicitud('a', 'P1', { destinoId: 'P2' }), 'Ya le enviaste una solicitud a este perfil');
    conExistente({ estado: 'pendiente', perfil_1_id: 'P2' });
    await rechaza(servicio.enviarSolicitud('a', 'P1', { destinoId: 'P2' }), 'Este perfil ya te envió una solicitud');
    conExistente(undefined);
    await rechaza(servicio.enviarSolicitud('a', 'P1', { destinoId: 'P2' }), 'Ya existe una solicitud o amistad con este perfil');
});

test('enviarSolicitud: si el acceso al perfil falla no se toca nada más', async () => {
    perfilServiceFalso.validarAccesoPerfil = async () => { throw new Error('Acceso denegado al perfil'); };
    amistadFalso.enviarSolicitud = async () => { throw new Error('no debería llamarse'); };
    await rechaza(servicio.enviarSolicitud('a', 'P1', { destinoId: 'P2' }), 'Acceso denegado al perfil');
});

test('listarSolicitudes: separa recibidas y enviadas y da formato', async () => {
    amistadFalso.listarSolicitudesPendientes = async () => [
        { amistad_id: 1, id: 'P2', nombre: 'N2', username: 'u2', avatar_url: 'a2', created_at: 'f1', recibida: true },
        { amistad_id: 2, id: 'P3', nombre: 'N3', username: 'u3', avatar_url: 'a3', created_at: 'f2', recibida: false },
    ];
    const r = await servicio.listarSolicitudes('a', 'P1');
    assert.deepEqual(r.recibidas, [{ amistadId: 1, perfil: { id: 'P2', nombre: 'N2', username: 'u2', avatarUrl: 'a2' }, createdAt: 'f1' }]);
    assert.equal(r.enviadas.length, 1);
    assert.equal(r.enviadas[0].perfil.id, 'P3');
});

test('responderSolicitud: aceptar y rechazar traducen la acción al estado', async () => {
    amistadFalso.obtenerPorId = async () => ({ id: 5, perfil_2_id: 'P1' });
    amistadFalso.responderSolicitud = async (id, p, estado) => { llamadas.push(['resp', id, p, estado]); return { id, estado }; };
    assert.deepEqual(await servicio.responderSolicitud('a', 'P1', 5, 'aceptar'), { amistadId: 5, estado: 'aceptada' });
    assert.deepEqual(await servicio.responderSolicitud('a', 'P1', 5, 'rechazar'), { amistadId: 5, estado: 'rechazada' });
    assert.deepEqual(llamadas.filter(l => l[0] === 'resp').map(l => l[3]), ['aceptada', 'rechazada']);
});

test('responderSolicitud: no existe, no es el receptor, ya respondida', async () => {
    amistadFalso.obtenerPorId = async () => null;
    await rechaza(servicio.responderSolicitud('a', 'P1', 5, 'aceptar'), 'Solicitud no encontrada');

    amistadFalso.obtenerPorId = async () => ({ id: 5, perfil_1_id: 'P1', perfil_2_id: 'P2' });
    await rechaza(servicio.responderSolicitud('a', 'P1', 5, 'aceptar'), 'No podés responder esta solicitud');

    amistadFalso.obtenerPorId = async () => ({ id: 5, perfil_2_id: 'P1' });
    amistadFalso.responderSolicitud = async () => null;
    await rechaza(servicio.responderSolicitud('a', 'P1', 5, 'aceptar'), 'La solicitud ya fue respondida');
});

test('eliminarAmistad: si el repositorio la borra, termina sin error', async () => {
    amistadFalso.eliminar = async (a, p) => { llamadas.push(['elim', a, p]); return true; };
    assert.equal(await servicio.eliminarAmistad('a', 'P1', 3), undefined);
    assert.deepEqual(llamadas.at(-1), ['elim', 3, 'P1']);
});

test('eliminarAmistad: casos en que no se pudo borrar', async () => {
    amistadFalso.eliminar = async () => false;
    amistadFalso.obtenerPorId = async () => null;
    await rechaza(servicio.eliminarAmistad('a', 'P1', 3), 'Solicitud no encontrada');

    amistadFalso.obtenerPorId = async () => ({ perfil_1_id: 'P1', perfil_2_id: 'P2', estado: 'rechazada' });
    await rechaza(servicio.eliminarAmistad('a', 'P1', 3), 'Solicitud no encontrada');

    amistadFalso.obtenerPorId = async () => ({ perfil_1_id: 'P1', perfil_2_id: 'P2', estado: 'pendiente' });
    await rechaza(servicio.eliminarAmistad('a', 'P1', 3), 'No podés eliminar esta solicitud');

    // ajeno, aunque esté rechazada: no se revela nada distinto
    amistadFalso.obtenerPorId = async () => ({ perfil_1_id: 'P8', perfil_2_id: 'P9', estado: 'rechazada' });
    await rechaza(servicio.eliminarAmistad('a', 'P1', 3), 'No podés eliminar esta solicitud');
});

test('listarAmigos: da formato resumido', async () => {
    amistadFalso.listarAmigos = async () => [{ amistad_id: 1, id: 'P2', nombre: 'N', username: 'u', avatar_url: 'av' }];
    assert.deepEqual(await servicio.listarAmigos('a', 'P1'), [{ amistadId: 1, perfil: { id: 'P2', nombre: 'N', username: 'u', avatarUrl: 'av' } }]);
});

const otroBase = { id: 'P2', activo: true, nombre: 'Otro', username: 'otro', avatarUrl: 'av', esPublico: false, pais: 'AR', xp: 10, racha: 2, cuentaId: 'secreto', fechaNacimiento: 'x', genero: 'y' };
const progreso = { leccionesCompletadas: 3, totalLecciones: 9, cursosCompletados: 1, cursos: [{ id: 1, nombre: 'C', porcentaje: 33, completado: false, extra: 'no' }] };

test('obtenerPerfilSocial: perfil privado y no amigo oculta estadisticas y pais', async () => {
    perfilesFalso.obtenerPorId = async () => ({ ...otroBase });
    amistadFalso.obtenerEntre = async () => null;
    amistadFalso.contarAmigos = async () => 4;
    cursoFalso.resumirProgreso = async () => { throw new Error('no debe consultarse'); };
    const r = await servicio.obtenerPerfilSocial('a', 'P1', 'P2');
    assert.equal(r.puedeVerEstadisticas, false);
    assert.equal(r.estadisticas, null);
    assert.ok(!('pais' in r));
    assert.equal(r.totalAmigos, 4);
    assert.deepEqual(r.relacion, { estado: 'ninguna', amistadId: null });
    assert.ok(!('cuentaId' in r) && !('fechaNacimiento' in r) && !('genero' in r));
});

test('obtenerPerfilSocial: perfil publico muestra estadisticas con campos filtrados', async () => {
    perfilesFalso.obtenerPorId = async () => ({ ...otroBase, esPublico: true, xp: undefined, racha: undefined });
    amistadFalso.obtenerEntre = async () => null;
    amistadFalso.contarAmigos = async () => 0;
    cursoFalso.resumirProgreso = async () => progreso;
    const r = await servicio.obtenerPerfilSocial('a', 'P1', 'P2');
    assert.equal(r.puedeVerEstadisticas, true);
    assert.equal(r.pais, 'AR');
    assert.deepEqual(r.estadisticas, {
        xp: 0, racha: 0, leccionesCompletadas: 3, totalLecciones: 9, cursosCompletados: 1,
        cursos: [{ id: 1, nombre: 'C', porcentaje: 33, completado: false }],
    });
});

test('obtenerPerfilSocial: amigos de un perfil privado ven estadisticas', async () => {
    perfilesFalso.obtenerPorId = async () => ({ ...otroBase });
    amistadFalso.obtenerEntre = async () => ({ id: 7, estado: 'aceptada' });
    amistadFalso.contarAmigos = async () => 1;
    cursoFalso.resumirProgreso = async () => progreso;
    const r = await servicio.obtenerPerfilSocial('a', 'P1', 'P2');
    assert.equal(r.relacion.estado, 'amigos');
    assert.equal(r.puedeVerEstadisticas, true);
    assert.equal(r.estadisticas.xp, 10);
});

test('obtenerPerfilSocial: perfil propio no consulta amistad y ve sus estadisticas', async () => {
    perfilesFalso.obtenerPorId = async () => ({ ...otroBase, id: 'P1' });
    amistadFalso.obtenerEntre = async () => { throw new Error('no debe consultarse'); };
    amistadFalso.contarAmigos = async () => 2;
    cursoFalso.resumirProgreso = async () => progreso;
    const r = await servicio.obtenerPerfilSocial('a', 'P1', 'P1');
    assert.equal(r.esPropio, true);
    assert.equal(r.puedeVerEstadisticas, true);
});

test('obtenerPerfilSocial: perfil inexistente', async () => {
    perfilesFalso.obtenerPorId = async () => null;
    await rechaza(servicio.obtenerPerfilSocial('a', 'P1', 'P2'), 'El perfil no existe');
});
