import CursoRepository from "../repositories/cursoRepository.js";
import perfilService from "./perfilService.js"; // Importamos la instancia exportada

const cursoRepository = new CursoRepository();

class CursoService {
         
    async listarCursos(authId, perfilId) {
        // 🔒 1. Barrera de seguridad: delegamos la validación a perfilService
        await perfilService.validarAccesoPerfil(authId, perfilId);

        // PASO 1: Traemos los datos crudos de la BD
        const cursos = await cursoRepository.obtenerCursos();
        const progresosBD = await cursoRepository.obtenerProgresoCursos(perfilId);

        // Armamos una lista simple solo con los IDs de los cursos terminados
        const idsCompletados = progresosBD.map(progreso => progreso.curso_id);

        // PASO 2: Buscamos cuál es el curso más avanzado que terminó
        let maxOrdenCompletado = 0;
        for (const curso of cursos) {
            if (idsCompletados.includes(curso.id)) {
                if (curso.orden > maxOrdenCompletado) {
                    maxOrdenCompletado = curso.orden;
                }
            }
        }

        // PASO 3: Armamos la respuesta diciendo si cada curso está bloqueado o no
        const cursosFinales = cursos.map(curso => {
            const completado = idsCompletados.includes(curso.id);
            // Se desbloquea si es el primero (orden 1) o si es el que le sigue al máximo completado
            const desbloqueado = (curso.orden === 1) || (curso.orden <= maxOrdenCompletado + 1);
            return { ...curso, completado, desbloqueado };
        });

        return {
            perfilId,
            totalCursos: cursos.length,
            cursos: cursosFinales
        };
    }

    async obtenerDetalleCurso(authId, cursoId, perfilId) {
        // 🔒 1. Barrera de seguridad
        await perfilService.validarAccesoPerfil(authId, perfilId);

        // PASO 1: Traemos la info del curso y sus ejercicios
        const cursoInfo = await cursoRepository.obtenerCursoPorId(cursoId);
        if (!cursoInfo) return null; // Si no existe el curso, cortamos acá

        const lecciones = await cursoRepository.obtenerEjerciciosDeCurso(cursoId);
        const ejerciciosCompletadosBD = await cursoRepository.obtenerEjerciciosCompletados(perfilId, cursoId);
        
        const idsCompletados = ejerciciosCompletadosBD.map(e => e.ejercicio_id);

        // PASO 2: Buscamos el ejercicio más avanzado que terminó dentro de este curso
        let maxOrdenCompletado = 0;
        for (const leccion of lecciones) {
            if (idsCompletados.includes(leccion.id)) {
                if (leccion.orden > maxOrdenCompletado) {
                    maxOrdenCompletado = leccion.orden;
                }
            }
        }

        // PASO 3: Definimos el estado de cada lección
        const leccionesFinales = lecciones.map(leccion => {
            const completado = idsCompletados.includes(leccion.id);
            const desbloqueado = (leccion.orden === 1) || (leccion.orden <= maxOrdenCompletado + 1);
            return { ...leccion, completado, desbloqueado };
        });

        return { 
             ...cursoInfo, 
             totalLecciones: lecciones.length, 
             lecciones: leccionesFinales 
         };
    }

    async completarLeccion(authId, perfilId, cursoId, leccionId) {
        // 🔒 1. Barrera de seguridad
        await perfilService.validarAccesoPerfil(authId, perfilId);

        // 1. Buscamos la lección para saber cuánta XP da
        const leccionesDelCurso = await cursoRepository.obtenerEjerciciosDeCurso(cursoId);
        const leccion = leccionesDelCurso.find(l => l.id === leccionId);
        if (!leccion) throw new Error("Ejercicio no encontrado.");

        // 2. Verificamos que no haga trampa pidiendo la XP dos veces
        const yaCompletada = await cursoRepository.verificarEjercicioCompletado(perfilId, leccionId);
        if (yaCompletada) throw new Error("Ya habías reclamado el XP de este ejercicio.");

        // 3. Guardamos el progreso y sumamos la XP
        const xpGanada = leccion.xp_recompensa;
        const xpTotal = await cursoRepository.registrarProgresoYSumarXP(perfilId, leccionId, xpGanada);

        return { exito: true, xpGanada, xpTotal };
    }

    async completarCurso(authId, perfilId, cursoId) {
        // 🔒 1. Barrera de seguridad
        await perfilService.validarAccesoPerfil(authId, perfilId);

        // 1. Verificamos que haya completado todos los ejercicios del curso
        const leccionesDelCurso = await cursoRepository.obtenerEjerciciosDeCurso(cursoId);
        const ejerciciosCompletados = await cursoRepository.obtenerEjerciciosCompletados(perfilId, cursoId);
        if (leccionesDelCurso.length !== ejerciciosCompletados.length) {
            throw new Error("No has completado todos los ejercicios del curso.");
        }

        // Podrías validar acá si realmente hizo todos los ejercicios antes de dejarlo terminar
        await cursoRepository.registrarCursoCompletado(perfilId, cursoId);
        return { exito: true, mensaje: "Curso completado con éxito." };
    }
}

export default CursoService;