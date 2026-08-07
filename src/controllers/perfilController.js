import status from "http-status-codes";
import { Router } from "express";
import perfilService from "../services/perfilService.js";
import { mapPerfilError } from "../helpers/mensajesErrores.js";
import verificarToken from "../middlewares/authMiddleware.js"; 
import validarDatosCrearPerfil from "../middlewares/validarDatosPerfil.js";
import validadores from "../helpers/validadores.js";

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

        // Extraemos explícitamente solo lo que necesitamos (¡Buena práctica de seguridad!)
        const { nombre, username, fecha_nacimiento, genero, pais, avatarUrl } = req.body;
        
        // Lo empaquetamos de nuevo para dárselo a tu servicio
        const datosPerfil = { nombre, username, fecha_nacimiento, genero, pais, avatarUrl };

        const nuevoPerfil = await perfilService.crearPerfil(authId, datosPerfil);

        res.status(status.CREATED).json({
            success: true,
            message: "Perfil creado exitosamente",
            data: nuevoPerfil
        });
    } catch (error) {

        console.error("🔥 ERROR DETALLADO EN EL BACKEND:", error);

        const { codigoEstado, mensajeUsuario } = mapPerfilError(error);

        res.status(codigoEstado).json({
            success: false,
            message: mensajeUsuario,
            debug: error.message
        });
    }
});

    router.delete("/:id", verificarToken, async (req, res) => {
        try {

            const authId = req.user.id;
            const { id } = req.params;

            if (!validadores.esIdValido(id)) {
            return res.status(status.BAD_REQUEST).json({
                success: false,
                message: "El formato del ID no es válido."
            });
        }

            await perfilService.eliminarPerfil(authId, id);

            // 4. Respondemos con éxito
            return res.status(status.OK).json({
                success: true,  
                message: "Perfil eliminado exitosamente."
            });

        } catch (error) {
            console.error("🚨 Error en DELETE /perfiles/:id:", error);
            
            // 5. Manejamos el error usando tu helper centralizado
            const { codigoEstado, mensajeUsuario } = mapPerfilError(error);
            return res.status(codigoEstado).json({
                success: false,
                message: mensajeUsuario
            });
        }
    });



export default router;