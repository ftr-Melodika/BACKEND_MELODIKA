import status from "http-status-codes";
import validadores from "../validadores.js";
import { traducirErrorDB, traducirErrorAccesoPerfil } from "./erroresComunes.js";

// Códigos de Postgres propios de crear/actualizar perfiles
const ERRORES_BD_PERFIL = {
    "23505": { codigoEstado: status.CONFLICT, mensajeUsuario: "El nombre de usuario ya está en uso." },
    "23503": { codigoEstado: status.BAD_REQUEST, mensajeUsuario: "No se pudo vincular el perfil a la cuenta." },
    "23502": { codigoEstado: status.BAD_REQUEST, mensajeUsuario: "Faltan datos obligatorios para crear el perfil." },
    "23514": { codigoEstado: status.BAD_REQUEST, mensajeUsuario: "Los datos del perfil no cumplen las reglas requeridas." },
    "22001": { codigoEstado: status.BAD_REQUEST, mensajeUsuario: "Alguno de los datos del perfil es demasiado largo." }
};

export function mapPerfilError(error) {
    const errorBD = ERRORES_BD_PERFIL[validadores.obtenerCodigoDb(error)]
        ?? traducirErrorDB(error, { mensajeIdInvalido: "El ID del perfil proporcionado no tiene un formato válido." });
    if (errorBD) return errorBD;

    const errorAcceso = traducirErrorAccesoPerfil(error.message);
    if (errorAcceso) return errorAcceso;

    let codigoEstado = error.status || status.INTERNAL_SERVER_ERROR;
    let mensajeUsuario;

    switch (error.message) {
        case "Sesion expirada":
            mensajeUsuario = "Tu sesión expiró. Volvé a iniciar sesión.";
            codigoEstado = status.UNAUTHORIZED;
            break;
        case "Perfil no encontrado o no autorizado":
            mensajeUsuario = "El perfil que intentas eliminar no existe o no tienes permisos para hacerlo.";
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
        case "No se pudo guardar el mensaje.":
        case "Error al cargar el ranking":
            mensajeUsuario = "Hubo un problema al procesar la solicitud. Intentá de nuevo más tarde.";
            codigoEstado = status.INTERNAL_SERVER_ERROR;
            break;
        default:
            mensajeUsuario = codigoEstado >= 500
                ? "Hubo un error interno en el servidor"
                : "No se pudo completar la operación con los perfiles.";
            break;
    }

    return { codigoEstado, mensajeUsuario };
}
