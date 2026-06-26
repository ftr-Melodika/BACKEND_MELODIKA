import status from "http-status-codes";
import { Router } from "express";
import perfilService from "../services/perfilService.js";
import { mapPerfilError } from "../helpers/mensajesErrores.js";
import verificarToken from "../middlewares/authMiddleware.js"; 
import validarDatosCrearPerfil from "../middlewares/validarDatosPerfil.js";

const router = Router();

router.get("/ranking", verificarToken, async (req, res) => {
    try {
        const resultado = await perfilService.obtenerRanking();
        
        return res.status(status.OK).json({ 
            success: true, 
            data: resultado 
        });
    } catch (error) {
        console.error("🔥 Error en GET /ranking:", error);
        
        const { codigoEstado, mensajeUsuario } = mapPerfilError(error);
        return res.status(codigoEstado).json({ 
            success: false, 
            message: mensajeUsuario 
        });
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
        console.error("🔥 Error en POST /racha:", error);
        
        const { codigoEstado, mensajeUsuario } = mapPerfilError(error);
        return res.status(codigoEstado).json({ 
            success: false, 
            message: mensajeUsuario 
        });
    }
});


router.get("/", verificarToken, async (req, res) => {
    try {
        const authId = req.user.id; 
        let mensajeExtra;
        const perfiles = await perfilService.obtenerPerfiles(authId);

        if (perfiles == null) mensajeExtra = "No tenes perfiles creados";
        else mensajeExtra = "Tiene perfiles"

        res.status(status.OK).json({
            mensajeExtra: mensajeExtra,
            success: true,
            data: perfiles,
        });
    } catch (error) {
        console.error("🔥 Error en POST /perfiles:", error);
        const { codigoEstado, mensajeUsuario } = mapPerfilError(error);

        res.status(codigoEstado).json({
            success: false,
            message: mensajeUsuario
        });
    }
});


router.post("/", verificarToken, validarDatosCrearPerfil, async (req, res) => {
    try {
        const authId = req.user.id;
        const datosPerfil = req.body; 

        const nuevoPerfil = await perfilService.crearPerfil(authId, datosPerfil);

        res.status(status.CREATED).json({
            success: true,
            message: "Perfil creado exitosamente",
            data: nuevoPerfil
        });
    } catch (error) {
        const { codigoEstado, mensajeUsuario } = mapPerfilError(error);

        res.status(codigoEstado).json({
            success: false,
            message: mensajeUsuario
        });
    }
});

export default router;