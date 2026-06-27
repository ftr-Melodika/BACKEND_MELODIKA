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

    async crearCuenta(authId, datos) {
        try {
            const query = `
                INSERT INTO cuentas (auth_id, nombre, apellido, telefono, plan_premium, rol)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *;
            `;

            const values = [
                authId,
                datos.nombre || null,
                datos.apellido || null,
                datos.telefono || null,
                false,
                datos.rol || 'alumno'
            ];

            const resultado = await pool.query(query, values);
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
            console.error('Error creando cuenta en la base de datos:', error);
            const err = new Error('No se pudo crear la cuenta en la base de datos', { cause: error });
            err.code = error.code;
            throw err;
        }
    }
}

export default CuentaRepository;