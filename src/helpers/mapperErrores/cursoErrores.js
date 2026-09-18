import status from "http-status-codes";
import validadores from "../validadores.js";

export function mapCursoError(error) {
    console.log("======= ERROR OCULTO =======");
    console.log("Mensaje original:", error.message);
    console.log("Status original:", error.status);
    console.log("============================");

    let codigoEstado = error.status || status.INTERNAL_SERVER_ERROR;
    let mensajeUsuario;
    
    // 1. Buscamos primero si es un error nativo de PostgreSQL
    const codigoDb = validadores.obtenerCodigoDb(error);

    if (codigoDb) {
        switch (codigoDb) {
            case "22P02":
                mensajeUsuario = "El ID proporcionado no tiene un formato válido.";
                codigoEstado = status.BAD_REQUEST;
                break;
            case "ECONNREFUSED":
            case "ENOTFOUND":
            case "ETIMEDOUT":
                mensajeUsuario = "No se pudo conectar con la base de datos. Intentá de nuevo más tarde.";
                codigoEstado = status.SERVICE_UNAVAILABLE;
                break;
        }
    }

    // 2. Si no saltó ningún error de DB, evaluamos los mensajes de nuestros Services
    if (!mensajeUsuario) {
        switch (error.message) {
            case "Falta el ID del perfil.":
            case "El ID del curso es requerido.":
            case "El ID del perfil es requerido.":
            case "El ID del perfil es requerido como parámetro de consulta (?perfilId=...).":
                codigoEstado = status.BAD_REQUEST;
                mensajeUsuario = error.message;
                break;
            case "Curso no encontrado.":
            case "Ejercicio no encontrado.":
                codigoEstado = status.NOT_FOUND;
                mensajeUsuario = error.message;
                break;
            case "Ya habías reclamado el XP de este ejercicio.":
                codigoEstado = status.BAD_REQUEST;
                mensajeUsuario = "El progreso de este ejercicio ya fue registrado previamente.";
                break;
            case "No has completado todos los ejercicios del curso.":
                codigoEstado = status.FORBIDDEN
                mensajeUsuario = "No podés completar el curso sin haber terminado todos los ejercicios.";
                break;
            default:
                if (codigoEstado >= 500) {
                    mensajeUsuario = "Hubo un problema interno al procesar los cursos o lecciones.";
                } else {
                    mensajeUsuario = error.message || "No se pudo completar la operación del curso.";
                }
                break;
        }
    }

    return { codigoEstado, mensajeUsuario };
}