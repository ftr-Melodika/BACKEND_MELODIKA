import status from "http-status-codes";
import { Router } from "express";
import perfilService from "../services/perfilService.js";
import { mapPerfilError } from "../helpers/errores/perfilErrores.js";
import { manejarErrorRespuesta } from "../helpers/manejarErrorRespuesta.js";
import verificarToken from "../middlewares/authMiddleware.js"; 
import { validarDatosCrearPerfil, validarDatosActualizarPerfil, validarIdPerfil } from "../middlewares/validarDatosPerfil.js";

const router = Router();

router.get("/ranking", verificarToken, async (req, res) => {
    try {
        const resultado = await perfilService.obtenerRanking();
        
        return res.status(status.OK).json({ 
            success: true, 
            data: resultado 
        });
    } catch (error) {
        return manejarErrorRespuesta(res, error, mapPerfilError);
    }
});

router.post("/:id/racha", verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await perfilService.chequearRacha(id);
        
        return res.status(status.OK).json({ 
            success: true, 
            data: resultado 
        });
    } catch (error) {
        return manejarErrorRespuesta(res, error, mapPerfilError);
    }
});

router.get("/", verificarToken, async (req, res) => {
    try {
        const authId = req.user.id; 
        let mensajeExtra;
        const perfiles = await perfilService.obtenerPerfiles(authId);

        if (perfiles == null) mensajeExtra = "No tenes perfiles creados";
        else mensajeExtra = "Tiene perfiles";

        res.status(status.OK).json({
            mensajeExtra: mensajeExtra,
            success: true,
            data: perfiles,
        });
    } catch (error) {
        return manejarErrorRespuesta(res, error, mapPerfilError);
    }
});

router.post("/", verificarToken, validarDatosCrearPerfil, async (req, res) => {
    try {
        const authId = req.user.id;
        const { nombre, username, fecha_nacimiento, genero, pais, avatarUrl } = req.body;
        const datosPerfil = { nombre, username, fecha_nacimiento, genero, pais, avatarUrl };

        const nuevoPerfil = await perfilService.crearPerfil(authId, datosPerfil);

        res.status(status.CREATED).json({
            success: true,
            message: "Perfil creado exitosamente",
            data: nuevoPerfil
        });
    } catch (error) {
        return manejarErrorRespuesta(res, error, mapPerfilError);
    }
});

router.delete("/:id", verificarToken, validarIdPerfil, async (req, res) => {
    try {
        const authId = req.user.id;
        const { id } = req.params;

        await perfilService.eliminarPerfil(authId, id);

        return res.status(status.OK).json({
            success: true,
            message: "Perfil eliminado exitosamente."
        });

    } catch (error) {
        return manejarErrorRespuesta(res, error, mapPerfilError);
    }
});

router.put("/:id", verificarToken, validarIdPerfil, validarDatosActualizarPerfil, async (req, res) => {
    try {
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

    } catch (error) {
        return manejarErrorRespuesta(res, error, mapPerfilError);
    }
});

export default router;