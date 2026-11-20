import StatusCodes from 'http-status-codes';
import validadores from '../../helpers/validadores.js';
import { esCodigoGrupoValido, LARGO_CODIGO_GRUPO } from '../../helpers/codigoGrupo.js';

const MENSAJE_CODIGO_INVALIDO = `El código tiene ${LARGO_CODIGO_GRUPO} letras o números, sin espacios.`;

const LIMITE_POR_DEFECTO = 50;
const LIMITE_MAXIMO = 100;
const MAX_TEXTO_BUSQUEDA = 100;
const MAX_INTEGRANTES_GRUPO = 50;
const MAX_MIEMBROS_INVITADOS = MAX_INTEGRANTES_GRUPO - 1; // el creador ocupa un lugar

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
    const { nombre, descripcion, miembroIds, esPrivado } = req.body ?? {};

    if (esPrivado !== undefined && esPrivado !== null && typeof esPrivado !== 'boolean') {
        return rechazar(res, "esPrivado debe ser verdadero o falso.");
    }

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

    const errorMiembros = validarMiembroIds(miembroIds, req.params.id);
    if (errorMiembros) {
        return rechazar(res, errorMiembros);
    }

    req.body = {
        nombre: nombreLimpio,
        descripcion: descripcionLimpia,
        miembroIds: (miembroIds ?? []).map(id => id.toLowerCase()),
        esPrivado: esPrivado === true,
    };
    next();
};

// Unirse a un grupo por su ID: el código es opcional (solo lo piden los grupos privados)
const validarCodigoOpcional = (req, res, next) => {
    const { codigo } = req.body ?? {};
    if (codigo === undefined || codigo === null || codigo === '') {
        res.locals.codigo = null;
        return next();
    }
    if (!esCodigoGrupoValido(codigo)) {
        return rechazar(res, MENSAJE_CODIGO_INVALIDO);
    }
    res.locals.codigo = codigo;
    next();
};

// Unirse solo con el código: es obligatorio
const validarCodigoObligatorio = (req, res, next) => {
    const { codigo } = req.body ?? {};
    if (!esCodigoGrupoValido(codigo)) {
        return rechazar(res, MENSAJE_CODIGO_INVALIDO);
    }
    res.locals.codigo = codigo;
    next();
};

// Devuelve el texto del error, o null si la lista (opcional) es válida
const validarMiembroIds = (miembroIds, creadorId) => {
    if (miembroIds === undefined || miembroIds === null) return null;

    if (!Array.isArray(miembroIds)) {
        return "miembroIds debe ser una lista de IDs de perfil.";
    }
    if (miembroIds.length > MAX_MIEMBROS_INVITADOS) {
        return `Un grupo puede tener hasta ${MAX_INTEGRANTES_GRUPO} integrantes contándote a vos.`;
    }
    if (!miembroIds.every(id => typeof id === 'string' && validadores.esIdValido(id))) {
        return "Alguno de los integrantes elegidos no tiene un ID válido.";
    }
    const normalizados = miembroIds.map(id => id.toLowerCase());
    if (new Set(normalizados).size !== normalizados.length) {
        return "Hay integrantes repetidos en la lista.";
    }
    if (normalizados.includes(String(creadorId).toLowerCase())) {
        return "No hace falta agregarte: ya sos parte del grupo como creador.";
    }
    return null;
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
    validarCodigoOpcional,
    validarCodigoObligatorio,
};
