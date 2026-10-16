import  StatusCodes from 'http-status-codes';
import validadores from '../../helpers/validadores.js';

const validarRegistro = (req, res, next) => {
    const { email, password, nombre, apellido, telefono } = req.body;

    
    if (!email || !password || !nombre || !apellido || !telefono) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Todos los campos son obligatorios.' });
    }
    
    if (!validadores.esEmailValido(email)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'El formato del email no es válido.' });
    }
    
    if (!validadores.esPasswordLargo(password)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    if (!validadores.tieneMayuscula(password)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'La contraseña debe incluir al menos una letra mayúscula.' });
    }

    if (!validadores.tieneSigno(password)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'La contraseña debe incluir al menos un caracter especial ' });
    }

    if (!validadores.esNombreValido(nombre)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'El nombre debe tener al menos 3 letras y no contener números ni símbolos.' });
    }

    if (!validadores.esNombreValido(apellido)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'El apellido debe tener al menos 3 letras y no contener números ni símbolos.' });
    }

    if (!validadores.esTelefonoValido(telefono)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'El teléfono debe contener entre 10 y 15 números válidos' });
    }
    

    next(); 
};

export default validarRegistro;