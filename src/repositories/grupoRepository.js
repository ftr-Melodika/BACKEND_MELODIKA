import { pool } from '../database/db.js';
import { manejarErrorDB } from '../helpers/manejoErrores/manejarErrorDB.js';
import { MENSAJES_ERROR_DB } from '../helpers/manejoErrores/mensajesErrorDB.js';

const UNIQUE_VIOLATION = '23505';
const INDICE_CODIGO_UNICO = 'chats_codigo_unico';
const MAX_RESULTADOS_BUSQUEDA = 30;

// Resultado de crear() cuando el código generado ya lo tiene otro grupo (se reintenta con otro)
export const CODIGO_REPETIDO = 'codigo-repetido';
const ROL_ADMIN = 'admin';
const ROL_MIEMBRO = 'miembro';

// Los perfiles dados de baja siguen en chat_participantes, pero no cuentan como miembros
const TOTAL_MIEMBROS = `(
    SELECT COUNT(*)::int
    FROM chat_participantes cp
    JOIN perfiles p ON p.id = cp.perfil_id
    WHERE cp.chat_id = c.id AND p.activo = true
)`;

const CAMPOS_MENSAJE = `
    m.id, m.tipo, m.contenido, m.created_at, m.remitente_id,
    p.nombre AS remitente_nombre, p.username AS remitente_username
`;

// Escapa los comodines de ILIKE para que el texto buscado se tome literal
const aPatronBusqueda = (texto) => `%${texto.replace(/[\\%_]/g, '\\$&')}%`;

class GrupoRepository {

