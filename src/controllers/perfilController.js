import status from "http-status-codes";
import { Router } from "express";
import perfilService from "../services/perfilService.js";
import { mapPerfilError } from "../helpers/mensajesErrores.js";
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

    router.delete("/:id", verificarToken, validarIdPerfil, async (req, res) => {
        try {

            const authId = req.user.id;
            const { id } = req.params;

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

    router.put("/:id", verificarToken, validarIdPerfil, validarDatosActualizarPerfil, async (req, res) => {
    try {
        const authId = req.user.id; // Lo inyecta verificarToken
        const { id } = req.params;  // El ID del perfil desde la URL
        
        // Extraemos explícitamente solo lo que permitimos actualizar en esta ruta
        // Si mandan un "username" acá, lo ignoramos por completo
        const { nombre, fecha_nacimiento, genero, pais, avatarUrl } = req.body;
        
        // Empaquetamos los datos limpios para el servicio
        const datosPerfil = { nombre, fecha_nacimiento, genero, pais, avatarUrl };

        const perfilActualizado = await perfilService.actualizarPerfil(authId, id, datosPerfil);

        return res.status(status.OK).json({
            success: true,
            message: "Perfil actualizado correctamente.",
            data: perfilActualizado
        });

    } catch (error) {
        console.error(" Error en PUT /perfiles/:id:", error);
        
        // Manejamos el error usando tu helper centralizado
        const { codigoEstado, mensajeUsuario } = mapPerfilError(error);
        return res.status(codigoEstado).json({
            success: false,
            message: mensajeUsuario
        });
    }
});



export default router;