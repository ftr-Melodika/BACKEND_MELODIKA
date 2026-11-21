import  StatusCodes from 'http-status-codes';
import validadores from '../../helpers/validadores.js';

const validarRegistro = (req, res, next) => {
    const { email, password, nombre, apellido, telefono } = req.body;

    
    if (!email || !password || !nombre || !apellido || !telefono) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Todos los campos son obligatorios.' });
    }
    
    if (!validadores.esEmailValido(email)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'El formato del email no es válido.' });
    }
    
    const errorPassword = validadores.mensajeErrorPassword(password);
    if (errorPassword) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: errorPassword });
    }

    if (!validadores.esNombreValido(nombre)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'El nombre debe tener al menos 3 letras y no contener números ni símbolos.' });
    }

    if (!validadores.esNombreValido(apellido)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'El apellido debe tener al menos 3 letras y no contener números ni símbolos.' });
    }

    if (!validadores.esTelefonoValido(telefono)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'El teléfono debe contener entre 10 y 15 números válidos' });
    }
    

    next(); 
};

export default validarRegistro;