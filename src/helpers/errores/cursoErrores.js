export function mapCursoError(error) {
    let codigoEstado = error.status || 500; 
    let mensajeUsuario;

    switch (error.message) {
        case "Falta el ID del perfil.":
        case "El ID del curso es requerido.":
        case "El ID del perfil es requerido.":
        case "El ID del perfil es requerido como parámetro de consulta (?perfilId=...).":
            codigoEstado = 400; // BAD_REQUEST
            mensajeUsuario = error.message;
            break;
        case "Curso no encontrado.":
        case "Ejercicio no encontrado.":
            codigoEstado = 404; // NOT_FOUND
            mensajeUsuario = error.message;
            break;
        case "Ya habías reclamado el XP de este ejercicio.":
            codigoEstado = 400; // BAD_REQUEST
            mensajeUsuario = "El progreso de este ejercicio ya fue registrado previamente.";
            break;
        default:
            mensajeUsuario = "Hubo un problema interno al procesar los cursos o lecciones.";
            break;
    }

    return { codigoEstado, mensajeUsuario };
}