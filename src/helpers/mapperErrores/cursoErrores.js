import status from "http-status-codes";
import { traducirErrorDB } from "./erroresComunes.js";

export function mapCursoError(error) {
    // 1. Primero buscamos si es un error de la base de datos
    const errorBD = traducirErrorDB(error);
    if (errorBD) return errorBD;

    // 2. Si no lo es, evaluamos los mensajes de nuestros Services
    let codigoEstado = error.status || status.INTERNAL_SERVER_ERROR;
    let mensajeUsuario;

    switch (error.message) {
        case "Curso no encontrado.":
        case "Ejercicio no encontrado.":
            codigoEstado = status.NOT_FOUND;
            mensajeUsuario = error.message;
            break;
        case "Ya habías reclamado el XP de este ejercicio.":
            codigoEstado = status.BAD_REQUEST;
            mensajeUsuario = "El progreso de este ejercicio ya fue registrado previamente.";
            break;
        case "La lección todavía está bloqueada.":
            codigoEstado = status.FORBIDDEN;
            mensajeUsuario = "Completá las lecciones anteriores antes de hacer esta.";
            break;
        case "El perfil no existe":
            codigoEstado = status.NOT_FOUND;
            mensajeUsuario = "No pudimos encontrar el perfil solicitado.";
            break;
        case "Acceso denegado al perfil":
            codigoEstado = status.FORBIDDEN;
            mensajeUsuario = "No tienes permisos sobre este perfil.";
            break;
        case "El perfil se encuentra eliminado":
            codigoEstado = status.BAD_REQUEST;
            mensajeUsuario = "Esta acción no se puede realizar porque el perfil fue eliminado.";
            break;
        case "Cuenta no encontrada":
            codigoEstado = status.NOT_FOUND;
            mensajeUsuario = "No encontramos una cuenta asociada a tu usuario.";
            break;
        case "No has completado todos los ejercicios del curso.":
            codigoEstado = status.FORBIDDEN;
            mensajeUsuario = "No podés completar el curso sin haber terminado todos los ejercicios.";
            break;
        default:
            mensajeUsuario = codigoEstado >= 500
                ? "Hubo un problema interno al procesar los cursos o lecciones."
                : error.message || "No se pudo completar la operación del curso.";
            break;
    }

    return { codigoEstado, mensajeUsuario };
}
