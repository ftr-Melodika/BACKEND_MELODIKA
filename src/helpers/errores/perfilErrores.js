import status from "http-status-codes";
import validadores from "../validadores.js";

export function mapPerfilError(error) {
    console.log("======= ERROR OCULTO =======");
    console.log("Mensaje original:", error.message);
    console.log("Status original:", error.status);
    console.log("============================");

    let codigoEstado = error.status || status.INTERNAL_SERVER_ERROR;
    let mensajeUsuario;
    const codigoDb = validadores.obtenerCodigoDb(error);

    if (codigoDb) {
        switch (codigoDb) {
            case "23505":
                mensajeUsuario = "El nombre de usuario ya está en uso.";
                codigoEstado = status.CONFLICT;
                break;
            case "23503":
                mensajeUsuario = "No se pudo vincular el perfil a la cuenta.";
                codigoEstado = status.BAD_REQUEST;
                break;
            case "23502":
                mensajeUsuario = "Faltan datos obligatorios para crear el perfil.";
                codigoEstado = status.BAD_REQUEST;
                break;
            case "23514":
                mensajeUsuario = "Los datos del perfil no cumplen las reglas requeridas.";
                codigoEstado = status.BAD_REQUEST;
                break;
            case "22001":
                mensajeUsuario = "Alguno de los datos del perfil es demasiado largo.";
                codigoEstado = status.BAD_REQUEST;
                break;
            case "ECONNREFUSED":
            case "ENOTFOUND":
            case "ETIMEDOUT":
                mensajeUsuario = "No se pudo conectar con la base de datos. Intentá de nuevo más tarde.";
                codigoEstado = status.SERVICE_UNAVAILABLE;
                break;
            case "22P02":
                mensajeUsuario = "El ID del perfil proporcionado no tiene un formato válido.";
                codigoEstado = status.BAD_REQUEST;
                break;
        }
    }

    if (!mensajeUsuario) {
        switch (error.message) {
            case "Sesion expirada":
                mensajeUsuario = "Tu sesión expiró. Volvé a iniciar sesión.";
                codigoEstado = status.UNAUTHORIZED;
                break;
            case "Perfil no encontrado o no autorizado":
                mensajeUsuario = "El perfil que intentas eliminar no existe o no tienes permisos para hacerlo.";
                codigoEstado = status.NOT_FOUND;
                break;
            case "Cuenta no encontrada":
                mensajeUsuario = "No encontramos una cuenta asociada a tu usuario.";
                codigoEstado = status.NOT_FOUND;
                break;
            case "Límite de perfiles alcanzado":
                mensajeUsuario = "Ya tenés el máximo de 4 perfiles permitidos.";
                codigoEstado = status.BAD_REQUEST;
                break;
            case "Error al conectar con la base de datos":
            case "Error al conectar con la base de datos para buscar perfiles":
            case "No se pudo crear el perfil en la base de datos":
                mensajeUsuario = "Hubo un problema al acceder a la base de datos. Intentá de nuevo más tarde.";
                codigoEstado = status.SERVICE_UNAVAILABLE;
                break;
            case "Ya tienes un perfil con este nombre":
                mensajeUsuario = "Ya tienes un perfil con este nombre. Elegí otro nombre para tu nuevo perfil.";
                codigoEstado = status.CONFLICT;
                break;
            case "Perfil no encontrado para racha":
                mensajeUsuario = "No se encontró el perfil para actualizar la racha.";
                codigoEstado = status.NOT_FOUND;
                break;
            case "No se pudo procesar la racha.":
            case "Error al cargar el ranking":
                mensajeUsuario = "Hubo un problema al procesar la solicitud. Intentá de nuevo más tarde.";
                codigoEstado = status.INTERNAL_SERVER_ERROR;
                break;
            case "El perfil no existe":
                mensajeUsuario = "No pudimos encontrar el perfil solicitado.";
                codigoEstado = status.NOT_FOUND;
                break;
            case "Acceso denegado al perfil":
                mensajeUsuario = "No tienes permisos para modificar este perfil.";
                codigoEstado = status.FORBIDDEN;
                break;
            case "El perfil se encuentra eliminado":
                mensajeUsuario = "Esta acción no se puede realizar porque el perfil ya fue eliminado.";
                codigoEstado = status.BAD_REQUEST;
                break;
            default:
                if (codigoEstado >= 500) {
                    mensajeUsuario = "Hubo un error interno en el servidor";
                } else {
                    mensajeUsuario = "No se pudo completar la operación con los perfiles.";
                }
                break;
        }
    }

    return { codigoEstado, mensajeUsuario };
}