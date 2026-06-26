import status from "http-status-codes";
import validadores from "../helpers/validadores.js";

export function mapLoginError(error) {
    let codigoEstado = error.status || status.INTERNAL_SERVER_ERROR;
    let mensajeUsuario;
    const codigoDb = validadores.obtenerCodigoDb(error);
    if (codigoDb) {
        if (codigoDb === "23505") {
            return { codigoEstado: status.CONFLICT, mensajeUsuario: "El correo electrónico ya está registrado en la base de datos." };
        }
        if (["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT"].includes(codigoDb)) {
            return { codigoEstado: status.SERVICE_UNAVAILABLE, mensajeUsuario: "No se pudo conectar con la base de datos. Intentá más tarde." };
        }
    }
    if (codigoEstado === 400 || codigoEstado === 401 || codigoEstado == 422) {
        switch (error.message) {
            case "Invalid login credentials":
                mensajeUsuario = "El correo electrónico o la contraseña son incorrectos.";
                break;
            case "User not found":
                mensajeUsuario = "No encontramos ninguna cuenta con este correo electrónico.";
                break;
            case "Too many requests":
                mensajeUsuario = "Demasiados intentos fallidos. Por favor, intentá de nuevo más tarde.";
                codigoEstado = status.TOO_MANY_REQUESTS;
                break;
            default:
                mensajeUsuario = "No se pudo iniciar sesión. Verificá tus datos.";
                break;
        }
    }   else if (error.status === 429 || error.message?.includes("rate limit")) { // <-- Agregado (Anti-Spam)
        codigoEstado = status.TOO_MANY_REQUESTS; // 429
        mensajeUsuario = "Demasiados intentos de registro. Por favor, esperá unos minutos.";
    } else if (codigoEstado >= 500) {
        mensajeUsuario = "Hubo un error interno en el servidor.";
    } else {
        mensajeUsuario = "No se pudo registrar la cuenta.";
    } 

    return { codigoEstado, mensajeUsuario };
}

export function mapRegisterError(error) {
    // Para registro asumimos BAD_REQUEST si no viene status
    let codigoEstado = error.status || status.BAD_REQUEST;
    let mensajeUsuario;

    if (codigoEstado === 400) {
        switch (error.message) {
            case "User already registered":
            case "User already exists":
                mensajeUsuario = "El correo electrónico ya está registrado.";
                break;
            case "Invalid email":
                mensajeUsuario = "El correo electrónico no tiene un formato válido.";
                break;
            default:
                mensajeUsuario = "No se pudo registrar la cuenta. Verificá los datos ingresados.";
                break;
        }
    } else if (codigoEstado >= 500) {
        mensajeUsuario = "Hubo un error interno en el servidor";
    } else {
        mensajeUsuario = "No se pudo registrar la cuenta";
    }

    return { codigoEstado, mensajeUsuario };
}

export function mapPerfilError(error) {
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
        }
    }

    if (!mensajeUsuario) {
        switch (error.message) {
            case "Sesion expirada":
                mensajeUsuario = "Tu sesión expiró. Volvé a iniciar sesión.";
                codigoEstado = status.UNAUTHORIZED;
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
