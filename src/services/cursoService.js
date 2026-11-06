import CursoRepository from "../repositories/cursoRepository.js";
import perfilService from "./perfilService.js"; // Importamos la instancia exportada

const cursoRepository = new CursoRepository();

// Los IDs pueden venir como número (BD) o como string (req.params), así que comparamos como texto.
const mismoId = (a, b) => String(a) === String(b);
const estaEn = (ids, id) => ids.some(otro => mismoId(otro, id));

// Calcula completado/desbloqueado para una lista ordenada por "orden".
// Un elemento se desbloquea si es el primero o si su orden es <= al máximo completado + 1.
function marcarEstados(items, idsCompletados) {
    let maxOrdenCompletado = 0;
    for (const item of items) {
        if (estaEn(idsCompletados, item.id) && item.orden > maxOrdenCompletado) {
            maxOrdenCompletado = item.orden;
        }
    }

    return items.map((item, index) => {
        const completado = estaEn(idsCompletados, item.id);
        const desbloqueado = index === 0 || item.orden === 1 || item.orden <= maxOrdenCompletado + 1;
        return { ...item, completado, desbloqueado };
    });
}

class CursoService {

    async listarCursos(authId, perfilId) {
        // 🔒 Barrera de seguridad: delegamos la validación a perfilService
        await perfilService.validarAccesoPerfil(authId, perfilId);

        const cursos = await cursoRepository.obtenerCursos();
        const progresosBD = await cursoRepository.obtenerProgresoCursos(perfilId);
        const idsCompletados = progresosBD.map(progreso => progreso.curso_id);

        return {
            perfilId,
            totalCursos: cursos.length,
            cursos: marcarEstados(cursos, idsCompletados)
        };
    }

    async obtenerDetalleCurso(authId, cursoId, perfilId) {
        // 🔒 Barrera de seguridad
        await perfilService.validarAccesoPerfil(authId, perfilId);

        const cursoInfo = await cursoRepository.obtenerCursoPorId(cursoId);
        if (!cursoInfo) return null; // Si no existe el curso, cortamos acá

        const lecciones = await cursoRepository.obtenerEjerciciosDeCurso(cursoId);
        const ejerciciosCompletadosBD = await cursoRepository.obtenerEjerciciosCompletados(perfilId, cursoId);
        const idsCompletados = ejerciciosCompletadosBD.map(e => e.ejercicio_id);

        const leccionesFinales = marcarEstados(lecciones, idsCompletados);

        return {
            ...cursoInfo,
            completado: await cursoRepository.verificarCursoCompletado(perfilId, cursoId),
            totalLecciones: lecciones.length,
            leccionesCompletadas: leccionesFinales.filter(l => l.completado).length,
            lecciones: leccionesFinales
        };
    }

    async completarLeccion(authId, perfilId, cursoId, leccionId) {
        // 🔒 Barrera de seguridad
        await perfilService.validarAccesoPerfil(authId, perfilId);

        // 1. Buscamos la lección para saber cuánta XP da
        const leccionesDelCurso = await cursoRepository.obtenerEjerciciosDeCurso(cursoId);
        const leccion = leccionesDelCurso.find(l => mismoId(l.id, leccionId));
        if (!leccion) throw new Error("Ejercicio no encontrado.");

        // 2. Verificamos que no haga trampa pidiendo la XP dos veces
        const yaCompletada = await cursoRepository.verificarEjercicioCompletado(perfilId, leccion.id);
        if (yaCompletada) throw new Error("Ya habías reclamado el XP de este ejercicio.");

        // 3. Verificamos que la lección esté desbloqueada (no se pueden saltar lecciones)
        const completadosBD = await cursoRepository.obtenerEjerciciosCompletados(perfilId, cursoId);
        const idsCompletados = completadosBD.map(e => e.ejercicio_id);
        const estado = marcarEstados(leccionesDelCurso, idsCompletados).find(l => mismoId(l.id, leccion.id));
        if (!estado.desbloqueado) throw new Error("La lección todavía está bloqueada.");

        // 4. Guardamos el progreso y sumamos la XP (la entidad usa camelCase: xpRecompensa)
        const xpGanada = leccion.xpRecompensa ?? 0;
        const xpTotal = await cursoRepository.registrarProgresoYSumarXP(perfilId, leccion.id, xpGanada);

        // 5. Si con esta lección terminó todas las del curso, marcamos el curso como completado
        const cursoCompletado = idsCompletados.length + 1 >= leccionesDelCurso.length;
        if (cursoCompletado) {
            const yaRegistrado = await cursoRepository.verificarCursoCompletado(perfilId, cursoId);
            if (!yaRegistrado) await cursoRepository.registrarCursoCompletado(perfilId, cursoId);
        }

        return { exito: true, xpGanada, xpTotal, cursoCompletado };
    }

