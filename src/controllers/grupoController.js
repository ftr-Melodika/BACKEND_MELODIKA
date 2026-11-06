import status from "http-status-codes";
import { Router } from "express";
import grupoService from "../services/grupoService.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { catchAsync } from "../helpers/catchAsync.js";
import { validarIdPerfil } from "../middlewares/validadores/validarDatosPerfil.js";
import {
    validarGrupoId,
    validarDatosCrearGrupo,
    validarBusquedaGrupos,
    validarConsultaMensajes,
    validarDatosMensajeGrupo,
} from "../middlewares/validadores/validarDatosGrupo.js";

const router = Router();

// /mios y /buscar van antes que /:grupoId para que no se tomen como un ID
router.get("/:id/grupos/mios", verificarToken, validarIdPerfil, catchAsync(async (req, res) => {

    /* #swagger.tags = ['Grupos']
       #swagger.summary = 'Listar mis grupos, primero los de actividad más reciente' */

    const datos = await grupoService.listarMisGrupos(req.user.id, req.params.id);

    return res.status(status.OK).json({
        success: true,
        message: "Grupos obtenidos correctamente.",
        data: datos
    });
}));

router.get("/:id/grupos/buscar", verificarToken, validarIdPerfil, validarBusquedaGrupos, catchAsync(async (req, res) => {

    /* #swagger.tags = ['Grupos']
       #swagger.summary = 'Buscar grupos por nombre o descripción' */

    const datos = await grupoService.buscarGrupos(req.user.id, req.params.id, res.locals.textoBusqueda);

    return res.status(status.OK).json({
        success: true,
        message: "Búsqueda realizada correctamente.",
        data: datos
    });
}));

router.post("/:id/grupos", verificarToken, validarIdPerfil, validarDatosCrearGrupo, catchAsync(async (req, res) => {

    /* #swagger.tags = ['Grupos']
       #swagger.summary = 'Crear un grupo' */

    const { nombre, descripcion } = req.body;
    const datos = await grupoService.crearGrupo(req.user.id, req.params.id, nombre, descripcion);

    return res.status(status.CREATED).json({
        success: true,
        message: "Grupo creado.",
        data: datos
    });
}));

router.get("/:id/grupos/:grupoId", verificarToken, validarIdPerfil, validarGrupoId, catchAsync(async (req, res) => {

    /* #swagger.tags = ['Grupos']
       #swagger.summary = 'Ver un grupo' */

    const datos = await grupoService.obtenerGrupo(req.user.id, req.params.id, req.params.grupoId);

    return res.status(status.OK).json({
        success: true,
        message: "Grupo obtenido correctamente.",
        data: datos
    });
}));

router.post("/:id/grupos/:grupoId/unirse", verificarToken, validarIdPerfil, validarGrupoId, catchAsync(async (req, res) => {

    /* #swagger.tags = ['Grupos']
       #swagger.summary = 'Unirse a un grupo' */

    const datos = await grupoService.unirse(req.user.id, req.params.id, req.params.grupoId);

    return res.status(status.OK).json({
        success: true,
        message: "Te uniste al grupo.",
        data: datos
    });
}));

router.delete("/:id/grupos/:grupoId/salir", verificarToken, validarIdPerfil, validarGrupoId, catchAsync(async (req, res) => {

    /* #swagger.tags = ['Grupos']
       #swagger.summary = 'Salir de un grupo' */

    const datos = await grupoService.salir(req.user.id, req.params.id, req.params.grupoId);

    return res.status(status.OK).json({
        success: true,
        message: "Saliste del grupo.",
        data: datos
    });
}));

router.get("/:id/grupos/:grupoId/mensajes", verificarToken, validarIdPerfil, validarGrupoId, validarConsultaMensajes, catchAsync(async (req, res) => {

    /* #swagger.tags = ['Grupos']
       #swagger.summary = 'Leer mensajes del grupo (solo miembros)' */

    const datos = await grupoService.listarMensajes(req.user.id, req.params.id, req.params.grupoId, res.locals.paginacion);

    return res.status(status.OK).json({
        success: true,
        message: "Mensajes obtenidos correctamente.",
        data: datos
    });
}));

router.post("/:id/grupos/:grupoId/mensajes", verificarToken, validarIdPerfil, validarGrupoId, validarDatosMensajeGrupo, catchAsync(async (req, res) => {

    /* #swagger.tags = ['Grupos']
       #swagger.summary = 'Enviar un mensaje al grupo (solo miembros)' */

    const datos = await grupoService.enviarMensaje(req.user.id, req.params.id, req.params.grupoId, req.body.contenido);

    return res.status(status.CREATED).json({
        success: true,
        message: "Mensaje enviado.",
        data: datos
    });
}));

export default router;
