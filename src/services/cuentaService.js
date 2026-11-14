import { createClient } from '@supabase/supabase-js';
import { supabase } from '../database/db.js';
import CuentaRepository from '../repositories/cuentaRepository.js';
import Cuenta from '../entities/Cuenta.js';

const cuentaRepository = new CuentaRepository();

// Cliente aparte solo para login/refresh: no guarda sesión ni auto-refresca en el servidor,
// así la sesión de un usuario no queda pegada al cliente compartido que usa el resto del backend.
const authClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
);

const armarSesion = (session) => ({
    token: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at, // segundos desde epoch
});

class CuentaService {
    async login(email, password) {
        // 1. Verificamos las credenciales directamente con Supabase
        const { data, error } = await authClient.auth.signInWithPassword({
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
            ...armarSesion(data.session),
            user: data.user
        };
    }

    // Canjea un refresh token por una sesión nueva (access token + refresh token nuevos).
    // Supabase rota el refresh token: la app tiene que guardar SIEMPRE el nuevo que devolvemos.
    async refrescarSesion(refreshToken) {
        const { data, error } = await authClient.auth.refreshSession({ refresh_token: refreshToken });

        if (error || !data?.session) {
            const err = new Error('Sesión inválida, iniciá sesión de nuevo');
            err.status = 401;
            throw err;
        }

        return armarSesion(data.session);
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
            const err = new Error(error.message);
            err.status = error.status;
            throw err;
        }

        return { user: data.user };
    }
}

export default CuentaService;