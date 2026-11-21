import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Repositorio y perfilService falsos: nada toca la base.
const repo = {};
const llamadas = [];
const perfil = { validar: async () => ({ cuenta: { id: 10 }, perfilExistente: { id: 5, xp: 100, racha: 3 } }) };

const resetRepo = () => {
    llamadas.length = 0;
    Object.assign(repo, {
        obtenerCursos: async () => [],
        obtenerProgresoCursos: async () => [],
        obtenerTodosLosEjerciciosConCurso: async () => [],
        obtenerTodosLosEjerciciosCompletados: async () => [],
        obtenerCursoPorId: async () => null,
        obtenerEjerciciosDeCurso: async () => [],
        obtenerEjerciciosCompletados: async () => [],
        verificarCursoCompletado: async () => false,
        registrarOmision: async () => {},
        recuperarXPDeOmision: async () => 0,
        registrarProgresoYSumarXP: async () => 0,
        registrarCursoCompletado: async () => {},
    });
    perfil.validar = async () => ({ cuenta: { id: 10 }, perfilExistente: { id: 5, xp: 100, racha: 3 } });
};
resetRepo();

const metodos = [
    'obtenerCursos', 'obtenerProgresoCursos', 'obtenerTodosLosEjerciciosConCurso', 'obtenerTodosLosEjerciciosCompletados',
    'obtenerCursoPorId', 'obtenerEjerciciosDeCurso', 'obtenerEjerciciosCompletados', 'verificarCursoCompletado',
    'registrarOmision', 'recuperarXPDeOmision', 'registrarProgresoYSumarXP', 'registrarCursoCompletado',
];
class CursoRepositoryFalso {}
for (const m of metodos) {
    CursoRepositoryFalso.prototype[m] = function (...args) { llamadas.push([m, ...args]); return repo[m](...args); };
}
const url = (p) => new URL(p, import.meta.url).href;
mock.module(url('../../src/repositories/cursoRepository.js'), { defaultExport: CursoRepositoryFalso });
mock.module(url('../../src/services/perfilService.js'), {
    defaultExport: { validarAccesoPerfil: (...a) => perfil.validar(...a) },
});

const CursoService = (await import('../../src/services/cursoService.js')).default;
const servicio = new CursoService();

beforeEach(resetRepo);

const cursos3 = [
    { id: 1, nombre: 'C1', nivel: 'Basico', orden: 1 },
    { id: 2, nombre: 'C2', nivel: 'Basico', orden: 2 },
    { id: 3, nombre: 'C3', nivel: 'Medio', orden: 3 },
];
const lecciones4 = [
    { id: 11, orden: 1, titulo: 'L1', xpRecompensa: 10 },
    { id: 12, orden: 2, titulo: 'L2', xpRecompensa: 20 },
    { id: 13, orden: 3, titulo: 'L3', xpRecompensa: 30 },
    { id: 14, orden: 4, titulo: 'L4', xpRecompensa: 40 },
];
const hechos = (...ids) => ids.map((id) => ({ ejercicio_id: id, omitida: false }));

// ---------- validación de acceso ----------
test('todas las operaciones validan el acceso al perfil primero y propagan su error', async () => {
    perfil.validar = async () => { throw new Error('Acceso denegado al perfil'); };
    const intentos = [
        () => servicio.listarCursos('a', 5),
        () => servicio.obtenerDetalleCurso('a', 1, 5),
        () => servicio.completarLeccion('a', 5, 1, 11),
        () => servicio.completarCurso('a', 5, 1),
        () => servicio.obtenerProgreso('a', 5),
    ];
    for (const intento of intentos) {
        await assert.rejects(intento, { message: 'Acceso denegado al perfil' });
    }
    assert.equal(llamadas.length, 0, 'no debe consultar datos si no hay acceso');
});

test('validarAccesoPerfil se llama con authId y perfilId', async () => {
    let args;
    perfil.validar = async (...a) => { args = a; return { perfilExistente: {} }; };
    await servicio.listarCursos('auth-x', 7);
    assert.deepEqual(args, ['auth-x', 7]);
});

// ---------- listarCursos ----------
test('listarCursos: sin progreso solo el primer curso está desbloqueado', async () => {
    repo.obtenerCursos = async () => cursos3;
    const r = await servicio.listarCursos('a', 5);
    assert.equal(r.perfilId, 5);
    assert.equal(r.totalCursos, 3);
    assert.deepEqual(r.cursos.map((c) => [c.completado, c.desbloqueado]), [[false, true], [false, false], [false, false]]);
});

