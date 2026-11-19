import { supabase, crearClienteAuth } from '../database/supabase.js';
import CuentaRepository from '../repositories/cuentaRepository.js';

const cuentaRepository = new CuentaRepository();

// Cliente solo para login/refresh (ver database/supabase.js)
const authClient = crearClienteAuth();

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