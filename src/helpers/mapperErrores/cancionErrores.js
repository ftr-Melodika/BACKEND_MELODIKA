import status from "http-status-codes";
import { traducirErrorDB, traducirErrorAccesoPerfil } from "./erroresComunes.js";

export function mapCancionError(error) {
    const errorBD = traducirErrorDB(error, { mensajeIdInvalido: "El ID de la canción no tiene un formato válido." });
    if (errorBD) return errorBD;

    // Favoritas: el service comprueba que el perfil sea del usuario
    const errorAcceso = traducirErrorAccesoPerfil(error.message);
    if (errorAcceso) return errorAcceso;

    const codigoEstado = error.status || status.INTERNAL_SERVER_ERROR;
    let mensajeUsuario;

    switch (error.message) {
        case "Canción no encontrada.":
            mensajeUsuario = "Canción no encontrada.";
            break;
        default:
            mensajeUsuario = codigoEstado >= 500
                ? "Hubo un problema interno al procesar las canciones."
                : "No se pudo completar la operación con las canciones.";
            break;
    }

    return { codigoEstado, mensajeUsuario };
}
