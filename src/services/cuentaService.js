import { supabase } from '../database/db.js';
import CuentaRepository from '../repositories/cuentaRepository.js';
import Cuenta from '../entities/Cuenta.js';

const cuentaRepository = new CuentaRepository();

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

        // 3. Si pasó limpio, nos aseguramos de tener la cuenta local persistida
        const user = data.user;

        try {
            const cuentaExistente = await cuentaRepository.encontrarPorAuthId(user.id);
            if (!cuentaExistente) {
                // Intentamos crear la cuenta local usando metadata si está disponible
                const datos = {
                    nombre: user.user_metadata?.nombre || null,
                    apellido: user.user_metadata?.apellido || null,
                    telefono: user.user_metadata?.telefono || null,
                    rol: 'alumno'
                };
                await cuentaRepository.crearCuenta(user.id, datos);
            }
        } catch (err) {
            // No bloqueamos el login por error en la persistencia local, solo logueamos
            console.error('Warning: no se pudo asegurar cuenta local tras login:', err);
        }

        // 4. Devolvemos los datos del usuario logueado
        return {
            token: data.session.access_token,
            user: user
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
        // Persistimos la cuenta localmente para poder asociar perfiles a ella
        const createdCuenta = await cuentaRepository.crearCuenta(data.user.id, cuentaData);

        return { user: data.user, cuenta: createdCuenta };
    }
}

export default CuentaService;