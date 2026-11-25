import status from "http-status-codes";
import { Router } from "express";
import CancionService from "../services/cancionService.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { catchAsync } from "../helpers/catchAsync.js";
import { validarPerfilIdCancion, validarIdCancion, validarEstrellas } from "../middlewares/validadores/validarDatosCancion.js";

const router = Router();
const cancionService = new CancionService();

// GET: Todas las canciones de la sección Práctica, con acordes, rasgueo, tempo y capo
router.get("/", verificarToken, catchAsync(async (req, res) => {
    /* #swagger.tags = ['Canciones']
       #swagger.summary = 'Listar canciones'
       #swagger.description = 'Cada canción: { id, titulo, artista, bpm, capo, progresion: [{ acordes: "Em C", rasgueo: "D-D-UUDD" }], formas, notaRasgueo, consejo, genero, portada, dificultad }. genero, portada (URL) y dificultad ("facil" | "intermedia" | "dificil") pueden ser null. El rasgueo son 8 corcheas (D abajo, U arriba, X apagado, - sin tocar); con dos acordes, las 4 primeras son del primero.' */

    const canciones = await cancionService.listarCanciones();

    return res.status(status.OK).json({
        success: true,
        message: "Canciones obtenidas exitosamente.",
        data: canciones
    });
}));

// GET: Ids de las canciones favoritas del perfil
router.get("/perfil/:perfilId/favoritas", verificarToken, validarPerfilIdCancion, catchAsync(async (req, res) => {
    /* #swagger.tags = ['Canciones']
       #swagger.summary = 'Listar canciones favoritas del perfil'
       #swagger.description = 'Devuelve la lista de ids de canciones favoritas, de la más nueva a la más vieja. Lista vacía si no hay ninguna.' */

    const favoritas = await cancionService.listarFavoritas(req.user.id, req.params.perfilId);

    return res.status(status.OK).json({
        success: true,
        message: "Favoritas obtenidas exitosamente.",
        data: favoritas
    });
}));

// POST: Marcar una canción como favorita (si ya lo era, no pasa nada)
router.post("/perfil/:perfilId/:cancionId/favorita", verificarToken, validarPerfilIdCancion, validarIdCancion, catchAsync(async (req, res) => {
    /* #swagger.tags = ['Canciones']
       #swagger.summary = 'Marcar canción como favorita' */

    const { perfilId, cancionId } = req.params;
    const resultado = await cancionService.marcarFavorita(req.user.id, perfilId, cancionId);

    return res.status(status.CREATED).json({
        success: true,
        message: "Canción agregada a favoritas.",
        data: resultado
    });
}));

// DELETE: Quitar una canción de favoritas (si no lo era, no pasa nada)
router.delete("/perfil/:perfilId/:cancionId/favorita", verificarToken, validarPerfilIdCancion, validarIdCancion, catchAsync(async (req, res) => {
    /* #swagger.tags = ['Canciones']
       #swagger.summary = 'Quitar canción de favoritas' */

    const { perfilId, cancionId } = req.params;
    const resultado = await cancionService.quitarFavorita(req.user.id, perfilId, cancionId);

    return res.status(status.OK).json({
        success: true,
        message: "Canción quitada de favoritas.",
        data: resultado
    });
}));

// GET: Estrellas del perfil por canción
router.get("/perfil/:perfilId/estrellas", verificarToken, validarPerfilIdCancion, catchAsync(async (req, res) => {
    /* #swagger.tags = ['Canciones']
       #swagger.summary = 'Estrellas del perfil por canción'
       #swagger.description = 'Objeto { idCancion: estrellas } (1 a 3) solo con las canciones que el perfil ya tocó. Vacío si no tocó ninguna.' */

    const estrellas = await cancionService.listarEstrellas(req.user.id, req.params.perfilId);

    return res.status(status.OK).json({
        success: true,
        message: "Estrellas obtenidas exitosamente.",
        data: estrellas
    });
}));

// PUT: Guardar estrellas de una canción (solo si superan las que ya tenía)
router.put("/perfil/:perfilId/:cancionId/estrellas", verificarToken, validarPerfilIdCancion, validarIdCancion, validarEstrellas, catchAsync(async (req, res) => {
    /* #swagger.tags = ['Canciones']
       #swagger.summary = 'Guardar estrellas de una canción'
       #swagger.description = 'Body { estrellas: 1 | 2 | 3 }. Se guarda solo el mejor resultado: si ya tenía más estrellas, no baja. Devuelve las que quedaron.' */

    const { perfilId, cancionId } = req.params;
    const resultado = await cancionService.guardarEstrellas(req.user.id, perfilId, cancionId, req.body.estrellas);

    return res.status(status.OK).json({
        success: true,
        message: "Estrellas guardadas.",
        data: resultado
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
