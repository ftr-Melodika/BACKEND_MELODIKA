import status from "http-status-codes";
import validadores from "../validadores.js";
import { traducirErrorDB, traducirErrorAccesoPerfil } from "./erroresComunes.js";

export function mapAmistadError(error) {
    // 23505: ya existe la fila (par de perfiles) en la tabla de amistades
    if (validadores.obtenerCodigoDb(error) === "23505") {
        return { codigoEstado: status.CONFLICT, mensajeUsuario: "Ya existe una solicitud o amistad con este perfil." };
    }

    // 23503: el perfil indicado ya no existe
    if (validadores.obtenerCodigoDb(error) === "23503") {
        return { codigoEstado: status.BAD_REQUEST, mensajeUsuario: "No se pudo completar la operación: el perfil indicado no existe." };
    }

    const errorBD = traducirErrorDB(error);
    if (errorBD) return errorBD;

    const errorAcceso = traducirErrorAccesoPerfil(error.message);
    if (errorAcceso) return errorAcceso;

    let codigoEstado = error.status || status.INTERNAL_SERVER_ERROR;
    let mensajeUsuario;

    switch (error.message) {
        case "No se pudo procesar la solicitud de amistad.":
            mensajeUsuario = "Hubo un problema al procesar la solicitud. Intentá de nuevo más tarde.";
            codigoEstado = status.INTERNAL_SERVER_ERROR;
            break;
        case "No se pudo procesar la invitación de amistad.":
            mensajeUsuario = "Hubo un problema con el link de invitación. Intentá de nuevo más tarde.";
            codigoEstado = status.INTERNAL_SERVER_ERROR;
            break;
        case "Invitación no válida":
            mensajeUsuario = "Este link de invitación no es válido o ya fue reemplazado.";
            codigoEstado = status.NOT_FOUND;
            break;
        case "No existe un perfil con ese username":
            mensajeUsuario = "No encontramos a nadie con ese nombre de usuario.";
            codigoEstado = status.NOT_FOUND;
            break;
        case "No podés enviarte una solicitud a vos mismo":
            mensajeUsuario = "No podés enviarte una solicitud de amistad a vos mismo.";
            codigoEstado = status.BAD_REQUEST;
            break;
        case "Ya son amigos":
            mensajeUsuario = "Ya son amigos.";
            codigoEstado = status.CONFLICT;
            break;
        case "Ya le enviaste una solicitud a este perfil":
            mensajeUsuario = "Ya le enviaste una solicitud a este perfil.";
            codigoEstado = status.CONFLICT;
            break;
        case "Este perfil ya te envió una solicitud":
            mensajeUsuario = "Este perfil ya te envió una solicitud. Podés aceptarla desde tus solicitudes.";
            codigoEstado = status.CONFLICT;
            break;
        case "Ya existe una solicitud o amistad con este perfil":
            mensajeUsuario = "Ya existe una solicitud o amistad con este perfil.";
            codigoEstado = status.CONFLICT;
            break;
        case "Solicitud no encontrada":
            mensajeUsuario = "No encontramos esa solicitud.";
            codigoEstado = status.NOT_FOUND;
            break;
        case "No podés responder esta solicitud":
            mensajeUsuario = "Solo quien recibió la solicitud puede responderla.";
            codigoEstado = status.FORBIDDEN;
            break;
        case "La solicitud ya fue respondida":
            mensajeUsuario = "Esta solicitud ya fue respondida.";
            codigoEstado = status.CONFLICT;
            break;
        case "No podés eliminar esta solicitud":
            mensajeUsuario = "No tenés permisos para eliminar esta solicitud.";
            codigoEstado = status.FORBIDDEN;
            break;
        default:
            mensajeUsuario = codigoEstado >= 500
                ? "Hubo un error interno en el servidor"
                : "No se pudo completar la operación con las amistades.";
            break;
    }

    return { codigoEstado, mensajeUsuario };
}
