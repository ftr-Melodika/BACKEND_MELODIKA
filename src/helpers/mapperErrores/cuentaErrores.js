import status from "http-status-codes";
import validadores from "../validadores.js";

export function mapLoginError(error) {
    console.log("======= ERROR OCULTO =======");
    console.log("Mensaje original:", error.message);
    console.log("Status original:", error.status);
    console.log("============================");
    
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
    
    if (codigoEstado === 400 || codigoEstado === 401 || codigoEstado == 422 || codigoEstado == 403) {
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
            case "Email not confirmed":
                mensajeUsuario = "Tenés que confirmar tu correo electrónico antes de iniciar sesión. Revisá tu bandeja de entrada.";
                codigoEstado = status.FORBIDDEN;
                break;
            default:
                mensajeUsuario = "No se pudo iniciar sesión. Verificá tus datos.";
                break;
        }
    } else if (error.status === 429 || error.message?.includes("rate limit")) {
        codigoEstado = status.TOO_MANY_REQUESTS;
        mensajeUsuario = "Demasiados intentos de registro. Por favor, esperá unos minutos.";
    } else if (codigoEstado >= 500) {
        mensajeUsuario = "Hubo un error interno en el servidor.";
    } else {
        mensajeUsuario = "No se pudo registrar la cuenta.";
    }
    
    return { codigoEstado, mensajeUsuario };
}

export function mapRegisterError(error) {
    let codigoEstado = error.status || status.BAD_REQUEST;
    let mensajeUsuario;
    
    console.log("======= ERROR OCULTO =======");
    console.log("Mensaje original:", error.message);
    console.log("Status original:", error.status);
    console.log("============================");
    
    if (codigoEstado === 429 || error.message?.includes("rate limit")) {
        return {
            codigoEstado: status.TOO_MANY_REQUESTS,
            mensajeUsuario: "Demasiados intentos de registro. Por favor, esperá unos minutos."
        };
    }
    
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