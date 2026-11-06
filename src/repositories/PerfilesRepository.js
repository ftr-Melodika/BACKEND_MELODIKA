import { pool } from '../database/db.js';
import Perfil from '../entities/Perfiles.js';
import { manejarErrorDB } from '../helpers/manejoErrores/manejarErrorDB.js';
import { MENSAJES_ERROR_DB } from '../helpers/manejoErrores/mensajesErrorDB.js';

// Zona horaria usada para decidir qué es "hoy" en la racha
const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

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
                row.activo,
                row.es_publico === true
            ));
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.BUSCAR_PERFILES);
        }
    }
    
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
                perfil.activo,
                perfil.es_publico === true
            );
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.CREAR_PERFIL);
        }
    }

    // La racha NO puede usar perfiles.updated_at: un trigger lo pisa en cada UPDATE
    // (por ejemplo al sumar XP), y entonces siempre parecería que "ya entró hoy".
    // Guardamos cada día de práctica como un evento 'racha_diaria' en la tabla eventos.
    async actualizarRachaDiaria(perfilId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Días de calendario (hora argentina) desde el último día que sumó racha.
            // Si nunca sumó, usamos 999 para que arranque una racha nueva.
            const info = await client.query(`
                SELECT p.racha,
                       COALESCE(
                           (NOW() AT TIME ZONE '${ZONA_HORARIA}')::date
                           - (
                               SELECT MAX(e.created_at AT TIME ZONE '${ZONA_HORARIA}')::date
                               FROM eventos e
                               WHERE e.perfil_id = p.id AND e.nombre = 'racha_diaria'
                             ),
                           999
                       ) AS dias_pasados
                FROM perfiles p
                WHERE p.id = $1
                FOR UPDATE
            `, [perfilId]);

            if (info.rows.length === 0) {
                await client.query('ROLLBACK');
                return undefined;
            }

            const { racha, dias_pasados } = info.rows[0];
            if (dias_pasados === 0) {
                // Ya sumó racha hoy: no suma ni pierde
                await client.query('COMMIT');
                return { racha: racha ?? 0, dias_pasados };
            }

            const nuevaRacha = dias_pasados <= 3 ? (racha ?? 0) + 1 : 1;
            await client.query('UPDATE perfiles SET racha = $1 WHERE id = $2', [nuevaRacha, perfilId]);
            await client.query(
                `INSERT INTO eventos (perfil_id, nombre, datos) VALUES ($1, 'racha_diaria', $2)`,
                [perfilId, JSON.stringify({ racha: nuevaRacha })]
            );

            await client.query('COMMIT');
            return { racha: nuevaRacha, dias_pasados };
        } catch (error) {
            await client.query('ROLLBACK');
            manejarErrorDB(error, MENSAJES_ERROR_DB.ACTUALIZAR_RACHA);
        } finally {
            client.release();
        }
    }

    // Feedback, reportes y consultas se guardan como eventos: nombre = tipo, datos = { categoria, mensaje }
    async registrarMensaje(perfilId, tipo, datos) {
        try {
            const resultado = await pool.query(
                'INSERT INTO eventos (perfil_id, nombre, datos) VALUES ($1, $2, $3) RETURNING id, created_at',
                [perfilId, tipo, JSON.stringify(datos)]
            );
            return resultado.rows[0];
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GUARDAR_MENSAJE);
        }
    }

    // Ranking Global
    async obtenerTopRanking() {
        try {
            const query = `
                SELECT id, nombre, username, avatar_url, COALESCE(xp, 0) AS xp, COALESCE(racha, 0) AS racha
                FROM perfiles
                WHERE activo = true
                ORDER BY COALESCE(xp, 0) DESC, COALESCE(racha, 0) DESC, created_at ASC
                LIMIT 10;
            `;
            const resultado = await pool.query(query);
            return resultado.rows;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.OBTENER_RANKING);
        }
    }

    // Realiza un borrado lógico del perfil
    async eliminarPerfil(perfilId, cuentaId) {
        try {
            const query = `
                UPDATE perfiles 
                SET activo = false
                WHERE id = $1 AND cuenta_id = $2 AND activo = true
                RETURNING id;
            `;
            
            const resultado = await pool.query(query, [perfilId, cuentaId]);
            
            // Si rowCount > 0 significa que encontró el perfil y lo actualizó.
            // Si es 0, significa que el perfil no existía, ya estaba borrado o es de otra cuenta.
            return resultado.rowCount > 0;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.ELIMINAR_PERFIL);
        }
    }

    async actualizarPerfil(perfilId, cuentaId, datosPerfil) {
        try {
            // es_publico solo entra si lo mandaron: `false` es un valor válido y COALESCE con `|| null` lo perdería
            const cambiaPrivacidad = datosPerfil.esPublico !== undefined;
            const query = `
                UPDATE perfiles
                SET
                    nombre = COALESCE($1, nombre),
                    avatar_url = COALESCE($2, avatar_url),
                    pais = COALESCE($3, pais),
                    fecha_nacimiento = COALESCE($4, fecha_nacimiento),
                    genero = COALESCE($5, genero),
                    ${cambiaPrivacidad ? 'es_publico = $8,' : ''}
                    updated_at = NOW()
                WHERE id = $6 AND cuenta_id = $7 AND activo = true
                RETURNING *;
            `;

            const values = [
                datosPerfil.nombre || null,
                datosPerfil.avatarUrl || null,
                datosPerfil.pais || null,
                datosPerfil.fecha_nacimiento || null,
                datosPerfil.genero || null,
                perfilId,
                cuentaId
            ];
            if (cambiaPrivacidad) values.push(datosPerfil.esPublico);

            const resultado = await pool.query(query, values);
            
            if (resultado.rows.length === 0) {
                return null; // No encontró el perfil o no es de esa cuenta
            }

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
                perfil.activo,
                perfil.es_publico === true
            );
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.ACTUALIZAR_PERFIL);
        }
    }

    // Busca un perfil específico por su ID sin importar su estado
    async obtenerPorId(perfilId) {
        try {
            const query = 'SELECT * FROM perfiles WHERE id = $1';
            const resultado = await pool.query(query, [perfilId]);
            
            if (resultado.rows.length === 0) {
                return null;
            }
            
            const row = resultado.rows[0];
            // Mapeamos a tu entidad Perfil
            return new Perfil(
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
                row.activo,
                row.es_publico === true
            );
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.OBTENER_PERFIL_POR_ID);
        }
    }

}

export default PerfilRepository;