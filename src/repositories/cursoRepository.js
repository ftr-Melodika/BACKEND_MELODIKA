import { pool } from '../database/db.js';

class CursoRepository {
    
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
            // Hacemos un JOIN con la tabla ejercicios para poder filtrar por curso_id
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

            // A) Insertamos en progreso_ejercicios (ahora coincidiendo exacto con tus columnas)
            const insertProgreso = `
                INSERT INTO progreso_ejercicios (perfil_id, ejercicio_id, completado)
                VALUES ($1, $2, true)
            `;
            await client.query(insertProgreso, [perfilId, ejercicioId]);

            // B) Sumamos los XP al perfil en la tabla perfiles (tu tabla perfiles tiene el campo "xp")
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