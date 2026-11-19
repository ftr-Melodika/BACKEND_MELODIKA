import status from "http-status-codes";
import validadores from "../validadores.js";
import { traducirErrorDB, traducirErrorAccesoPerfil } from "./erroresComunes.js";

export function mapGrupoError(error) {
    // 23505: ya existe un grupo con ese nombre
    if (validadores.obtenerCodigoDb(error) === "23505") {
        return { codigoEstado: status.CONFLICT, mensajeUsuario: "Ya existe un grupo con ese nombre. Elegí otro." };
    }

    // 23503: el perfil o el grupo indicado ya no existe
    if (validadores.obtenerCodigoDb(error) === "23503") {
        return { codigoEstado: status.BAD_REQUEST, mensajeUsuario: "No se pudo completar la operación: el perfil o el grupo indicado no existe." };
    }

    const errorBD = traducirErrorDB(error);
    if (errorBD) return errorBD;

    const errorAcceso = traducirErrorAccesoPerfil(error.message);
    if (errorAcceso) return errorAcceso;

    let codigoEstado = error.status || status.INTERNAL_SERVER_ERROR;
    let mensajeUsuario;

    switch (error.message) {
        case "No se pudo procesar la operación del grupo.":
            mensajeUsuario = "Hubo un problema al procesar la solicitud. Intentá de nuevo más tarde.";
            codigoEstado = status.INTERNAL_SERVER_ERROR;
            break;
        case "Grupo no encontrado":
            mensajeUsuario = "No encontramos ese grupo.";
            codigoEstado = status.NOT_FOUND;
            break;
        case "Ya existe un grupo con ese nombre":
            mensajeUsuario = "Ya existe un grupo con ese nombre. Elegí otro.";
            codigoEstado = status.CONFLICT;
            break;
        case "No sos miembro de este grupo":
            mensajeUsuario = "Tenés que unirte al grupo para ver y enviar mensajes.";
            codigoEstado = status.FORBIDDEN;
            break;
        case "Mensaje no encontrado":
            mensajeUsuario = "No encontramos ese mensaje en este grupo.";
            codigoEstado = status.NOT_FOUND;
            break;
        default:
            mensajeUsuario = codigoEstado >= 500
                ? "Hubo un error interno en el servidor"
                : "No se pudo completar la operación con los grupos.";
            break;
    }

    return { codigoEstado, mensajeUsuario };
}
