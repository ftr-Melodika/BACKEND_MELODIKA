import { pool } from '../database/db.js';
import Curso from '../entities/Curso.js';
import Ejercicio from '../entities/Ejercicio.js';


class CursoRepository {

    async obtenerCursos() {
        try {
            const query = `SELECT id, nombre, descripcion, instrumento_id, camino_id, nivel, orden, obligatorio FROM cursos ORDER BY orden ASC`;
            const resultado = await pool.query(query);
            return resultado.rows.map(row => new Curso(
                row.id,
                row.nombre,
                row.descripcion,
                row.instrumento_id,
                row.camino_id,
                row.nivel,
                row.orden,
                row.obligatorio
            ));
        } catch (error) {
            manejarErrorDB(error, "Error al obtener cursos:");
        }
    }

    async obtenerCursoPorId(cursoId) {
        try {
            const query = `SELECT id, nombre, descripcion, instrumento_id, camino_id, nivel, orden, obligatorio FROM cursos WHERE id = $1`;
            const resultado = await pool.query(query, [cursoId]);
            
            if (resultado.rows.length === 0) {
                return null;
            }

            const row = resultado.rows[0];
            return new Curso(
                row.id,
                row.nombre,
                row.descripcion,
                row.instrumento_id,
                row.camino_id,
                row.nivel,
                row.orden,
                row.obligatorio
            );
        } catch (error) {
            manejarErrorDB(error, "Error al obtener el curso por ID:");
        }
    }

    async obtenerEjerciciosDeCurso(cursoId) {
        try {
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
            return resultado.rows.map(row => new Ejercicio(
                row.id,
                row.curso_id,
                row.titulo,
                row.descripcion,
                row.tipo,
                row.orden,
                row.xp_recompensa,
                row.youtube_id,
                row.duracion_segundos,
                row.cuerda,
                row.traste_objetivo,
                row.nota_esperada,
                row.dot_left,
                row.dot_bottom,
                row.texto_teoria,
                row.texto_destacado,
                row.instrucciones
            ));
        } catch (error) {
            manejarErrorDB(error, "Error al obtener ejercicios del curso:");
        }
    }

    async obtenerTodosLosEjerciciosConCurso() {
        try {
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
            return resultado.rows.map(row => {
                const ejercicio = new Ejercicio(
                    row.id,
                    row.curso_id,
                    row.titulo,
                    row.descripcion,
                    row.tipo,
                    row.orden,
                    row.xp_recompensa,
                    row.youtube_id,
                    row.duracion_segundos,
                    row.cuerda,
                    row.traste_objetivo,
                    row.nota_esperada,
                    row.dot_left,
                    row.dot_bottom,
                    row.texto_teoria,
                    row.texto_destacado,
                    row.instrucciones
                );
                ejercicio.cursoNombre = row.curso_nombre;
                return ejercicio;
            });
        } catch (error) {
            manejarErrorDB(error, "Error al obtener todos los ejercicios:");
        }
    }

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
            manejarErrorDB(error, "Error buscando progresos en la BD:");
        }
    }

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
            manejarErrorDB(error, "Error al obtener ejercicios completados:");
        }
    }

    async obtenerTodosLosEjerciciosCompletados(perfilId) {
        try {
            const query = `
                SELECT ejercicio_id FROM progreso_ejercicios
                WHERE perfil_id = $1 AND completado = true
            `;
            const resultado = await pool.query(query, [perfilId]);
            return resultado.rows;
        } catch (error) {
            manejarErrorDB(error, "Error al obtener todos los ejercicios completados:");
        }
    }

    async verificarEjercicioCompletado(perfilId, ejercicioId) {
        try {
            const query = `
                SELECT id FROM progreso_ejercicios 
                WHERE perfil_id = $1 AND ejercicio_id = $2 AND completado = true
            `;
            const resultado = await pool.query(query, [perfilId, ejercicioId]);
            return resultado.rows.length > 0;
        } catch (error) {
            manejarErrorDB(error, "Error al verificar ejercicio completado:");
        }
    }

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
            manejarErrorDB(error, "Error guardando progreso y XP:", "No se pudo registrar el progreso en la BD.");
        } finally {
            client.release();
        }
    }

    async registrarCursoCompletado(perfilId, cursoId) {
        try {
            const query = `
                INSERT INTO progreso_cursos (perfil_id, curso_id, completado)
                VALUES ($1, $2, true)
            `;
            await pool.query(query, [perfilId, cursoId]);
            return true;
        } catch (error) {
            manejarErrorDB(error, "Error al registrar curso completado:", "No se pudo registrar el curso completado.");
        }
    }
}

export default CursoRepository;
