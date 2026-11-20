import StatusCodes from 'http-status-codes';
import validadores from '../../helpers/validadores.js';

const validarCambioPassword = (req, res, next) => {
    const { passwordActual, passwordNueva } = req.body ?? {};

    if (typeof passwordActual !== 'string' || typeof passwordNueva !== 'string'
        || !passwordActual.trim() || !passwordNueva.trim()) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Tenés que enviar la contraseña actual y la nueva.' });
    }

    const mensajeError = validadores.mensajeErrorPassword(passwordNueva);
    if (mensajeError) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: mensajeError });
    }

    if (passwordActual === passwordNueva) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'La contraseña nueva debe ser distinta de la actual.' });
    }

    next();
};

export default validarCambioPassword;
