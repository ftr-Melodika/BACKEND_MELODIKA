import StatusCodes from 'http-status-codes';
import validadores from '../../helpers/validadores.js';

const LIMITE_POR_DEFECTO = 50;
const LIMITE_MAXIMO = 100;
const MAX_TEXTO_BUSQUEDA = 100;

// Postgres rechaza el carácter NUL en columnas de texto: sin esto terminaría en un 500
const tieneNul = (texto) => texto.includes('\u0000');

const rechazar = (res, message) => res.status(StatusCodes.BAD_REQUEST).json({ success: false, message });

const validarGrupoId = (req, res, next) => {
    if (!validadores.esIdValido(req.params.grupoId)) {
        return rechazar(res, "El formato del ID del grupo no es válido.");
    }
    next();
};

const validarDatosCrearGrupo = (req, res, next) => {
    const { nombre, descripcion } = req.body ?? {};

    if (typeof nombre !== 'string' || tieneNul(nombre)) {
        return rechazar(res, "El nombre del grupo es obligatorio.");
    }
    const nombreLimpio = nombre.trim();
    if (nombreLimpio.length < 3 || nombreLimpio.length > 50) {
        return rechazar(res, "El nombre del grupo debe tener entre 3 y 50 caracteres.");
    }

    if (descripcion !== undefined && descripcion !== null && (typeof descripcion !== 'string' || tieneNul(descripcion))) {
        return rechazar(res, "La descripción no es válida.");
    }
    const descripcionLimpia = descripcion?.trim() || null;
    if (descripcionLimpia && descripcionLimpia.length > 200) {
        return rechazar(res, "La descripción puede tener hasta 200 caracteres.");
    }

    req.body = { nombre: nombreLimpio, descripcion: descripcionLimpia };
    next();
};

const validarBusquedaGrupos = (req, res, next) => {
    const { q } = req.query;

    if (q !== undefined && (typeof q !== 'string' || tieneNul(q) || q.length > MAX_TEXTO_BUSQUEDA)) {
        return rechazar(res, "El texto de búsqueda no es válido.");
    }

    res.locals.textoBusqueda = q?.trim() ?? '';
    next();
};

const validarConsultaMensajes = (req, res, next) => {
    const { limit, despues, antes } = req.query;

    if (limit !== undefined && (typeof limit !== 'string' || !/^[1-9]\d*$/.test(limit))) {
        return rechazar(res, "El límite debe ser un número mayor a cero.");
    }
    if (despues !== undefined && antes !== undefined) {
        return rechazar(res, "No se puede usar 'despues' y 'antes' a la vez.");
    }
    for (const cursor of [despues, antes]) {
        if (cursor !== undefined && (typeof cursor !== 'string' || !validadores.esIdValido(cursor))) {
            return rechazar(res, "El formato del ID del mensaje no es válido.");
        }
    }

    res.locals.paginacion = {
        limite: limit === undefined ? LIMITE_POR_DEFECTO : Math.min(Number(limit), LIMITE_MAXIMO),
        despues: despues ?? null,
        antes: antes ?? null,
    };
    next();
};

const validarDatosMensajeGrupo = (req, res, next) => {
    const { contenido } = req.body ?? {};

    if (typeof contenido !== 'string' || tieneNul(contenido)) {
        return rechazar(res, "El mensaje no es válido.");
    }
    const contenidoLimpio = contenido.trim();
    if (contenidoLimpio.length < 1 || contenidoLimpio.length > 1000) {
        return rechazar(res, "El mensaje debe tener entre 1 y 1000 caracteres.");
    }

    req.body = { contenido: contenidoLimpio };
    next();
};

export {
    validarGrupoId,
    validarDatosCrearGrupo,
    validarBusquedaGrupos,
    validarConsultaMensajes,
    validarDatosMensajeGrupo,
};
