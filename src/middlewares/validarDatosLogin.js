import  StatusCodes from 'http-status-codes';
import validadores from '../helpers/validadores.js';

const validarLogin = (req, res, next) => {
    const cuentaIngresada = req.body;
    if (!validadores.tieneEmail(cuentaIngresada.email) || !validadores.tienePassword(cuentaIngresada.password)) {
        if(!validadores.tieneEmail(cuentaIngresada.email)){
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Email mal ingresado" });
        } else if(!validadores.tienePassword(cuentaIngresada.password)){
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Contraseña mal ingresada" });
        }
    }
    next();
};

export default validarLogin;