test('listarCursos: completar un curso desbloquea el siguiente (y solo ese)', async () => {
    repo.obtenerCursos = async () => cursos3;
    repo.obtenerProgresoCursos = async () => [{ curso_id: 1 }];
    const r = await servicio.listarCursos('a', 5);
    assert.deepEqual(r.cursos.map((c) => [c.completado, c.desbloqueado]), [[true, true], [false, true], [false, false]]);
});

test('listarCursos: los ids como string también cuentan (mismoId)', async () => {
    repo.obtenerCursos = async () => cursos3;
    repo.obtenerProgresoCursos = async () => [{ curso_id: '2' }];
    const r = await servicio.listarCursos('a', 5);
    assert.equal(r.cursos[1].completado, true);
    assert.equal(r.cursos[2].desbloqueado, true);
});

test('listarCursos: calcula totalLecciones y leccionesCompletadas por curso', async () => {
    repo.obtenerCursos = async () => cursos3;
    repo.obtenerTodosLosEjerciciosConCurso = async () => [
        { id: 11, cursoId: 1 }, { id: 12, cursoId: 1 }, { id: 13, cursoId: 1 },
        { id: 21, cursoId: '2' },
    ];
    repo.obtenerTodosLosEjerciciosCompletados = async () => hechos(11, 12, 21);
    const r = await servicio.listarCursos('a', 5);
    assert.deepEqual(r.cursos.map((c) => [c.totalLecciones, c.leccionesCompletadas]), [[3, 2], [1, 1], [0, 0]]);
});

test('listarCursos: pide el progreso del perfil indicado', async () => {
    await servicio.listarCursos('a', 5);
    assert.deepEqual(llamadas.find((l) => l[0] === 'obtenerProgresoCursos'), ['obtenerProgresoCursos', 5]);
    assert.deepEqual(llamadas.find((l) => l[0] === 'obtenerTodosLosEjerciciosCompletados'), ['obtenerTodosLosEjerciciosCompletados', 5]);
});

// ---------- obtenerDetalleCurso ----------
test('obtenerDetalleCurso devuelve null si el curso no existe', async () => {
    assert.equal(await servicio.obtenerDetalleCurso('a', 99, 5), null);
});

test('obtenerDetalleCurso: estados de lecciones, omitidas, totales y curso completado', async () => {
    repo.obtenerCursoPorId = async () => ({ id: 1, nombre: 'C1' });
    repo.obtenerEjerciciosDeCurso = async () => lecciones4;
    repo.obtenerEjerciciosCompletados = async () => [
        { ejercicio_id: 11, omitida: false },
        { ejercicio_id: 12, omitida: true },
    ];
    repo.verificarCursoCompletado = async () => true;
    const r = await servicio.obtenerDetalleCurso('a', 1, 5);
    assert.equal(r.nombre, 'C1');
    assert.equal(r.completado, true);
    assert.equal(r.totalLecciones, 4);
    assert.equal(r.leccionesCompletadas, 2);
    assert.deepEqual(r.lecciones.map((l) => [l.completado, l.desbloqueado, l.omitida]), [
        [true, true, false],
        [true, true, true],
        [false, true, false],   // la siguiente a la última completada
        [false, false, false],
    ]);
});

test('obtenerDetalleCurso: sin progreso solo la primera lección está desbloqueada', async () => {
    repo.obtenerCursoPorId = async () => ({ id: 1 });
    repo.obtenerEjerciciosDeCurso = async () => lecciones4;
    const r = await servicio.obtenerDetalleCurso('a', 1, 5);
    assert.deepEqual(r.lecciones.map((l) => l.desbloqueado), [true, false, false, false]);
    assert.equal(r.completado, false);
    assert.equal(r.leccionesCompletadas, 0);
});

test('obtenerDetalleCurso: completar una lección posterior desbloquea hasta la siguiente a esa', async () => {
    repo.obtenerCursoPorId = async () => ({ id: 1 });
    repo.obtenerEjerciciosDeCurso = async () => lecciones4;
    repo.obtenerEjerciciosCompletados = async () => hechos(13); // se completó la 3 (caso raro) sin la 1 y 2
    const r = await servicio.obtenerDetalleCurso('a', 1, 5);
    assert.deepEqual(r.lecciones.map((l) => l.desbloqueado), [true, true, true, true]);
});

