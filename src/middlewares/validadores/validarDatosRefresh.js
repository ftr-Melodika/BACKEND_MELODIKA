import StatusCodes from 'http-status-codes';

const validarRefreshToken = (req, res, next) => {
    const { refreshToken } = req.body ?? {};

    if (typeof refreshToken !== 'string' || !refreshToken.trim()) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "refreshToken requerido" });
    }
    next();
};

export default validarRefreshToken;
