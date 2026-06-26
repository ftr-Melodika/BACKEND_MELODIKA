import { supabase } from '../database/db.js';
import CuentaRepository from '../repositories/cuentaRepository.js';

class CuentaService {
    async login(email, password) {

        // 1. Le pasamos el email y la contraseña a Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        // 2. Si Supabase nos devuelve un error (ej: clave mal, o se cayó el servidor de ellos)
        if (error) {
            // Creamos un error de Node.js con el mensaje original ("Invalid login credentials")
            const err = new Error(error.message); 
            // Le pegamos el número de status (400, 500, etc.) al error.
            // Esto es lo que tu Controller lee cuando hace "error.status".
            err.status = error.status; 
            // Lanzamos el error hacia arriba (hacia el Controller)
            throw err; 
        }

        // 3. Si pasó limpio, devolvemos los datos del usuario logueado
        return {
            token: data.session.access_token,
            user: data.user
        }

    
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
        }
        return data;
    }
}

export default CuentaService;