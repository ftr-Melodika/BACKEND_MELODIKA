import StatusCodes from 'http-status-codes';
import validadores from '../helpers/validadores.js';

const validarDatosCrearPerfil = (req, res, next) => {
    const { nombre, username, pais } = req.body;

    // 1. Validar campos obligatorios
    if (!nombre || !username) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'El nombre y el username son campos obligatorios.' });
    }
    
    // 2. Validar formato del Nombre usando tu helper existente
    if (!validadores.esNombreValido(nombre)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'El nombre debe tener al menos 3 letras y no contener números ni símbolos.' });
    }

    // 3. Validar formato del Username
    if (!validadores.esUsernameValido(username)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'El username debe tener entre 3 y 20 caracteres. Solo letras, números o guiones bajos.' });
    }

    // 4. Validar formato del País (solo si el usuario lo envió, ya que asumo es opcional)
    if (pais && !validadores.esPaisValido(pais)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'El formato del país no es válido.' });
    }

    // 5. Limpieza de datos (Opcional pero muy recomendado)
    // Esto asegura que si el usuario mandó "  Facu  ", a tu Service llegue "Facu" limpio.
    req.body.nombre = nombre.trim();
    req.body.username = username.trim().toLowerCase(); // El username siempre en minúsculas
    if (pais) {
        req.body.pais = pais.trim();
    }

    next(); 
};

export default validarDatosCrearPerfil;