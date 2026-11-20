import { pool } from '../database/db.js';
import { manejarErrorDB } from '../helpers/manejoErrores/manejarErrorDB.js';
import { MENSAJES_ERROR_DB } from '../helpers/manejoErrores/mensajesErrorDB.js';

const TIPO_MENSAJE_INVITACION = 'invitacion_ranking';
const CONTENIDO_INVITACION = 'Invitó al grupo a un ranking';

// Compiten quienes aceptaron, siguen en el grupo y tienen el perfil activo.
// Desempate: más racha y, si siguen iguales, el perfil más antiguo (igual que el ranking global de antes).
const POSICIONES = `
    SELECT rp.chat_id, p.id, p.username, p.avatar_url,
           COALESCE(p.xp, 0) AS xp, COALESCE(p.racha, 0) AS racha,
           ROW_NUMBER() OVER (
               PARTITION BY rp.chat_id
               ORDER BY COALESCE(p.xp, 0) DESC, COALESCE(p.racha, 0) DESC, p.created_at ASC, p.id ASC
           )::int AS posicion,
           COUNT(*) OVER (PARTITION BY rp.chat_id)::int AS total
    FROM ranking_participantes rp
    JOIN chat_participantes cp ON cp.chat_id = rp.chat_id AND cp.perfil_id = rp.perfil_id
    JOIN perfiles p ON p.id = rp.perfil_id AND p.activo = true
`;

class RankingRepository {

    async listarDePerfil(perfilId) {
        try {
            const resultado = await pool.query(
                `WITH posiciones AS (${POSICIONES})
                 SELECT c.id AS grupo_id, c.nombre AS grupo_nombre,
                        pos.total AS total_participantes, pos.posicion AS mi_posicion
                 FROM posiciones pos
                 JOIN chats c ON c.id = pos.chat_id
                 WHERE pos.id = $1
                 ORDER BY c.nombre ASC, c.id ASC`,
                [perfilId]
            );
            return resultado.rows;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_RANKING_GRUPO);
        }
    }

    async existe(grupoId) {
        try {
            const resultado = await pool.query(
                'SELECT 1 FROM grupo_rankings WHERE chat_id = $1',
                [grupoId]
            );
            return resultado.rows.length > 0;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_RANKING_GRUPO);
        }
    }

    async listarParticipantes(grupoId) {
        try {
            const resultado = await pool.query(
                `WITH posiciones AS (${POSICIONES})
                 SELECT id, username, avatar_url, xp, racha, posicion
                 FROM posiciones
                 WHERE chat_id = $1
                 ORDER BY posicion ASC`,
                [grupoId]
            );
            return resultado.rows;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_RANKING_GRUPO);
        }
    }

    // Crea el ranking, suma a quien invita y deja la invitación en el chat, todo o nada.
    // Devuelve false si el grupo ya tenía ranking.
    async crearConInvitacion(grupoId, perfilId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const creado = await client.query(
                `INSERT INTO grupo_rankings (chat_id, creador_id)
                 VALUES ($1, $2)
                 ON CONFLICT (chat_id) DO NOTHING
                 RETURNING chat_id`,
                [grupoId, perfilId]
            );
            if (creado.rows.length === 0) {
                await client.query('ROLLBACK');
                return false;
            }
            await client.query(
                'INSERT INTO ranking_participantes (chat_id, perfil_id) VALUES ($1, $2)',
                [grupoId, perfilId]
            );
            await client.query(
                `INSERT INTO mensajes (chat_id, remitente_id, contenido, tipo)
                 VALUES ($1, $2, $3, $4)`,
                [grupoId, perfilId, CONTENIDO_INVITACION, TIPO_MENSAJE_INVITACION]
            );
            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_RANKING_GRUPO);
        } finally {
            client.release();
        }
    }

    async agregarParticipante(grupoId, perfilId) {
        try {
            await pool.query(
                `INSERT INTO ranking_participantes (chat_id, perfil_id)
                 VALUES ($1, $2)
                 ON CONFLICT (chat_id, perfil_id) DO NOTHING`,
                [grupoId, perfilId]
            );
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_RANKING_GRUPO);
        }
    }

    async quitarParticipante(grupoId, perfilId) {
        try {
            await pool.query(
                'DELETE FROM ranking_participantes WHERE chat_id = $1 AND perfil_id = $2',
                [grupoId, perfilId]
            );
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_RANKING_GRUPO);
        }
    }
}

export default RankingRepository;