// ---------- completarLeccion ----------
const prepararCurso = ({ completados = [], completadoCurso = false } = {}) => {
    repo.obtenerEjerciciosDeCurso = async () => lecciones4;
    repo.obtenerEjerciciosCompletados = async () => completados;
    repo.verificarCursoCompletado = async () => completadoCurso;
};

test('completarLeccion: lección inexistente lanza "Ejercicio no encontrado."', async () => {
    prepararCurso();
    await assert.rejects(() => servicio.completarLeccion('a', 5, 1, 999), { message: 'Ejercicio no encontrado.' });
});

test('completarLeccion: la primera lección da XP y devuelve el XP total nuevo', async () => {
    prepararCurso();
    repo.registrarProgresoYSumarXP = async () => 110;
    const r = await servicio.completarLeccion('a', 5, 1, 11);
    assert.deepEqual(r, { exito: true, xpGanada: 10, xpTotal: 110, cursoCompletado: false, omitida: false });
    assert.deepEqual(llamadas.find((l) => l[0] === 'registrarProgresoYSumarXP'), ['registrarProgresoYSumarXP', 5, 11, 10]);
});

test('completarLeccion: acepta el id de lección como string', async () => {
    prepararCurso();
    repo.registrarProgresoYSumarXP = async () => 110;
    const r = await servicio.completarLeccion('a', 5, 1, '11');
    assert.equal(r.xpGanada, 10);
});

test('completarLeccion: una lección bloqueada lanza error y no guarda nada', async () => {
    prepararCurso();
    await assert.rejects(() => servicio.completarLeccion('a', 5, 1, 13), { message: 'La lección todavía está bloqueada.' });
    assert.equal(llamadas.some((l) => l[0] === 'registrarProgresoYSumarXP'), false);
});

test('completarLeccion: la siguiente a la última completada sí está desbloqueada', async () => {
    prepararCurso({ completados: hechos(11) });
    repo.registrarProgresoYSumarXP = async () => 120;
    const r = await servicio.completarLeccion('a', 5, 1, 12);
    assert.equal(r.xpGanada, 20);
    assert.equal(r.xpTotal, 120);
});

test('completarLeccion: reclamar una lección ya completada lanza "Ya habías reclamado..."', async () => {
    prepararCurso({ completados: hechos(11) });
    await assert.rejects(() => servicio.completarLeccion('a', 5, 1, 11), { message: 'Ya habías reclamado el XP de este ejercicio.' });
    assert.equal(llamadas.some((l) => l[0] === 'registrarProgresoYSumarXP'), false);
});

test('completarLeccion: omitir una lección nueva registra la omisión sin XP', async () => {
    prepararCurso();
    const r = await servicio.completarLeccion('a', 5, 1, 11, { omitir: true });
    assert.deepEqual(r, { exito: true, xpGanada: 0, xpTotal: 100, cursoCompletado: false, omitida: true });
    assert.deepEqual(llamadas.find((l) => l[0] === 'registrarOmision'), ['registrarOmision', 5, 11]);
    assert.equal(llamadas.some((l) => l[0] === 'registrarProgresoYSumarXP'), false);
});

test('completarLeccion: omitir una bloqueada también lanza bloqueada', async () => {
    prepararCurso();
    await assert.rejects(() => servicio.completarLeccion('a', 5, 1, 14, { omitir: true }), { message: 'La lección todavía está bloqueada.' });
});

test('completarLeccion: omitir una ya completada no cambia nada (conserva omitida del registro)', async () => {
    prepararCurso({ completados: hechos(11) });
    const r = await servicio.completarLeccion('a', 5, 1, 11, { omitir: true });
    assert.equal(r.omitida, false);
    assert.equal(r.xpGanada, 0);
    assert.equal(llamadas.some((l) => l[0] === 'registrarOmision'), false);
});

test('completarLeccion: omitir una ya omitida devuelve omitida true y no registra de nuevo', async () => {
    prepararCurso({ completados: [{ ejercicio_id: 11, omitida: true }] });
    const r = await servicio.completarLeccion('a', 5, 1, 11, { omitir: true });
    assert.equal(r.omitida, true);
    assert.equal(llamadas.some((l) => l[0] === 'registrarOmision'), false);
});

