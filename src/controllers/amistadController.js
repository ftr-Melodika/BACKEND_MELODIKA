import status from "http-status-codes";
import { Router } from "express";
import amistadService from "../services/amistadService.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { catchAsync } from "../helpers/catchAsync.js";
import {
    validarIdPerfil,
    validarOtroIdPerfil,
    validarAmistadId,
    validarDatosSolicitud,
    validarAccionSolicitud,
} from "../middlewares/validadores/validarDatosPerfil.js";

const router = Router();

router.get("/:id/social/:otroId", verificarToken, validarIdPerfil, validarOtroIdPerfil, catchAsync(async (req, res) => {

    /* #swagger.tags = ['Social']
       #swagger.summary = 'Ver el perfil de otro usuario respetando su privacidad' */

    const datos = await amistadService.obtenerPerfilSocial(req.user.id, req.params.id, req.params.otroId);

    return res.status(status.OK).json({
        success: true,
        message: "Perfil obtenido correctamente.",
        data: datos
    });
}));

router.post("/:id/solicitudes", verificarToken, validarIdPerfil, validarDatosSolicitud, catchAsync(async (req, res) => {

    /* #swagger.tags = ['Social']
       #swagger.summary = 'Enviar solicitud de amistad' */

    const datos = await amistadService.enviarSolicitud(req.user.id, req.params.id, req.body.destinoId);

    return res.status(status.CREATED).json({
        success: true,
        message: "Solicitud enviada.",
        data: datos
    });
}));

router.get("/:id/solicitudes", verificarToken, validarIdPerfil, catchAsync(async (req, res) => {

    /* #swagger.tags = ['Social']
       #swagger.summary = 'Listar solicitudes de amistad pendientes' */

    const datos = await amistadService.listarSolicitudes(req.user.id, req.params.id);

    return res.status(status.OK).json({
        success: true,
        message: "Solicitudes obtenidas correctamente.",
        data: datos
    });
}));

router.put("/:id/solicitudes/:amistadId", verificarToken, validarIdPerfil, validarAmistadId, validarAccionSolicitud, catchAsync(async (req, res) => {

    /* #swagger.tags = ['Social']
       #swagger.summary = 'Aceptar o rechazar una solicitud de amistad' */

    const datos = await amistadService.responderSolicitud(req.user.id, req.params.id, req.params.amistadId, req.body.accion);

    return res.status(status.OK).json({
        success: true,
        message: "Solicitud respondida.",
        data: datos
    });
}));

router.delete("/:id/amistades/:amistadId", verificarToken, validarIdPerfil, validarAmistadId, catchAsync(async (req, res) => {

    /* #swagger.tags = ['Social']
       #swagger.summary = 'Cancelar una solicitud enviada o eliminar una amistad' */

    await amistadService.eliminarAmistad(req.user.id, req.params.id, req.params.amistadId);

    return res.status(status.OK).json({
        success: true,
        message: "Eliminada correctamente."
    });
}));

router.get("/:id/amigos", verificarToken, validarIdPerfil, catchAsync(async (req, res) => {

    /* #swagger.tags = ['Social']
       #swagger.summary = 'Listar amigos del perfil' */

    const datos = await amistadService.listarAmigos(req.user.id, req.params.id);

    return res.status(status.OK).json({
        success: true,
        message: "Amigos obtenidos correctamente.",
        data: datos
    });
}));

export default router;
