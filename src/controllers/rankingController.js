import status from "http-status-codes";
import { Router } from "express";
import rankingService from "../services/rankingService.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { catchAsync } from "../helpers/catchAsync.js";
import { validarIdPerfil } from "../middlewares/validadores/validarDatosPerfil.js";
import { validarGrupoId } from "../middlewares/validadores/validarDatosGrupo.js";

const router = Router();

router.get("/:id/rankings", verificarToken, validarIdPerfil, catchAsync(async (req, res) => {

    /* #swagger.tags = ['Rankings']
       #swagger.summary = 'Listar los rankings de grupo en los que participo' */

    const datos = await rankingService.listarMisRankings(req.user.id, req.params.id);

    return res.status(status.OK).json({
        success: true,
        message: "Rankings obtenidos correctamente.",
        data: datos
    });
}));

router.get("/:id/grupos/:grupoId/ranking", verificarToken, validarIdPerfil, validarGrupoId, catchAsync(async (req, res) => {

    /* #swagger.tags = ['Rankings']
       #swagger.summary = 'Ver el ranking de un grupo (solo miembros). activo=false si todavía no se creó' */

    const datos = await rankingService.obtenerRankingGrupo(req.user.id, req.params.id, req.params.grupoId);

    return res.status(status.OK).json({
        success: true,
        message: "Ranking obtenido correctamente.",
        data: datos
    });
}));

router.post("/:id/grupos/:grupoId/ranking", verificarToken, validarIdPerfil, validarGrupoId, catchAsync(async (req, res) => {

    /* #swagger.tags = ['Rankings']
       #swagger.summary = 'Invitar al grupo a un ranking: lo crea, suma a quien invita y manda la invitación al chat' */

    const datos = await rankingService.invitar(req.user.id, req.params.id, req.params.grupoId);

    return res.status(status.CREATED).json({
        success: true,
        message: "Ranking creado e invitación enviada al grupo.",
        data: datos
    });
}));

router.post("/:id/grupos/:grupoId/ranking/aceptar", verificarToken, validarIdPerfil, validarGrupoId, catchAsync(async (req, res) => {

    /* #swagger.tags = ['Rankings']
       #swagger.summary = 'Aceptar la invitación y entrar al ranking del grupo' */

    const datos = await rankingService.aceptar(req.user.id, req.params.id, req.params.grupoId);

    return res.status(status.OK).json({
        success: true,
        message: "Te sumaste al ranking.",
        data: datos
    });
}));

router.delete("/:id/grupos/:grupoId/ranking/salir", verificarToken, validarIdPerfil, validarGrupoId, catchAsync(async (req, res) => {

    /* #swagger.tags = ['Rankings']
       #swagger.summary = 'Salir del ranking del grupo' */

    const datos = await rankingService.salir(req.user.id, req.params.id, req.params.grupoId);

    return res.status(status.OK).json({
        success: true,
        message: "Saliste del ranking.",
        data: datos
    });
}));

export default router;
