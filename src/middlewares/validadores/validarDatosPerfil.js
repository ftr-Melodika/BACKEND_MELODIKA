import StatusCodes from 'http-status-codes';
import validadores from '../../helpers/validadores.js';

const validarDatosCrearPerfil = (req, res, next) => {
    const { nombre, username, pais, fecha_nacimiento, genero } = req.body;

    if (!nombre) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'El nombre es obligatorio.' });
    }

    if (!username) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'El username es obligatorio.' });
    }
    
    // 2. Validar formato del Nombre usando tu helper existente
    if (!validadores.esNombreValido(nombre)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'El nombre debe tener al menos 3 letras y no contener números ni símbolos.' });
    }

    // 3. Validar formato del Username
    if (!validadores.esUsernameValido(username)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'El username debe tener entre 3 y 20 caracteres. Solo letras, números o guiones bajos.' });
    }

    // 4. Validar formato del País (solo si el usuario lo envió, ya que asumo es opcional)
    if (pais && !validadores.esPaisValido(pais)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'El formato del país no es válido.' });
    }

    if (fecha_nacimiento && !validadores.esFechaValida(fecha_nacimiento)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Formato de fecha inválido (debe ser AAAA-MM-DD).' });
    }

    if (genero && !validadores.esGeneroValido(genero)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Género no válido.' });
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
    const { nombre, pais, fecha_nacimiento, genero, esPublico } = req.body;

    if (esPublico !== undefined && typeof esPublico !== 'boolean') {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'esPublico debe ser verdadero o falso.' });
    }

    // Solo validamos los campos que el usuario mande
    if (nombre && !validadores.esNombreValido(nombre)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'El nombre debe tener al menos 3 letras y no contener números ni símbolos.' });
    }
    
    if (pais && !validadores.esPaisValido(pais)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'El formato del país no es válido.' });
    }

    if (fecha_nacimiento && !validadores.esFechaValida(fecha_nacimiento)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Formato de fecha inválido (debe ser AAAA-MM-DD).' });
    }

    if (genero && !validadores.esGeneroValido(genero)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Género no válido.' });
    }

    if (nombre) req.body.nombre = nombre.trim();
    if (pais) req.body.pais = pais.trim();

    next();
};

const TIPOS_MENSAJE = ['feedback', 'reporte_error', 'contacto'];

const validarDatosMensaje = (req, res, next) => {
    const { tipo, categoria, mensaje } = req.body;

    if (!TIPOS_MENSAJE.includes(tipo)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Tipo de mensaje no válido.' });
    }

    if (typeof mensaje !== 'string' || mensaje.trim().length < 10 || mensaje.trim().length > 2000) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'El mensaje debe tener entre 10 y 2000 caracteres.' });
    }

    if (categoria !== undefined && (typeof categoria !== 'string' || categoria.length > 50)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'La categoría no es válida.' });
    }

    req.body.mensaje = mensaje.trim();
    next();
};

const validarIdPerfil = (req, res, next) => {
    const { id } = req.params;

    if (!validadores.esIdValido(id)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "El formato del ID no es válido."
        });
    }

    next();
};

const validarOtroIdPerfil = (req, res, next) => {
    if (!validadores.esIdValido(req.params.otroId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "El formato del ID no es válido." });
    }
    next();
};

const validarAmistadId = (req, res, next) => {
    if (!validadores.esIdValido(req.params.amistadId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "El formato del ID de la solicitud no es válido." });
    }
    next();
};

const validarDatosSolicitud = (req, res, next) => {
    const { destinoId } = req.body ?? {};
    if (typeof destinoId !== 'string' || !validadores.esIdValido(destinoId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "El perfil de destino no es válido." });
    }
    next();
};

const validarAccionSolicitud = (req, res, next) => {
    const { accion } = req.body ?? {};
    if (accion !== 'aceptar' && accion !== 'rechazar') {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "La acción debe ser 'aceptar' o 'rechazar'." });
    }
    next();
};

export {
    validarDatosCrearPerfil,
    validarDatosActualizarPerfil,
    validarIdPerfil,
    validarDatosMensaje,
    validarOtroIdPerfil,
    validarAmistadId,
    validarDatosSolicitud,
    validarAccionSolicitud,
};
