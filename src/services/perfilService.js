import PerfilRepository from '../repositories/perfilesRepository.js';
import CuentaRepository from '../repositories/cuentaRepository.js';

const perfilRepository = new PerfilRepository();
const cuentaRepository = new CuentaRepository();

// 1. Subimos la constante de configuración arriba de todo
const MAX_PERFILES = 4; 

class PerfilService {
    
    async _obtenerCuentaValidada(authId) {
        const cuenta = await cuentaRepository.encontrarPorAuthId(authId);
        if (!cuenta) {
            console.warn(`PerfilService: no se encontró cuenta local para authId: ${authId}`);
            throw new Error("Cuenta no encontrada");
        }
        return cuenta;
    }

    // 3. Le agregamos el "_" para seguir la convención de helper interno
    _validarEstadoYPermisos(perfilExistente, cuentaId) {
        if (!perfilExistente) {
            throw new Error("El perfil no existe"); // Error 404
        }
        if (perfilExistente.cuentaId !== cuentaId) {
            throw new Error("Acceso denegado al perfil"); // Error 403
        }
        if (perfilExistente.activo === false) {
            throw new Error("El perfil se encuentra eliminado"); // Error 400
        }
    }


    async obtenerPerfiles(authId) {
        const cuenta = await this._obtenerCuentaValidada(authId);
        const perfiles = await perfilRepository.obtenerPorCuentaId(cuenta.id);

        if (perfiles.length === 0) {
            return null;
        }
        return perfiles;
    }
    
    async crearPerfil(authId, datosPerfil) {
        const cuenta = await this._obtenerCuentaValidada(authId);

        const perfilesActuales = await perfilRepository.obtenerPorCuentaId(cuenta.id);
        
        if (perfilesActuales.length >= MAX_PERFILES) {
            throw new Error("Límite de perfiles alcanzado");
        }

        const nombreDuplicado = perfilesActuales.some(
            perfil => perfil.nombre.toLowerCase() === datosPerfil.nombre.toLowerCase()
        );
        
        if (nombreDuplicado) {
            throw new Error("Ya tienes un perfil con este nombre");
        }

        return await perfilRepository.crearPerfil(cuenta.id, datosPerfil);
    }

    async eliminarPerfil(authId, perfilId) {
        const cuenta = await this._obtenerCuentaValidada(authId);
        const perfilExistente = await perfilRepository.obtenerPorId(perfilId);

        this._validarEstadoYPermisos(perfilExistente, cuenta.id);

        const fueEliminado = await perfilRepository.eliminarPerfil(perfilId, cuenta.id);
        
        if (!fueEliminado) {
            throw new Error("No se pudo completar la operación con los perfiles.");
        }

        return { exito: true };
    }

    async actualizarPerfil(authId, perfilId, datosPerfil) {
        const cuenta = await this._obtenerCuentaValidada(authId);
        const perfilExistente = await perfilRepository.obtenerPorId(perfilId);

        this._validarEstadoYPermisos(perfilExistente, cuenta.id);

        return await perfilRepository.actualizarPerfil(perfilId, cuenta.id, datosPerfil);
    }

    async chequearRacha(perfilId) {
        const resultado = await perfilRepository.actualizarRachaDiaria(perfilId);

        if (!resultado) {
            throw new Error("Perfil no encontrado para racha");
        }

        let mensajeApp = "";
        let mostrarAnimacion = false;
        let rachaAnterior = resultado.racha;

        if (resultado.dias_pasados === 0) {
            mensajeApp = "¡Ya habías sumado tu racha de hoy! 🔥";
        } else if (resultado.dias_pasados <= 3) {
            mensajeApp = `¡Excelente! Tu racha subió a ${resultado.racha} 🔥`;
            mostrarAnimacion = true;
            rachaAnterior = resultado.racha - 1;
        } else {
            mensajeApp = "¡Qué bueno verte de nuevo! Empezamos una nueva racha 🔥";
            mostrarAnimacion = true;
            rachaAnterior = 0;
        }

        return {
            exito: true,
            mostrarAnimacion,
            rachaAnterior,
            rachaActual: resultado.racha,
            mensaje: mensajeApp
        };
    }

    async obtenerRanking() {
        const top10 = await perfilRepository.obtenerTopRanking();
        return {
            total_jugadores: top10.length,
            ranking: top10
        };
    }
}

export default new PerfilService();