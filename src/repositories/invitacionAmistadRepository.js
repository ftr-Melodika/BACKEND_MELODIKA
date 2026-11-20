import { pool } from '../database/db.js';
import { manejarErrorDB } from '../helpers/manejoErrores/manejarErrorDB.js';
import { MENSAJES_ERROR_DB } from '../helpers/manejoErrores/mensajesErrorDB.js';

// Si otra petición ya dejó un token activo para el perfil, el INSERT no hace nada y devuelve null
const INSERTAR_SI_NO_HAY_ACTIVA = `
    INSERT INTO invitaciones_amistad (perfil_id, token)
    VALUES ($1, $2)
    ON CONFLICT (perfil_id) WHERE activo DO NOTHING
    RETURNING token
`;

class InvitacionAmistadRepository {

    async obtenerTokenActivo(perfilId) {
        try {
            const resultado = await pool.query(
                'SELECT token FROM invitaciones_amistad WHERE perfil_id = $1 AND activo = true',
                [perfilId]
            );
            return resultado.rows[0]?.token ?? null;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_INVITACIONES);
        }
    }

    async crear(perfilId, token) {
        try {
            const resultado = await pool.query(INSERTAR_SI_NO_HAY_ACTIVA, [perfilId, token]);
            return resultado.rows[0]?.token ?? null;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_INVITACIONES);
        }
    }

    // Revoca el token activo y crea uno nuevo. Devuelve null si una regeneración simultánea ganó.
    async reemplazar(perfilId, token) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(
                'UPDATE invitaciones_amistad SET activo = false WHERE perfil_id = $1 AND activo = true',
                [perfilId]
            );
            const resultado = await client.query(INSERTAR_SI_NO_HAY_ACTIVA, [perfilId, token]);
            await client.query('COMMIT');
            return resultado.rows[0]?.token ?? null;
        } catch (error) {
            await client.query('ROLLBACK');
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_INVITACIONES);
        } finally {
            client.release();
        }
    }

    // Dueño de un token activo, solo si su perfil sigue activo
    async obtenerPerfilPorToken(token) {
        try {
            const resultado = await pool.query(
                `SELECT p.id, p.nombre, p.username, p.avatar_url
                 FROM invitaciones_amistad i
                 JOIN perfiles p ON p.id = i.perfil_id
                 WHERE i.token = $1 AND i.activo = true AND p.activo = true`,
                [token]
            );
            return resultado.rows[0] ?? null;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GESTIONAR_INVITACIONES);
        }
    }
}

export default InvitacionAmistadRepository;
