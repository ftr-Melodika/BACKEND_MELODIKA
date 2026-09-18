import status from "http-status-codes";
import { Router } from "express";
import perfilService from "../services/perfilService.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { catchAsync } from "../helpers/catchAsync.js";
import { validarDatosCrearPerfil, validarDatosActualizarPerfil, validarIdPerfil } from "../middlewares/validadores/validarDatosPerfil.js";

const router = Router();

router.get("/ranking", verificarToken, catchAsync(async (req, res) => {
    
        /* #swagger.tags = ['Perfiles']
       #swagger.summary = 'Obtener ranking global' */

    const resultado = await perfilService.obtenerRanking();

    return res.status(status.OK).json({
        success: true,
        data: resultado
    });
}));

router.post("/:id/racha", verificarToken, catchAsync(async (req, res) => {
    
    /* #swagger.tags = ['Perfiles']
       #swagger.summary = 'Actualizar racha diaria' */

    const { id } = req.params;
    const resultado = await perfilService.chequearRacha(id);

    return res.status(status.OK).json({
        success: true,
        data: resultado
    });
}));

router.get("/", verificarToken, catchAsync(async (req, res) => {
    
        /* #swagger.tags = ['Perfiles']
       #swagger.summary = 'Obtener perfiles de la cuenta' */
    
    const authId = req.user.id;
    const perfiles = await perfilService.obtenerPerfiles(authId);
    const mensajeExtra = perfiles == null ? "No tenes perfiles creados" : "Tiene perfiles";

    res.status(status.OK).json({
        success: true,
        message: mensajeExtra,
        data: perfiles,
    });
}));

router.post("/", verificarToken, validarDatosCrearPerfil, catchAsync(async (req, res) => {
    
    /* #swagger.tags = ['Perfiles']
       #swagger.summary = 'Crear nuevo perfil'
       #swagger.requestBody = {
           required: true,
           content: { "application/json": { schema: { $ref: "#/components/schemas/CrearPerfil" } } }
       } */
    
    const authId = req.user.id;
    const { nombre, username, fecha_nacimiento, genero, pais, avatarUrl } = req.body;
    const datosPerfil = { nombre, username, fecha_nacimiento, genero, pais, avatarUrl };

    const nuevoPerfil = await perfilService.crearPerfil(authId, datosPerfil);

    res.status(status.CREATED).json({
        success: true,
        message: "Perfil creado exitosamente",
        data: nuevoPerfil
    });
}));

router.delete("/:id", verificarToken, validarIdPerfil, catchAsync(async (req, res) => {
    
    /* #swagger.tags = ['Perfiles']
       #swagger.summary = 'Eliminar perfil (Lógico)' */

    const authId = req.user.id;
    const { id } = req.params;

    await perfilService.eliminarPerfil(authId, id);

    return res.status(status.OK).json({
        success: true,
        message: "Perfil eliminado exitosamente."
    });
}));

router.put("/:id", verificarToken, validarIdPerfil, validarDatosActualizarPerfil, catchAsync(async (req, res) => {
    
    /* #swagger.tags = ['Perfiles']
       #swagger.summary = 'Actualizar datos de perfil'
       #swagger.requestBody = {
           required: true,
           content: { "application/json": { schema: { $ref: "#/components/schemas/ActualizarPerfil" } } }
       } */

    const authId = req.user.id;
    const { id } = req.params;
    const { nombre, fecha_nacimiento, genero, pais, avatarUrl } = req.body;
    const datosPerfil = { nombre, fecha_nacimiento, genero, pais, avatarUrl };

    const perfilActualizado = await perfilService.actualizarPerfil(authId, id, datosPerfil);

    return res.status(status.OK).json({
        success: true,
        message: "Perfil actualizado correctamente.",
        data: perfilActualizado
    });
}));

export default router;