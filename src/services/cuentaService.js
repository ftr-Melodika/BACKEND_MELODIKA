import { supabase } from '../database/db.js';
import CuentaRepository from '../repositories/cuentaRepository.js';
import Cuenta from '../entities/Cuenta.js';

const cuentaRepository = new CuentaRepository();

class CuentaService {
    async login(email, password) {
        // 1. Verificamos las credenciales directamente con Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        // 2. Si hay un error (contraseña incorrecta, mail no existe, etc.), cortamos acá
        if (error) {
            const err = new Error(error.message); 
            err.status = error.status; 
            throw err; 
        }

        // 3. Si todo está bien, simplemente devolvemos el token y el usuario al Controller.
        // (El trigger de la base de datos ya nos garantiza que este usuario existe en nuestra tabla 'cuentas',
        // así que no hace falta buscarlo ni intentar crearlo de nuevo acá).
        return {
            token: data.session.access_token,
            user: data.user
        };
    }


    async registrar(cuentaData) {
        const { data, error } = await supabase.auth.signUp({
            email: cuentaData.email,
            password: cuentaData.password,
            options: {
                data: {
                    nombre: cuentaData.nombre,
                    apellido: cuentaData.apellido,
                    telefono: cuentaData.telefono
                }
            }
        });
        if (error) {
            throw new Error(error.message);
            console.log(error.cause + error.code + error.message) 
        }

        return { user: data.user };
    }
}

export default CuentaService;