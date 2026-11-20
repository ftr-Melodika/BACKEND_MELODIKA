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

    // Las cuentas que entran con Google no tienen contraseña: solo se les pide a las de email.
    tieneContraseña(user) {
        const proveedores = user.app_metadata?.providers ?? [user.app_metadata?.provider];
        return proveedores.includes('email');
    }

    // Comprueba la contraseña con Supabase y devuelve la sesión que abre (sirve para actuar como ese usuario)
    async confirmarPassword(user, password, cliente = authClient) {
        if (typeof password !== 'string' || password.trim() === '') {
            const err = new Error("Falta la contraseña para confirmar");
            err.status = 400;
            throw err;
        }
        const { data, error } = await cliente.auth.signInWithPassword({ email: user.email, password });
        if (error) {
            const err = new Error("Contraseña incorrecta");
            err.status = 403;
            throw err;
        }
        return data.session;
    }

    async eliminarCuenta(user, password) {
        if (this.tieneContraseña(user)) {
            await this.confirmarPassword(user, password);
        }

        await cuentaRepository.eliminarPorAuthId(user.id);
    }

    async cambiarPassword(user, passwordActual, passwordNueva) {
        if (!this.tieneContraseña(user)) {
            const err = new Error("La cuenta no usa contraseña");
            err.status = 400;
            throw err;
        }

        // Cliente propio de esta operación: queda logueado como el usuario para poder cambiarle la clave
        const cliente = crearClienteAuth();
        await this.confirmarPassword(user, passwordActual, cliente);

        const { error } = await cliente.auth.updateUser({ password: passwordNueva });
        if (error) {
            const err = new Error(error.message);
            err.status = error.status;
            throw err;
        }
    }
}

export default CuentaService;