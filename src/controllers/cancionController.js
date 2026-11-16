import status from "http-status-codes";
import { Router } from "express";
import CancionService from "../services/cancionService.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { catchAsync } from "../helpers/catchAsync.js";

const router = Router();
const cancionService = new CancionService();

// GET: Todas las canciones de la sección Práctica, con acordes, rasgueo, tempo y capo
router.get("/", verificarToken, catchAsync(async (req, res) => {
    /* #swagger.tags = ['Canciones']
       #swagger.summary = 'Listar canciones'
       #swagger.description = 'Cada canción: { id, titulo, artista, bpm, capo, progresion: [{ acordes: "Em C", rasgueo: "D-D-UUDD" }], formas, notaRasgueo, consejo }. El rasgueo son 8 corcheas (D abajo, U arriba, X apagado, - sin tocar); con dos acordes, las 4 primeras son del primero.' */

    const canciones = await cancionService.listarCanciones();

    return res.status(status.OK).json({
        success: true,
        message: "Canciones obtenidas exitosamente.",
        data: canciones
    });
}));

// GET: Una canción
router.get("/:id", verificarToken, catchAsync(async (req, res) => {
    /* #swagger.tags = ['Canciones']
       #swagger.summary = 'Detalle de una canción' */

    const cancion = await cancionService.obtenerCancion(req.params.id);

    return res.status(status.OK).json({
        success: true,
        message: "Canción obtenida exitosamente.",
        data: cancion
    });
}));

export default router;
