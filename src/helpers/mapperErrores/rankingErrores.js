import status from "http-status-codes";
import validadores from "../validadores.js";
import { traducirErrorDB, traducirErrorAccesoPerfil, traducirErrorMembresiaGrupo } from "./erroresComunes.js";

export function mapRankingError(error) {
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
        case "No se pudo procesar la operación del ranking.":
            mensajeUsuario = "Hubo un problema al procesar la solicitud. Intentá de nuevo más tarde.";
            codigoEstado = status.INTERNAL_SERVER_ERROR;
            break;
        case "El grupo ya tiene un ranking":
            mensajeUsuario = "Este grupo ya tiene un ranking. Aceptá la invitación para entrar.";
            codigoEstado = status.CONFLICT;
            break;
        case "El grupo todavía no tiene un ranking":
            mensajeUsuario = "Este grupo todavía no tiene un ranking. Invitá al grupo para crearlo.";
            codigoEstado = status.NOT_FOUND;
            break;
        default:
            mensajeUsuario = codigoEstado >= 500
                ? "Hubo un error interno en el servidor"
                : "No se pudo completar la operación con el ranking.";
            break;
    }

    return { codigoEstado, mensajeUsuario };
}
