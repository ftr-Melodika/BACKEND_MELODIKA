import { mapLoginError, mapRegisterError } from "../helpers/mapperErrores/cuentaErrores.js";
import { mapCursoError } from "../helpers/mapperErrores/cursoErrores.js";
import { mapPerfilError } from "../helpers/mapperErrores/perfilErrores.js";
import { mapAmistadError } from "../helpers/mapperErrores/amistadErrores.js";
import { mapGrupoError } from "../helpers/mapperErrores/grupoErrores.js";
import { mapCancionError } from "../helpers/mapperErrores/cancionErrores.js";
import { registrarErrorOculto } from "../helpers/manejoErrores/registrarErrorOculto.js";

// Amistades y grupos cuelgan de /api/perfiles/:id/..., por eso van antes que el mapper de perfiles
const RUTA_AMISTADES = /^\/api\/perfiles\/[^/]+\/(solicitudes|amistades|amigos|social)(\/|\?|$)/;
const RUTA_GRUPOS = /^\/api\/perfiles\/[^/]+\/grupos(\/|\?|$)/;

const resolveErrorMapper = (req) => {
    const path = req.originalUrl || "";

    if (path.includes("/login")) return mapLoginError;
    if (path.includes("/registrar")) return mapRegisterError;
    if (path.includes("/api/cursos")) return mapCursoError;
    if (path.includes("/api/canciones")) return mapCancionError;
    if (RUTA_AMISTADES.test(path)) return mapAmistadError;
    if (RUTA_GRUPOS.test(path)) return mapGrupoError;
    if (path.includes("/api/perfiles")) return mapPerfilError;

    return null;
};

export const errorHandler = (error, req, res, next) => {
    registrarErrorOculto(error);

    const mapper = error?.mapError || resolveErrorMapper(req);
    const payload = mapper ? mapper(error) : {
        codigoEstado: error?.status || 500,
        mensajeUsuario: error?.message || "Hubo un error inesperado."
    };

    const { codigoEstado = 500, mensajeUsuario = "Hubo un error inesperado." } = payload;

    return res.status(codigoEstado).json({
        success: false,
        message: mensajeUsuario,
    });
};
