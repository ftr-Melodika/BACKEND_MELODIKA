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
        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(500).json({ error: "Error al cargar el ranking" });
    }
});

router.post("/:id/racha", verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await perfilService.chequearRacha(id);
        
        if (!resultado.exito) {
            return res.status(404).json({ error: resultado.mensaje });
        }

        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(500).json({ error: "Error procesando la racha diaria" });
    }
});

//VERIFICAR ESTO
router.get("/", verificarToken, async (req, res) => {
    try {
        const authId = req.user.id; 
        
        const perfiles = await perfilService.obtenerPerfiles(authId);
        
        if (perfiles.length === 0) {
            return res.status(status.OK).json({
                success: true,
                data: [],
                message: "Aún no tienes perfiles creados. Muestra la pantalla de creación de perfil."
            });
        }

        
        res.status(status.OK).json({
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

//VERIFICAR ESTO
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