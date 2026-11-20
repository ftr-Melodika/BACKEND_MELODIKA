import status from "http-status-codes";
import validadores from "../validadores.js";
import { traducirErrorDB, traducirErrorAccesoPerfil, traducirErrorMembresiaGrupo } from "./erroresComunes.js";

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

    const errorMembresia = traducirErrorMembresiaGrupo(error.message);
    if (errorMembresia) return errorMembresia;

    let codigoEstado = error.status || status.INTERNAL_SERVER_ERROR;
    let mensajeUsuario;

    switch (error.message) {
        case "No se pudo procesar la operación del grupo.":
            mensajeUsuario = "Hubo un problema al procesar la solicitud. Intentá de nuevo más tarde.";
            codigoEstado = status.INTERNAL_SERVER_ERROR;
            break;
        case "Ya existe un grupo con ese nombre":
            mensajeUsuario = "Ya existe un grupo con ese nombre. Elegí otro.";
            codigoEstado = status.CONFLICT;
            break;
        case "Solo podés agregar a tus amigos":
            mensajeUsuario = "Solo podés agregar al grupo a personas que ya son tus amigas.";
            codigoEstado = status.BAD_REQUEST;
            break;
        case "Mensaje no encontrado":
            mensajeUsuario = "No encontramos ese mensaje en este grupo.";
            codigoEstado = status.NOT_FOUND;
            break;
        case "El grupo es privado":
            mensajeUsuario = "Este grupo es privado: necesitás su código para entrar.";
            codigoEstado = status.FORBIDDEN;
            break;
        // Mismo mensaje si el código no existe o es de otro grupo: no revela qué códigos están en uso
        case "Código de grupo incorrecto":
            mensajeUsuario = "El código no es correcto. Revisalo: distingue mayúsculas y minúsculas.";
            codigoEstado = status.FORBIDDEN;
            break;
        case "No se pudo generar el código del grupo":
            mensajeUsuario = "No pudimos crear el grupo privado. Intentá de nuevo.";
            codigoEstado = status.INTERNAL_SERVER_ERROR;
            break;
        default:
            mensajeUsuario = codigoEstado >= 500
                ? "Hubo un error interno en el servidor"
                : "No se pudo completar la operación con los grupos.";
            break;
    }

    return { codigoEstado, mensajeUsuario };
}
