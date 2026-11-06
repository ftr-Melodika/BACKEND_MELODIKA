import { pool } from '../database/db.js';
import { manejarErrorDB } from '../helpers/manejoErrores/manejarErrorDB.js';
import { MENSAJES_ERROR_DB } from '../helpers/manejoErrores/mensajesErrorDB.js';

const UNIQUE_VIOLATION = '23505';

const BUSCAR_PAR = `
    SELECT id, perfil_1_id, perfil_2_id, estado
    FROM amistades
    WHERE (perfil_1_id = $1 AND perfil_2_id = $2) OR (perfil_1_id = $2 AND perfil_2_id = $1)
    LIMIT 1
`;

class AmistadRepository {

    async obtenerPorId(amistadId) {
        try {
            const resultado = await pool.query(
                'SELECT id, perfil_1_id, perfil_2_id, estado FROM amistades WHERE id = $1',
                [amistadId]
            );
            return resultado.rows[0] ?? null;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_AMISTADES);
        }
    }

    async obtenerEntre(perfilId, otroId) {
        try {
            const resultado = await pool.query(BUSCAR_PAR, [perfilId, otroId]);
            return resultado.rows[0] ?? null;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_AMISTADES);
        }
    }

    // Devuelve { amistad } si quedó pendiente, o { existente } si el par ya está ocupado.
    // { existente: null } significa que otra solicitud ganó la carrera contra el índice único.
    async enviarSolicitud(emisorId, destinoId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const previa = await client.query(`${BUSCAR_PAR} FOR UPDATE`, [emisorId, destinoId]);
            const existente = previa.rows[0];

            if (existente && existente.estado !== 'rechazada') {
                await client.query('ROLLBACK');
                return { existente };
            }

            // Una solicitud rechazada se reenvía sobre la misma fila, con el nuevo emisor
            const resultado = existente
                ? await client.query(
                    `UPDATE amistades
                     SET perfil_1_id = $1, perfil_2_id = $2, estado = 'pendiente', created_at = NOW()
                     WHERE id = $3
                     RETURNING id, estado`,
                    [emisorId, destinoId, existente.id]
                )
                : await client.query(
                    `INSERT INTO amistades (perfil_1_id, perfil_2_id, estado)
                     VALUES ($1, $2, 'pendiente')
                     RETURNING id, estado`,
                    [emisorId, destinoId]
                );

            await client.query('COMMIT');
            return { amistad: resultado.rows[0] };
        } catch (error) {
            await client.query('ROLLBACK');
            if (error.code === UNIQUE_VIOLATION) {
                return { existente: null };
            }
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_AMISTADES);
        } finally {
            client.release();
        }
    }

    // Solo el destinatario puede responder y solo mientras siga pendiente
    async responderSolicitud(amistadId, destinatarioId, nuevoEstado) {
        try {
            const resultado = await pool.query(
                `UPDATE amistades
                 SET estado = $3
                 WHERE id = $1 AND perfil_2_id = $2 AND estado = 'pendiente'
                 RETURNING id, estado`,
                [amistadId, destinatarioId, nuevoEstado]
            );
            return resultado.rows[0] ?? null;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_AMISTADES);
        }
    }

    // Borra una amistad de la que participa, o una solicitud pendiente que envió
    async eliminar(amistadId, perfilId) {
        try {
            const resultado = await pool.query(
                `DELETE FROM amistades
                 WHERE id = $1
                   AND (
                        (estado = 'aceptada' AND (perfil_1_id = $2 OR perfil_2_id = $2))
                        OR (estado = 'pendiente' AND perfil_1_id = $2)
                   )
                 RETURNING id`,
                [amistadId, perfilId]
            );
            return resultado.rowCount > 0;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_AMISTADES);
        }
    }

    async listarSolicitudesPendientes(perfilId) {
        try {
            const resultado = await pool.query(
                `SELECT a.id AS amistad_id, a.created_at, a.perfil_2_id = $1 AS recibida,
                        p.id, p.nombre, p.username, p.avatar_url
                 FROM amistades a
                 JOIN perfiles p
                   ON p.id = CASE WHEN a.perfil_2_id = $1 THEN a.perfil_1_id ELSE a.perfil_2_id END
                 WHERE (a.perfil_1_id = $1 OR a.perfil_2_id = $1)
                   AND a.estado = 'pendiente'
                   AND p.activo = true
                 ORDER BY a.created_at DESC`,
                [perfilId]
            );
            return resultado.rows;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_AMISTADES);
        }
    }

    async listarAmigos(perfilId) {
        try {
            const resultado = await pool.query(
                `SELECT a.id AS amistad_id, p.id, p.nombre, p.username, p.avatar_url
                 FROM amistades a
                 JOIN perfiles p
                   ON p.id = CASE WHEN a.perfil_2_id = $1 THEN a.perfil_1_id ELSE a.perfil_2_id END
                 WHERE (a.perfil_1_id = $1 OR a.perfil_2_id = $1)
                   AND a.estado = 'aceptada'
                   AND p.activo = true
                 ORDER BY p.nombre ASC`,
                [perfilId]
            );
            return resultado.rows;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_AMISTADES);
        }
    }

    async contarAmigos(perfilId) {
        try {
            const resultado = await pool.query(
                `SELECT COUNT(*)::int AS total
                 FROM amistades a
                 JOIN perfiles p
                   ON p.id = CASE WHEN a.perfil_2_id = $1 THEN a.perfil_1_id ELSE a.perfil_2_id END
                 WHERE (a.perfil_1_id = $1 OR a.perfil_2_id = $1)
                   AND a.estado = 'aceptada'
                   AND p.activo = true`,
                [perfilId]
            );
            return resultado.rows[0].total;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_AMISTADES);
        }
    }
}

export default AmistadRepository;
