import status from "http-status-codes";
import validadores from "../validadores.js";

const MENSAJE_SIN_CONEXION = "No se pudo conectar con la base de datos. Intentá de nuevo más tarde.";
const MENSAJE_ID_INVALIDO = "El ID proporcionado no tiene un formato válido.";

// Errores de base de datos que se traducen igual en todos los módulos.
// Devuelve { codigoEstado, mensajeUsuario } o null si el código no es de los comunes.
export function traducirErrorDB(error, { mensajeIdInvalido = MENSAJE_ID_INVALIDO } = {}) {
    switch (validadores.obtenerCodigoDb(error)) {
        case "ECONNREFUSED":
        case "ENOTFOUND":
        case "ETIMEDOUT":
            return { codigoEstado: status.SERVICE_UNAVAILABLE, mensajeUsuario: MENSAJE_SIN_CONEXION };
        case "22P02":
            return { codigoEstado: status.BAD_REQUEST, mensajeUsuario: mensajeIdInvalido };
        case "42703":
            return {
                codigoEstado: status.SERVICE_UNAVAILABLE,
                mensajeUsuario: "Esta función todavía no está disponible. Intentá de nuevo más tarde."
            };
        case "25006":
            return {
                codigoEstado: status.SERVICE_UNAVAILABLE,
                mensajeUsuario: "La base de datos no está aceptando cambios en este momento. Intentá de nuevo más tarde."
            };
        default:
            return null;
    }
}

// Errores que lanza perfilService.validarAccesoPerfil, usado por perfiles, amistades y grupos.
const ERRORES_ACCESO_PERFIL = {
    "Cuenta no encontrada": {
        codigoEstado: status.NOT_FOUND,
        mensajeUsuario: "No encontramos una cuenta asociada a tu usuario."
    },
    "El perfil no existe": {
        codigoEstado: status.NOT_FOUND,
        mensajeUsuario: "No pudimos encontrar el perfil solicitado."
    },
    "Acceso denegado al perfil": {
        codigoEstado: status.FORBIDDEN,
        mensajeUsuario: "No tienes permisos para modificar este perfil."
    },
    "El perfil se encuentra eliminado": {
        codigoEstado: status.BAD_REQUEST,
        mensajeUsuario: "Esta acción no se puede realizar porque el perfil ya fue eliminado."
    }
};

// Devuelve { codigoEstado, mensajeUsuario } o null si el mensaje no es de acceso al perfil.
export function traducirErrorAccesoPerfil(mensaje) {
    return ERRORES_ACCESO_PERFIL[mensaje] ?? null;
}
