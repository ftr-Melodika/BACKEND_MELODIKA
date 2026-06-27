import { pool } from '../database/db.js';
import Perfil from '../entities/Perfiles.js';

class PerfilRepository {
    
    // Trae todos los perfiles activos de una cuenta específica
    async obtenerPorCuentaId(cuentaId) {
        try {
            const query = 'SELECT * FROM perfiles WHERE cuenta_id = $1 AND activo = true';
            const resultado = await pool.query(query, [cuentaId]);
            
            // Transformamos cada fila de la BD en un objeto de nuestra Entidad
            return resultado.rows.map(row => new Perfil(
                row.id,
                row.cuenta_id,
                row.nombre,
                row.username,
                row.avatar_url,
                row.pais,
                row.fecha_nacimiento,
                row.genero,
                row.xp,
                row.racha,
                row.instrumento_actual_id,
                row.activo
            ));
        } catch (error) {
            console.error("Error buscando perfiles en la base de datos:", error);
            const err = new Error("Error al conectar con la base de datos para buscar perfiles", { cause: error });
            err.code = error.code;
            throw err;
        }
    }
    //VERIFICAR ESTO
    // Inserta un nuevo perfil en la base de datos
    async crearPerfil(cuentaId, datosPerfil) {
        try {
            const query = `
                INSERT INTO perfiles (cuenta_id, nombre, username, avatar_url, pais, fecha_nacimiento, genero) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) 
                RETURNING *;
            `;
            
            const values = [
                cuentaId, 
                datosPerfil.nombre, 
                datosPerfil.username, 
                datosPerfil.avatarUrl || null, 
                datosPerfil.pais,
                datosPerfil.fecha_nacimiento || null,
                datosPerfil.genero || null
            ];
            
            const resultado = await pool.query(query, values);
            const perfil = resultado.rows[0];

            return new Perfil(
                perfil.id,
                perfil.cuenta_id,
                perfil.nombre,
                perfil.username,
                perfil.avatar_url,
                perfil.pais,
                perfil.fecha_nacimiento,
                perfil.genero,
                perfil.xp,
                perfil.racha,
                perfil.instrumento_actual_id,
                perfil.activo
            );
        } catch (error) {
            console.error("Error creando perfil en la base de datos:", error);
            const err = new Error("No se pudo crear el perfil en la base de datos", { cause: error });
            err.code = error.code;
            err.constraint = error.constraint;
            throw err;
        }
    }

    async actualizarRachaDiaria(perfilId) {
        try {
            // CURRENT_DATE - updated_at::date calcula los días exactos de calendario que pasaron
            const query = `
                WITH info AS (
                    SELECT racha, (CURRENT_DATE - updated_at::date) AS dias_pasados
                    FROM perfiles
                    WHERE id = $1
                )
                UPDATE perfiles
                SET 
                    racha = CASE 
                        WHEN info.dias_pasados = 0 THEN perfiles.racha -- Ya entró hoy, no suma ni pierde
                        WHEN info.dias_pasados <= 3 THEN perfiles.racha + 1 -- Entró dentro de los 3 días!
                        ELSE 1 -- Pasaron más de 3 días, la racha se reinicia a 1
                    END,
                    updated_at = NOW() -- Actualizamos su última conexión
                FROM info
                WHERE id = $1
                RETURNING perfiles.racha, info.dias_pasados;
            `;
            const resultado = await pool.query(query, [perfilId]);
            return resultado.rows[0]; 
        } catch (error) {
            console.error("Error al actualizar la racha:", error);
            throw new Error("No se pudo procesar la racha.");
        }
    }

    // Ranking Global
    async obtenerTopRanking() {
        try {
            const query = `
                SELECT username, avatar_url, xp, racha 
                FROM perfiles 
                WHERE activo = true
                ORDER BY xp DESC 
                LIMIT 10;
            `;
            const resultado = await pool.query(query);
            return resultado.rows;
        } catch (error) {
            console.error("Error al obtener el ranking:", error);
            // Hacemos que el error suba al Service y luego al Controller
            throw new Error("Error al cargar el ranking"); 
        }
    }
}

export default PerfilRepository;