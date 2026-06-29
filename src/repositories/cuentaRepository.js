import { pool } from '../database/db.js';
import Cuenta from '../entities/Cuenta.js'; 

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
            console.error("Error buscando en la base de datos:", error);
            if (error.message === "No hay usuarios asignados") {
                throw error;
            }
            const err = new Error("Error al conectar con la base de datos", { cause: error });
            err.code = error.code;
            throw err;
        }
    }

}

export default CuentaRepository;