test('completarLeccion: completar una omitida recupera el XP una sola vez', async () => {
    prepararCurso({ completados: [{ ejercicio_id: 11, omitida: true }] });
    repo.recuperarXPDeOmision = async () => 110;
    const r = await servicio.completarLeccion('a', 5, 1, 11);
    assert.deepEqual(r, { exito: true, xpGanada: 10, xpTotal: 110, cursoCompletado: false, omitida: false });
    assert.deepEqual(llamadas.find((l) => l[0] === 'recuperarXPDeOmision'), ['recuperarXPDeOmision', 5, 11, 10]);
});

test('completarLeccion: si recuperarXPDeOmision devuelve null (carrera) lanza "Ya habías reclamado..."', async () => {
    prepararCurso({ completados: [{ ejercicio_id: 11, omitida: true }] });
    repo.recuperarXPDeOmision = async () => null;
    await assert.rejects(() => servicio.completarLeccion('a', 5, 1, 11), { message: 'Ya habías reclamado el XP de este ejercicio.' });
});

test('completarLeccion: lección sin xpRecompensa da 0 XP', async () => {
    repo.obtenerEjerciciosDeCurso = async () => [{ id: 11, orden: 1 }];
    repo.obtenerEjerciciosCompletados = async () => [];
    repo.registrarProgresoYSumarXP = async () => 100;
    const r = await servicio.completarLeccion('a', 5, 1, 11);
    assert.equal(r.xpGanada, 0);
    assert.deepEqual(llamadas.find((l) => l[0] === 'registrarProgresoYSumarXP'), ['registrarProgresoYSumarXP', 5, 11, 0]);
});

test('completarLeccion: usa xp 0 si el perfil no tiene xp al omitir', async () => {
    perfil.validar = async () => ({ perfilExistente: {} });
    prepararCurso();
    const r = await servicio.completarLeccion('a', 5, 1, 11, { omitir: true });
    assert.equal(r.xpTotal, 0);
});

test('completarLeccion: al completar la última lección registra el curso como completado', async () => {
    prepararCurso({ completados: hechos(11, 12, 13) });
    repo.registrarProgresoYSumarXP = async () => 140;
    const r = await servicio.completarLeccion('a', 5, 1, 14);
    assert.equal(r.cursoCompletado, true);
    assert.deepEqual(llamadas.find((l) => l[0] === 'registrarCursoCompletado'), ['registrarCursoCompletado', 5, 1]);
});

test('completarLeccion: si el curso ya estaba registrado como completado no lo registra otra vez', async () => {
    prepararCurso({ completados: hechos(11, 12, 13), completadoCurso: true });
    repo.registrarProgresoYSumarXP = async () => 140;
    const r = await servicio.completarLeccion('a', 5, 1, 14);
    assert.equal(r.cursoCompletado, true);
    assert.equal(llamadas.some((l) => l[0] === 'registrarCursoCompletado'), false);
});

test('completarLeccion: omitir la última también completa el curso pero no da XP', async () => {
    prepararCurso({ completados: hechos(11, 12, 13) });
    const r = await servicio.completarLeccion('a', 5, 1, 14, { omitir: true });
    assert.equal(r.cursoCompletado, true);
    assert.equal(r.xpGanada, 0);
    assert.equal(llamadas.some((l) => l[0] === 'registrarCursoCompletado'), true);
});

test('completarLeccion: con lecciones pendientes el curso no se completa', async () => {
    prepararCurso({ completados: hechos(11) });
    repo.registrarProgresoYSumarXP = async () => 120;
    const r = await servicio.completarLeccion('a', 5, 1, 12);
    assert.equal(r.cursoCompletado, false);
    assert.equal(llamadas.some((l) => l[0] === 'registrarCursoCompletado'), false);
});

// ---------- completarCurso ----------
test('completarCurso: curso inexistente lanza "Curso no encontrado."', async () => {
    await assert.rejects(() => servicio.completarCurso('a', 5, 1), { message: 'Curso no encontrado.' });
});

test('completarCurso: con ejercicios pendientes lanza error y no registra', async () => {
    repo.obtenerCursoPorId = async () => ({ id: 1 });
    prepararCurso({ completados: hechos(11, 12) });
    await assert.rejects(() => servicio.completarCurso('a', 5, 1), { message: 'No has completado todos los ejercicios del curso.' });
    assert.equal(llamadas.some((l) => l[0] === 'registrarCursoCompletado'), false);
});

test('completarCurso: con todo completado registra el curso y responde éxito', async () => {
    repo.obtenerCursoPorId = async () => ({ id: 1 });
    prepararCurso({ completados: hechos(11, 12, 13, 14) });
    const r = await servicio.completarCurso('a', 5, 1);
    assert.deepEqual(r, { exito: true, mensaje: 'Curso completado con éxito.' });
    assert.deepEqual(llamadas.find((l) => l[0] === 'registrarCursoCompletado'), ['registrarCursoCompletado', 5, 1]);
});

