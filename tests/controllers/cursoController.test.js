import { test, mock, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as h from '../_ayudas/appControlador.js';

const servicio = h.servicioFalso(['listarCursos', 'obtenerProgreso', 'obtenerDetalleCurso', 'completarLeccion', 'completarCurso']);
h.mockearModulo(mock, 'services/cursoService.js', { defaultExport: h.claseFalsa(servicio) });
h.mockearSupabase(mock);
const router = (await import(h.rutaSrc('controllers/cursoController.js'))).default;
let app;
before(async () => { app = await h.levantarApp('/api/cursos', router); });
after(() => app.cerrar());

const llamada = (metodo) => servicio[metodo].mock.calls.at(-1).arguments;
const responder = (metodo, valor) => servicio[metodo].mock.mockImplementationOnce(async () => valor);
const fallar = (metodo, error) => servicio[metodo].mock.mockImplementationOnce(async () => { throw error; });
const P = h.PERFIL_ID;

test('GET /perfil/:perfilId: lista cursos con authId y perfilId', async () => {
    responder('listarCursos', [{ id: 1 }]);
    const r = await app.pedir('GET', `/api/cursos/perfil/${P}`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { success: true, message: 'Cursos obtenidos exitosamente.', data: [{ id: 1 }] });
    assert.deepEqual(llamada('listarCursos'), [h.USUARIO.id, P]);
});

test('GET /perfil/:perfilId/progreso: devuelve el progreso', async () => {
    responder('obtenerProgreso', { xp: 10 });
    const r = await app.pedir('GET', `/api/cursos/perfil/${P}/progreso`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.data, { xp: 10 });
    assert.equal(r.json.message, 'Progreso obtenido exitosamente.');
    assert.deepEqual(llamada('obtenerProgreso'), [h.USUARIO.id, P]);
});

test('GET /perfil/:perfilId/curso/:cursoId: el service recibe (authId, cursoId, perfilId)', async () => {
    responder('obtenerDetalleCurso', { id: 3, lecciones: [] });
    const r = await app.pedir('GET', `/api/cursos/perfil/${P}/curso/3`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.data, { id: 3, lecciones: [] });
    assert.deepEqual(llamada('obtenerDetalleCurso'), [h.USUARIO.id, '3', P]);
});

test('GET detalle: si el service devuelve vacío -> 404 "Curso no encontrado." por el mapper de cursos', async () => {
    responder('obtenerDetalleCurso', null);
    const r = await app.pedir('GET', `/api/cursos/perfil/${P}/curso/99`);
    assert.equal(r.status, 404);
    assert.deepEqual(r.json, { success: false, message: 'Curso no encontrado.' });
});

test('POST completar lección: sin body -> omitir=false y respuesta con XP', async () => {
    responder('completarLeccion', { xpGanada: 10, xpTotal: 50, cursoCompletado: false, omitida: false });
    const r = await app.pedir('POST', `/api/cursos/perfil/${P}/curso/3/lecciones/8/completar`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, {
        success: true, message: '¡Ejercicio completado!',
        data: { xpGanada: 10, xpTotal: 50, cursoCompletado: false, omitida: false },
    });
    assert.deepEqual(llamada('completarLeccion'), [h.USUARIO.id, P, '3', '8', { omitir: false }]);
});

test('POST completar lección con omitida:true -> omitir=true y mensaje "Lección omitida."', async () => {
    responder('completarLeccion', { xpGanada: 0, xpTotal: 40, cursoCompletado: false, omitida: true });
    const r = await app.pedir('POST', `/api/cursos/perfil/${P}/curso/3/lecciones/8/completar`, { body: { omitida: true } });
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'Lección omitida.');
    assert.deepEqual(llamada('completarLeccion').at(-1), { omitir: true });
});

test('POST completar lección con omitida inválida -> 400 del validador, sin llamar al service', async () => {
    const antes = servicio.completarLeccion.mock.callCount();
    const r = await app.pedir('POST', `/api/cursos/perfil/${P}/curso/3/lecciones/8/completar`, { body: { omitida: 'si' } });
    assert.equal(r.status, 400);
    assert.equal(r.json.message, 'El campo omitida debe ser true o false.');
    assert.equal(servicio.completarLeccion.mock.callCount(), antes);
});

test('POST completar lección: errores del service -> mapper de cursos (bloqueada 403, XP repetido 400)', async () => {
    fallar('completarLeccion', new Error('La lección todavía está bloqueada.'));
    let r = await app.pedir('POST', `/api/cursos/perfil/${P}/curso/3/lecciones/8/completar`);
    assert.equal(r.status, 403);
    assert.equal(r.json.message, 'Completá las lecciones anteriores antes de hacer esta.');
    fallar('completarLeccion', new Error('Ya habías reclamado el XP de este ejercicio.'));
    r = await app.pedir('POST', `/api/cursos/perfil/${P}/curso/3/lecciones/8/completar`);
    assert.equal(r.status, 400);
});

test('POST completar curso: responde con el mensaje del service y data null', async () => {
    responder('completarCurso', { mensaje: 'Curso completado' });
    const r = await app.pedir('POST', `/api/cursos/perfil/${P}/curso/3/completar`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { success: true, message: 'Curso completado', data: null });
    assert.deepEqual(llamada('completarCurso'), [h.USUARIO.id, P, '3']);
});

test('POST completar curso: faltan ejercicios -> 403', async () => {
    fallar('completarCurso', new Error('No has completado todos los ejercicios del curso.'));
    const r = await app.pedir('POST', `/api/cursos/perfil/${P}/curso/3/completar`);
    assert.equal(r.status, 403);
});

test('acceso denegado al perfil (lanzado por el service) -> 403 con el mensaje del módulo de cursos', async () => {
    fallar('listarCursos', new Error('Acceso denegado al perfil'));
    const r = await app.pedir('GET', `/api/cursos/perfil/${P}`);
    assert.equal(r.status, 403);
    assert.equal(r.json.message, 'No tienes permisos sobre este perfil.');
});

test('error de conexión (ECONNREFUSED) -> 503', async () => {
    fallar('obtenerProgreso', Object.assign(new Error('x'), { code: 'ECONNREFUSED' }));
    const r = await app.pedir('GET', `/api/cursos/perfil/${P}/progreso`);
    assert.equal(r.status, 503);
});

test('todas las rutas piden token: sin él -> 401 y el service no se llama', async () => {
    const rutas = [
        ['GET', `/api/cursos/perfil/${P}`],
        ['GET', `/api/cursos/perfil/${P}/progreso`],
        ['GET', `/api/cursos/perfil/${P}/curso/3`],
        ['POST', `/api/cursos/perfil/${P}/curso/3/lecciones/8/completar`],
        ['POST', `/api/cursos/perfil/${P}/curso/3/completar`],
    ];
    const total = () => Object.values(servicio).reduce((n, f) => n + f.mock.callCount(), 0);
    const antes = total();
    for (const [m, ruta] of rutas) {
        const r = await app.pedir(m, ruta, { token: null });
        assert.equal(r.status, 401, `${m} ${ruta}`);
    }
    assert.equal(total(), antes);
});
