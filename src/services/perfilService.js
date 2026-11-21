import PerfilRepository, { DIAS_MAXIMOS_SIN_PRACTICAR } from '../repositories/PerfilesRepository.js';
import CuentaRepository from '../repositories/cuentaRepository.js';
import { CacheTemporal } from '../helpers/cacheTemporal.js';
import { enviarMail } from '../helpers/enviarMail.js';

const perfilRepository = new PerfilRepository();
const cuentaRepository = new CuentaRepository();

// 1. Subimos la constante de configuración arriba de todo
const MAX_PERFILES = 4; 

// La cuenta de un usuario (su id interno) no cambia, y todas las rutas la buscan para validar el acceso.
// Solo se recuerdan las que existen: una cuenta recién registrada tiene que poder aparecer.
const SEGUNDOS_CACHE_CUENTA = 300;
const cuentasPorAuthId = new CacheTemporal({ duracionMs: SEGUNDOS_CACHE_CUENTA * 1000, maximo: 1000 });

class PerfilService {

   async validarAccesoPerfil(authId, perfilId) {
        // La cuenta y el perfil no dependen uno del otro: se piden a la vez
        const [cuenta, perfilExistente] = await Promise.all([
            this._obtenerCuentaValidada(authId),
            perfilRepository.obtenerPorId(perfilId),
        ]);

        this._validarEstadoYPermisos(perfilExistente, cuenta.id);
        
        return { cuenta, perfilExistente };
   }
    
    async _obtenerCuentaValidada(authId) {
        let cuenta = cuentasPorAuthId.obtener(authId);
        if (!cuenta) {
            cuenta = await cuentaRepository.encontrarPorAuthId(authId);
            if (cuenta) cuentasPorAuthId.guardar(authId, cuenta);
        }
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


    async obtenerPerfil(authId, perfilId) {
        const { perfilExistente } = await this.validarAccesoPerfil(authId, perfilId);
        return perfilExistente;
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

        const { cuenta } = await this.validarAccesoPerfil(authId, perfilId);

        const fueEliminado = await perfilRepository.eliminarPerfil(perfilId, cuenta.id);
        
        if (!fueEliminado) {
            throw new Error("No se pudo completar la operación con los perfiles.");
        }

        return { exito: true };
    }

    async actualizarPerfil(authId, perfilId, datosPerfil) {

        const { cuenta } = await this.validarAccesoPerfil(authId, perfilId);

        return await perfilRepository.actualizarPerfil(perfilId, cuenta.id, datosPerfil);
    }

    async chequearRacha(authId, perfilId) {
        await this.validarAccesoPerfil(authId, perfilId);
        const resultado = await perfilRepository.actualizarRachaDiaria(perfilId);

        if (!resultado) {
            throw new Error("Perfil no encontrado para racha");
        }

        let mensajeApp = "";
        let mostrarAnimacion = false;
        let rachaAnterior = resultado.racha;

        if (resultado.dias_pasados === 0) {
            mensajeApp = "¡Ya habías sumado tu racha de hoy! 🔥";
        } else if (resultado.dias_pasados <= DIAS_MAXIMOS_SIN_PRACTICAR) {
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

    // Feedback, reportes y consultas: se envían por mail (no se guardan en la base)
    async registrarMensaje(authId, perfilId, tipo, { categoria, mensaje, nombre, email }) {
        const { perfilExistente } = await this.validarAccesoPerfil(authId, perfilId);

        const etiquetas = { feedback: 'Feedback', reporte_error: 'Reporte de error', contacto: 'Contacto' };
        const remitente = nombre || perfilExistente.nombre || perfilExistente.username;
        const asunto = `[Melodika] ${etiquetas[tipo]}${categoria ? ` - ${categoria}` : ''}`;
        const texto = [
            `Tipo: ${etiquetas[tipo]}`,
            categoria ? `Categoría: ${categoria}` : null,
            `Nombre: ${remitente}`,
            email ? `Email: ${email}` : null,
            `Perfil: ${perfilExistente.username || perfilExistente.nombre} (id ${perfilId})`,
            '',
            mensaje,
        ].filter((linea) => linea !== null).join('\n');

        await enviarMail({ asunto, texto, replyTo: email });
        return { enviado: true };
    }

    // Antes de mostrar rachas ajenas (por ejemplo en un ranking de grupo), pone en 0 las vencidas
    async reiniciarRachasVencidas() {
        await perfilRepository.reiniciarRachasVencidas();
    }
}

export default new PerfilService();