test('completarCurso es idempotente: si ya estaba registrado no inserta de nuevo', async () => {
    repo.obtenerCursoPorId = async () => ({ id: 1 });
    prepararCurso({ completados: hechos(11, 12, 13, 14), completadoCurso: true });
    const r = await servicio.completarCurso('a', 5, 1);
    assert.equal(r.exito, true);
    assert.equal(llamadas.some((l) => l[0] === 'registrarCursoCompletado'), false);
});

// ---------- obtenerProgreso / resumirProgreso ----------
const escenarioProgreso = () => {
    repo.obtenerCursos = async () => cursos3;
    repo.obtenerProgresoCursos = async () => [{ curso_id: 1 }];
    repo.obtenerTodosLosEjerciciosConCurso = async () => [
        { id: 11, cursoId: 1, titulo: 'A' }, { id: 12, cursoId: 1, titulo: 'B' },
        { id: 21, cursoId: 2, titulo: 'C' }, { id: 22, cursoId: 2, titulo: 'D' }, { id: 23, cursoId: 2, titulo: 'E' }, { id: 24, cursoId: 2, titulo: 'F' },
    ];
    repo.obtenerTodosLosEjerciciosCompletados = async () => hechos(11, 12, 21);
};

test('resumirProgreso calcula totales, porcentaje, próxima lección y curso actual', async () => {
    escenarioProgreso();
    const r = await servicio.resumirProgreso(5);
    assert.equal(r.leccionesCompletadas, 3);
    assert.equal(r.totalLecciones, 6);
    assert.equal(r.cursosCompletados, 1);
    assert.equal(r.totalCursos, 3);
    const [c1, c2, c3] = r.cursos;
    assert.deepEqual(c1, {
        id: 1, nombre: 'C1', nivel: 'Basico', completado: true, desbloqueado: true,
        totalLecciones: 2, leccionesCompletadas: 2, porcentaje: 100, proximaLeccion: null,
    });
    assert.equal(c2.porcentaje, 25);
    assert.equal(c2.proximaLeccion, 'D');
    assert.equal(c2.desbloqueado, true);
    assert.equal(c3.totalLecciones, 0);
    assert.equal(c3.porcentaje, 0, 'curso sin lecciones no divide por cero');
    assert.equal(c3.desbloqueado, false);
    assert.equal(r.cursoActual.id, 2);
});

test('resumirProgreso: si todo está completado el curso actual es el último', async () => {
    repo.obtenerCursos = async () => cursos3;
    repo.obtenerProgresoCursos = async () => [{ curso_id: 1 }, { curso_id: 2 }, { curso_id: 3 }];
    const r = await servicio.resumirProgreso(5);
    assert.equal(r.cursoActual.id, 3);
});

test('resumirProgreso: sin cursos el curso actual es null', async () => {
    const r = await servicio.resumirProgreso(5);
    assert.equal(r.cursoActual, null);
    assert.deepEqual(r.cursos, []);
    assert.equal(r.totalCursos, 0);
});

test('resumirProgreso redondea el porcentaje', async () => {
    repo.obtenerCursos = async () => [cursos3[0]];
    repo.obtenerTodosLosEjerciciosConCurso = async () => [{ id: 1, cursoId: 1 }, { id: 2, cursoId: 1 }, { id: 3, cursoId: 1 }];
    repo.obtenerTodosLosEjerciciosCompletados = async () => hechos(1);
    const r = await servicio.resumirProgreso(5);
    assert.equal(r.cursos[0].porcentaje, 33);
});

test('obtenerProgreso suma xp y racha del perfil al resumen', async () => {
    escenarioProgreso();
    const r = await servicio.obtenerProgreso('a', 5);
    assert.equal(r.perfilId, 5);
    assert.equal(r.xp, 100);
    assert.equal(r.racha, 3);
    assert.equal(r.totalLecciones, 6);
    assert.equal(r.cursoActual.id, 2);
});

test('obtenerProgreso usa 0 si el perfil no tiene xp ni racha', async () => {
    perfil.validar = async () => ({ perfilExistente: {} });
    const r = await servicio.obtenerProgreso('a', 5);
    assert.equal(r.xp, 0);
    assert.equal(r.racha, 0);
});