    async listarDePerfil(perfilId) {
        try {
            const resultado = await pool.query(
                `SELECT c.id, c.nombre, c.descripcion, c.creador_id, c.es_privado, ${TOTAL_MIEMBROS} AS total_miembros,
                        ultimo.contenido AS ultimo_contenido,
                        ultimo.created_at AS ultimo_created_at,
                        ultimo.remitente_nombre AS ultimo_remitente_nombre
                 FROM chat_participantes yo
                 JOIN chats c ON c.id = yo.chat_id AND c.es_grupo = true
                 LEFT JOIN LATERAL (
                     SELECT m.contenido, m.created_at, p.nombre AS remitente_nombre
                     FROM mensajes m
                     LEFT JOIN perfiles p ON p.id = m.remitente_id
                     WHERE m.chat_id = c.id
                     ORDER BY m.created_at DESC, m.id DESC
                     LIMIT 1
                 ) ultimo ON true
                 WHERE yo.perfil_id = $1
                 ORDER BY COALESCE(ultimo.created_at, c.created_at) DESC, c.id DESC`,
                [perfilId]
            );
            return resultado.rows;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_GRUPOS);
        }
    }

    async buscar(perfilId, texto) {
        try {
            const resultado = await pool.query(
                `SELECT c.id, c.nombre, c.descripcion, c.es_privado, ${TOTAL_MIEMBROS} AS total_miembros,
                        EXISTS (
                            SELECT 1 FROM chat_participantes yo
                            WHERE yo.chat_id = c.id AND yo.perfil_id = $1
                        ) AS unido
                 FROM chats c
                 WHERE c.es_grupo = true
                   AND ($2::text IS NULL OR c.nombre ILIKE $2 ESCAPE '\\' OR c.descripcion ILIKE $2 ESCAPE '\\')
                 ORDER BY total_miembros DESC, c.nombre ASC, c.id ASC
                 LIMIT ${MAX_RESULTADOS_BUSQUEDA}`,
                [perfilId, texto ? aPatronBusqueda(texto) : null]
            );
            return resultado.rows;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_GRUPOS);
        }
    }

    // Crea el grupo con su creador como admin y los integrantes indicados como miembros, todo junto.
    // codigo: null para un grupo público. Devuelve el id del grupo, null si el nombre ya está en uso,
    // o CODIGO_REPETIDO si el código ya lo tiene otro grupo.
    async crear(perfilId, nombre, descripcion, miembroIds = [], codigo = null) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const creado = await client.query(
                `INSERT INTO chats (es_grupo, nombre, descripcion, creador_id, es_privado, codigo)
                 VALUES (true, $1, $2, $3, $4, $5)
                 RETURNING id`,
                [nombre, descripcion, perfilId, codigo !== null, codigo]
            );
            const grupoId = creado.rows[0].id;
            await client.query(
                `INSERT INTO chat_participantes (chat_id, perfil_id, rol) VALUES ($1, $2, '${ROL_ADMIN}')`,
                [grupoId, perfilId]
            );
            if (miembroIds.length > 0) {
                await client.query(
                    `INSERT INTO chat_participantes (chat_id, perfil_id, rol)
                     SELECT $1, miembro_id, '${ROL_MIEMBRO}' FROM unnest($2::uuid[]) AS miembro_id`,
                    [grupoId, miembroIds]
                );
            }
            await client.query('COMMIT');
            return grupoId;
        } catch (error) {
            await client.query('ROLLBACK');
            if (error.code === UNIQUE_VIOLATION) {
                return error.constraint === INDICE_CODIGO_UNICO ? CODIGO_REPETIDO : null;
            }
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_GRUPOS);
        } finally {
            client.release();
        }
    }

    async obtenerPorId(grupoId, perfilId) {
        try {
            const resultado = await pool.query(
                `SELECT c.id, c.nombre, c.descripcion, c.creador_id, c.es_privado, c.codigo,
                        ${TOTAL_MIEMBROS} AS total_miembros,
                        EXISTS (
                            SELECT 1 FROM chat_participantes yo
                            WHERE yo.chat_id = c.id AND yo.perfil_id = $2
                        ) AS unido
                 FROM chats c
                 WHERE c.id = $1 AND c.es_grupo = true`,
                [grupoId, perfilId]
            );
            return resultado.rows[0] ?? null;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_GRUPOS);
        }
    }

    // El grupo privado que tiene ese código exacto (distingue mayúsculas), o null
    async obtenerIdPorCodigo(codigo) {
        try {
            const resultado = await pool.query(
                'SELECT id FROM chats WHERE codigo = $1 AND es_grupo = true AND es_privado = true',
                [codigo]
            );
            return resultado.rows[0]?.id ?? null;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_GRUPOS);
        }
    }

    async listarMiembros(grupoId) {
        try {
            const resultado = await pool.query(
                `SELECT p.id, p.nombre, p.username, cp.rol
                 FROM chat_participantes cp
                 JOIN perfiles p ON p.id = cp.perfil_id
                 WHERE cp.chat_id = $1 AND p.activo = true
                 ORDER BY p.nombre ASC, p.id ASC`,
                [grupoId]
            );
            return resultado.rows;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_GRUPOS);
        }
    }

    async agregarMiembro(grupoId, perfilId) {
        try {
            await pool.query(
                `INSERT INTO chat_participantes (chat_id, perfil_id)
                 VALUES ($1, $2)
                 ON CONFLICT (chat_id, perfil_id) DO NOTHING`,
                [grupoId, perfilId]
            );
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_GRUPOS);
        }
    }

    async quitarMiembro(grupoId, perfilId) {
        try {
            await pool.query(
                'DELETE FROM chat_participantes WHERE chat_id = $1 AND perfil_id = $2',
                [grupoId, perfilId]
            );
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_GRUPOS);
        }
    }

    // Filtra por chat para que un cursor de otro chat no sirva para leer este
    async existeMensaje(grupoId, mensajeId) {
        try {
            const resultado = await pool.query(
                'SELECT 1 FROM mensajes WHERE id = $1 AND chat_id = $2',
                [mensajeId, grupoId]
            );
            return resultado.rows.length > 0;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_GRUPOS);
        }
    }

    // Más recientes primero, opcionalmente anteriores a un mensaje
    async listarMensajesRecientes(grupoId, limite, antesDeId = null) {
        try {
            const resultado = await pool.query(
                `SELECT ${CAMPOS_MENSAJE}
                 FROM mensajes m
                 LEFT JOIN perfiles p ON p.id = m.remitente_id
                 WHERE m.chat_id = $1
                   AND ($3::uuid IS NULL OR (m.created_at, m.id) < (
                       SELECT cursor.created_at, cursor.id FROM mensajes cursor WHERE cursor.id = $3
                   ))
                 ORDER BY m.created_at DESC, m.id DESC
                 LIMIT $2`,
                [grupoId, limite, antesDeId]
            );
            return resultado.rows;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_GRUPOS);
        }
    }

    // Más antiguos primero, posteriores a un mensaje
    async listarMensajesPosteriores(grupoId, limite, despuesDeId) {
        try {
            const resultado = await pool.query(
                `SELECT ${CAMPOS_MENSAJE}
                 FROM mensajes m
                 LEFT JOIN perfiles p ON p.id = m.remitente_id
                 WHERE m.chat_id = $1
                   AND (m.created_at, m.id) > (
                       SELECT cursor.created_at, cursor.id FROM mensajes cursor WHERE cursor.id = $3
                   )
                 ORDER BY m.created_at ASC, m.id ASC
                 LIMIT $2`,
                [grupoId, limite, despuesDeId]
            );
            return resultado.rows;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_GRUPOS);
        }
    }

    async crearMensaje(grupoId, remitenteId, contenido) {
        try {
            const resultado = await pool.query(
                `INSERT INTO mensajes (chat_id, remitente_id, contenido)
                 VALUES ($1, $2, $3)
                 RETURNING id, tipo, contenido, created_at, remitente_id`,
                [grupoId, remitenteId, contenido]
            );
            return resultado.rows[0];
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_GRUPOS);
        }
    }
}

export default GrupoRepository;
