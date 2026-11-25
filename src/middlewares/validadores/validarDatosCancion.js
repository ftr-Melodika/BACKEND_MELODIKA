import StatusCodes from 'http-status-codes';
import validadores from '../../helpers/validadores.js';

// El id de una canción es un texto corto tipo "horse-with-no-name"
const FORMATO_ID_CANCION = /^[a-z0-9-]{1,100}$/;

const validarPerfilIdCancion = (req, res, next) => {
    if (!validadores.esIdValido(req.params.perfilId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "El formato del ID del perfil no es válido." });
    }
    next();
};

const validarIdCancion = (req, res, next) => {
    if (!FORMATO_ID_CANCION.test(req.params.cancionId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "El formato del ID de la canción no es válido." });
    }
    next();
};

// Las estrellas son un entero de 1 a 3
const validarEstrellas = (req, res, next) => {
    const estrellas = req.body?.estrellas;
    if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 3) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Las estrellas deben ser un número entero de 1 a 3." });
    }
    next();
};

export { validarPerfilIdCancion, validarIdCancion, validarEstrellas };
