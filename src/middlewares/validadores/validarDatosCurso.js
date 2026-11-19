import StatusCodes from 'http-status-codes';

// "omitida" es opcional; si viene, tiene que ser true o false
const validarOmitida = (req, res, next) => {
    const omitida = req.body?.omitida;

    if (omitida !== undefined && typeof omitida !== 'boolean') {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "El campo omitida debe ser true o false." });
    }
    next();
};

export { validarOmitida };
