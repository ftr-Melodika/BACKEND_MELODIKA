import StatusCodes from 'http-status-codes';
import validadores from '../helpers/validadores.js';

const validarDatosCrearPerfil = (req, res, next) => {
    const { nombre, username, pais, fecha_nacimiento, genero } = req.body;

    if (!nombre) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'El nombre es obligatorio.' });
    }

    if (!username) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'El username es obligatorio.' });
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

    if (fecha_nacimiento && !validadores.esFechaValida(fecha_nacimiento)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Formato de fecha inválido (debe ser AAAA-MM-DD).' });
    }

    if (genero && !validadores.esGeneroValido(genero)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Género no válido.' });
    }

    // 5. Limpieza de datos (Opcional pero muy recomendado)
    // Esto asegura que si el usuario mandó "  Facu  ", a tu Service llegue "Facu" limpio.
    req.body.nombre = nombre.trim();
    req.body.username = username.trim().toLowerCase(); // El username siempre en minúsculas
    if (fecha_nacimiento) req.body.fecha_nacimiento = fecha_nacimiento;
    if (genero) req.body.genero = genero;
    if (pais) {
        req.body.pais = pais.trim();
    }

    next(); 
};

const validarDatosActualizarPerfil = (req, res, next) => {
    const { nombre, pais, fecha_nacimiento, genero } = req.body;

    // Solo validamos los campos que el usuario mande
    if (nombre && !validadores.esNombreValido(nombre)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'El nombre debe tener al menos 3 letras y no contener números ni símbolos.' });
    }
    
    if (pais && !validadores.esPaisValido(pais)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'El formato del país no es válido.' });
    }

    if (fecha_nacimiento && !validadores.esFechaValida(fecha_nacimiento)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Formato de fecha inválido (debe ser AAAA-MM-DD).' });
    }

    if (genero && !validadores.esGeneroValido(genero)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Género no válido.' });
    }

    if (nombre) req.body.nombre = nombre.trim();
    if (pais) req.body.pais = pais.trim();

    next();
};

export { validarDatosCrearPerfil, validarDatosActualizarPerfil };
