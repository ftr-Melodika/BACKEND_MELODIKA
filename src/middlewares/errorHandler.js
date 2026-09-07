import { mapLoginError, mapRegisterError } from "../helpers/errores/cuentaErrores.js";
import { mapCursoError } from "../helpers/errores/cursoErrores.js";
import { mapPerfilError } from "../helpers/errores/perfilErrores.js";

const resolveErrorMapper = (req) => {
    const path = req.originalUrl || "";

    if (path.includes("/login")) return mapLoginError;
    if (path.includes("/registrar")) return mapRegisterError;
    if (path.includes("/api/cursos")) return mapCursoError;
    if (path.includes("/api/perfiles")) return mapPerfilError;

    return null;
};

export const errorHandler = (error, req, res, next) => {
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
