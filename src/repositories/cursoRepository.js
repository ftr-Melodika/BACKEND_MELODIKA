import { pool } from '../database/db.js';

class CursoRepository {

    // Obtener todos los cursos (contenido real, ya no mock)
    async obtenerCursos() {
        const query = `SELECT id, nombre, descripcion, nivel, orden FROM cursos ORDER BY orden ASC`;
        const resultado = await pool.query(query);
        return resultado.rows;
    }

    // Obtener un curso puntual
    async obtenerCursoPorId(cursoId) {
        const query = `SELECT id, nombre, descripcion, nivel, orden FROM cursos WHERE id = $1`;
        const resultado = await pool.query(query, [cursoId]);
        return resultado.rows[0] || null;
    }

    // Obtener los ejercicios de un curso (contenido real, ya no mock)
    // Nota: la columna real en la tabla se llama "nombre" (no "titulo"); la
    // traducimos acá con AS para no tener que renombrar todo el resto del código.
    async obtenerEjerciciosDeCurso(cursoId) {
        const query = `
            SELECT id, curso_id, nombre AS titulo, descripcion, tipo, orden, xp_recompensa,
                   youtube_id, duracion_segundos,
                   cuerda, traste_objetivo, nota_esperada, dot_left, dot_bottom,
                   texto_teoria, texto_destacado, instrucciones
            FROM ejercicios
            WHERE curso_id = $1
            ORDER BY orden ASC
        `;
        const resultado = await pool.query(query, [cursoId]);
        return resultado.rows;
    }

    // Todos los ejercicios de todos los cursos, con el nombre del curso (para el endpoint plano que usa el frontend)
    async obtenerTodosLosEjerciciosConCurso() {
        const query = `
            SELECT e.id, e.curso_id, c.nombre AS curso_nombre, e.nombre AS titulo, e.descripcion, e.tipo, e.orden,
                   e.xp_recompensa, e.youtube_id, e.duracion_segundos,
                   e.cuerda, e.traste_objetivo, e.nota_esperada, e.dot_left, e.dot_bottom,
                   e.texto_teoria, e.texto_destacado, e.instrucciones
            FROM ejercicios e
            JOIN cursos c ON c.id = e.curso_id
            ORDER BY c.orden ASC, e.orden ASC
        `;
        const resultado = await pool.query(query);
        return resultado.rows;
    }

    // Obtener los cursos que ya hizo
    async obtenerProgresoCursos(perfilId) {
        try {
            const query = `
                SELECT curso_id 
                FROM progreso_cursos 
                WHERE perfil_id = $1 AND completado = true
            `;
            const resultado = await pool.query(query, [perfilId]);
            return resultado.rows;
        } catch (error) {
            console.error("Error buscando progresos en la BD:", error);
            return [];
        }
    }

    // Obtener los ejercicios que ya hizo de un curso específico
    async obtenerEjerciciosCompletados(perfilId, cursoId) {
        try {
            const query = `
                SELECT progreso_ejercicios.ejercicio_id 
                FROM progreso_ejercicios
                JOIN ejercicios ON progreso_ejercicios.ejercicio_id = ejercicios.id
                WHERE progreso_ejercicios.perfil_id = $1 AND ejercicios.curso_id = $2 AND progreso_ejercicios.completado = true
            `;
            const resultado = await pool.query(query, [perfilId, cursoId]);
            return resultado.rows;
        } catch (error) {
            console.error("Error al obtener ejercicios:", error);
            return [];
        }
    }

    // Obtener TODOS los ejercicios completados de un perfil (para el endpoint plano)
    async obtenerTodosLosEjerciciosCompletados(perfilId) {
        try {
            const query = `
                SELECT ejercicio_id FROM progreso_ejercicios
                WHERE perfil_id = $1 AND completado = true
            `;
            const resultado = await pool.query(query, [perfilId]);
            return resultado.rows;
        } catch (error) {
            console.error("Error al obtener ejercicios completados:", error);
            return [];
        }
    }

    // Verificar si ya completó este ejercicio específico
    async verificarEjercicioCompletado(perfilId, ejercicioId) {
        try {
            const query = `
                SELECT id FROM progreso_ejercicios 
                WHERE perfil_id = $1 AND ejercicio_id = $2 AND completado = true
            `;
            const resultado = await pool.query(query, [perfilId, ejercicioId]);
            return resultado.rows.length > 0;
        } catch (error) {
            return false;
        }
    }

    // Registrar que lo terminó y sumarle el XP al perfil
    async registrarProgresoYSumarXP(perfilId, ejercicioId, xpGanada) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const insertProgreso = `
                INSERT INTO progreso_ejercicios (perfil_id, ejercicio_id, completado)
                VALUES ($1, $2, true)
            `;
            await client.query(insertProgreso, [perfilId, ejercicioId]);

            const updateXP = `
                UPDATE perfiles 
                SET xp = xp + $1 
                WHERE id = $2 
                RETURNING xp
            `;
            const resXP = await client.query(updateXP, [xpGanada, perfilId]);
            const xpTotal = resXP.rows[0] ? resXP.rows[0].xp : xpGanada;

            await client.query('COMMIT');
            return xpTotal;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error("Error guardando progreso y XP:", error);
            throw new Error("No se pudo registrar el progreso en la BD.");
        } finally {
            client.release();
        }
    }
}

export default CursoRepository;