    async completarCurso(authId, perfilId, cursoId) {
        // 🔒 Barrera de seguridad
        await perfilService.validarAccesoPerfil(authId, perfilId);

        const curso = await cursoRepository.obtenerCursoPorId(cursoId);
        if (!curso) throw new Error("Curso no encontrado.");

        // Verificamos que haya completado todos los ejercicios del curso
        const leccionesDelCurso = await cursoRepository.obtenerEjerciciosDeCurso(cursoId);
        const ejerciciosCompletados = await cursoRepository.obtenerEjerciciosCompletados(perfilId, cursoId);
        if (ejerciciosCompletados.length < leccionesDelCurso.length) {
            throw new Error("No has completado todos los ejercicios del curso.");
        }

        // Idempotente: si ya estaba registrado no lo insertamos de nuevo
        const yaRegistrado = await cursoRepository.verificarCursoCompletado(perfilId, cursoId);
        if (!yaRegistrado) {
            await cursoRepository.registrarCursoCompletado(perfilId, cursoId);
        }
        return { exito: true, mensaje: "Curso completado con éxito." };
    }

    // Resumen del progreso del perfil para la pantalla "Tu Progreso"
    async obtenerProgreso(authId, perfilId) {
        const { perfilExistente } = await perfilService.validarAccesoPerfil(authId, perfilId);
        const resumen = await this.resumirProgreso(perfilId);

        return {
            perfilId,
            xp: perfilExistente.xp ?? 0,
            racha: perfilExistente.racha ?? 0,
            ...resumen
        };
    }

    // No valida acceso: quien la llama decide si puede ver el progreso de este perfil
    async resumirProgreso(perfilId) {
        const cursos = await cursoRepository.obtenerCursos();
        const progresoCursos = await cursoRepository.obtenerProgresoCursos(perfilId);
        const ejercicios = await cursoRepository.obtenerTodosLosEjerciciosConCurso();
        const completadosBD = await cursoRepository.obtenerTodosLosEjerciciosCompletados(perfilId);

        const idsCompletados = completadosBD.map(e => e.ejercicio_id);
        const idsCursosCompletados = progresoCursos.map(p => p.curso_id);
        const cursosConEstado = marcarEstados(cursos, idsCursosCompletados);

        const resumenCursos = cursosConEstado.map(curso => {
            const leccionesCurso = ejercicios.filter(e => mismoId(e.cursoId, curso.id));
            const hechas = leccionesCurso.filter(e => estaEn(idsCompletados, e.id));
            const proxima = leccionesCurso.find(e => !estaEn(idsCompletados, e.id));
            return {
                id: curso.id,
                nombre: curso.nombre,
                nivel: curso.nivel,
                completado: curso.completado,
                desbloqueado: curso.desbloqueado,
                totalLecciones: leccionesCurso.length,
                leccionesCompletadas: hechas.length,
                porcentaje: leccionesCurso.length === 0 ? 0 : Math.round((hechas.length / leccionesCurso.length) * 100),
                proximaLeccion: proxima ? proxima.titulo : null
            };
        });

        // El curso activo es el primero desbloqueado sin completar (o el último si terminó todo)
        const cursoActual =
            resumenCursos.find(c => c.desbloqueado && !c.completado) ||
            resumenCursos[resumenCursos.length - 1] ||
            null;

        return {
            leccionesCompletadas: idsCompletados.length,
            totalLecciones: ejercicios.length,
            cursosCompletados: idsCursosCompletados.length,
            totalCursos: cursos.length,
            cursoActual,
            cursos: resumenCursos
        };
    }
}

export default CursoService;
