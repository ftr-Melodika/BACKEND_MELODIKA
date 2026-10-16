import { pool } from '../database/db.js';
import Cuenta from '../entities/Cuenta.js';
import { manejarErrorDB } from '../helpers/manejoErrores/manejarErrorDB.js';
import { MENSAJES_ERROR_DB } from '../helpers/manejoErrores/mensajesErrorDB.js'; 

class CuentaRepository {
    async encontrarPorAuthId(authId) {
        try {
            const query = 'SELECT * FROM cuentas WHERE auth_id = $1';
            const resultado = await pool.query(query, [authId]);
            
            if (resultado.rows.length === 0) {
                return null;
            }

            const row = resultado.rows[0];
            return new Cuenta(
                row.id,
                row.auth_id,
                row.nombre,
                row.apellido,
                row.telefono,
                row.plan_premium,
                row.rol
            );
        } catch (error) {
            if (error.message === "No hay usuarios asignados") {
                throw error;
            }
            manejarErrorDB(error, MENSAJES_ERROR_DB.BUSCAR_CUENTA_AUTH);
        }
    }

}

export default CuentaRepository;