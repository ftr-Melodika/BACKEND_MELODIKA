import CursoRepository from "../repositories/cursoRepository.js";

const cursoRepository = new CursoRepository();

class CursoService {
    // Devuelve la lista de cursos evaluando el progreso (ahora 100% desde la DB)
    async listarCursos(perfilId) {
        const cursos = await cursoRepository.obtenerCursos();
        const cursosCompletadosDB = await cursoRepository.obtenerProgresoCursos(perfilId);
        const idsCompletados = new Set(cursosCompletadosDB.map(progreso => progreso.curso_id));

        let maxOrdenCompletado = 0;

        cursos.forEach(curso => {
            if (idsCompletados.has(curso.id) && curso.orden > maxOrdenCompletado) {
                maxOrdenCompletado = curso.orden;
            }
        });

        const cursosConEstado = cursos.map(curso => {
            const completado = idsCompletados.has(curso.id);
            const desbloqueado = curso.orden === 1 || curso.orden <= (maxOrdenCompletado + 1);

            return { ...curso, completado, desbloqueado };
        });

        return {
            perfilId,
            totalCursos: cursos.length,
            cursos: cursosConEstado
        };
    }

    // Devuelve la vista interna de un curso específico y sus lecciones (ahora 100% desde la DB)
    async obtenerDetalleCurso(cursoId, perfilId) {
        const cursoInfo = await cursoRepository.obtenerCursoPorId(cursoId);
        if (!cursoInfo) return null;

        const lecciones = await cursoRepository.obtenerEjerciciosDeCurso(cursoId);

        const ejerciciosCompletadosDB = await cursoRepository.obtenerEjerciciosCompletados(perfilId, cursoId);
        const idsCompletados = new Set(ejerciciosCompletadosDB.map(e => e.ejercicio_id));

        let maxOrdenCompletado = 0;
        lecciones.forEach(leccion => {
            if (idsCompletados.has(leccion.id) && leccion.orden > maxOrdenCompletado) {
                maxOrdenCompletado = leccion.orden;
            }
        });

        const leccionesConEstado = lecciones.map(leccion => {
            const completado = idsCompletados.has(leccion.id);
            const desbloqueado = leccion.orden === 1 || leccion.orden <= (maxOrdenCompletado + 1);

            return { ...leccion, completado, desbloqueado };
        });

        return { ...cursoInfo, totalLecciones: lecciones.length, lecciones: leccionesConEstado };
    }

    // Endpoint plano que consume LeccionScreen/leccionesService del frontend:
    // GET /cursos/guitarra/progreso/:perfilId
    // Devuelve TODOS los ejercicios de TODOS los cursos en una sola lista, ya con
    // el nombre de campo que espera el frontend (estado, videoId, trasteObjetivo, etc.)
    async obtenerLeccionesPlano(perfilId) {
        const ejercicios = await cursoRepository.obtenerTodosLosEjerciciosConCurso();
        const completadosDB = await cursoRepository.obtenerTodosLosEjerciciosCompletados(perfilId);
        const idsCompletados = new Set(completadosDB.map(e => e.ejercicio_id));

        // Agrupamos por curso para poder calcular desbloqueo en orden, curso por curso
        const porCurso = {};
        ejercicios.forEach(ej => {
            if (!porCurso[ej.curso_id]) porCurso[ej.curso_id] = [];
            porCurso[ej.curso_id].push(ej);
        });

        const resultado = [];
        Object.values(porCurso).forEach(listaDelCurso => {
            let maxOrdenCompletado = 0;
            listaDelCurso.forEach(ej => {
                if (idsCompletados.has(ej.id) && ej.orden > maxOrdenCompletado) {
                    maxOrdenCompletado = ej.orden;
                }
            });

            listaDelCurso.forEach(ej => {
                const completado = idsCompletados.has(ej.id);
                const desbloqueado = ej.orden === 1 || ej.orden <= (maxOrdenCompletado + 1);

                let estado = 'bloqueada';
                if (completado) estado = 'completada';
                else if (desbloqueado) estado = 'disponible';

                resultado.push({
                    id: ej.id,
                    titulo: ej.titulo,
                    tipo: ej.tipo,
                    estado,
                    xp: ej.xp_recompensa,
                    videoId: ej.youtube_id || null,
                    instrucciones: ej.instrucciones || [],
                    textoTeoria: ej.texto_teoria || null,
                    textoDestacado: ej.texto_destacado || null,
                    trasteObjetivo: ej.traste_objetivo !== null ? String(ej.traste_objetivo) : null,
                    cuerda: ej.cuerda !== null ? ej.cuerda : null,
                    notaEsperada: ej.nota_esperada || null,
                    dotLeft: ej.dot_left || null,
                    dotBottom: ej.dot_bottom || null
                });
            });
        });

        return resultado;
    }

    async completarLeccion(perfilId, cursoId, leccionId) {
        const leccionesDelCurso = await cursoRepository.obtenerEjerciciosDeCurso(cursoId);
        const leccion = leccionesDelCurso.find(l => l.id === leccionId);
        if (!leccion) return { exito: false, mensaje: "Ejercicio no encontrado." };

        const yaCompletada = await cursoRepository.verificarEjercicioCompletado(perfilId, leccionId);
        if (yaCompletada) return { exito: false, mensaje: "Ya habías reclamado el XP de este ejercicio." };

        const xpGanada = leccion.xp_recompensa;
        const xpTotal = await cursoRepository.registrarProgresoYSumarXP(perfilId, leccionId, xpGanada);

        return { exito: true, xpGanada, xpTotal };
    }
}

export default CursoService;