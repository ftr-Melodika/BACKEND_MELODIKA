import status from "http-status-codes";
import { Router } from "express";
import CursoService from "../services/cursoService.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { catchAsync } from "../helpers/catchAsync.js";

const router = Router();
const cursoService = new CursoService();

// GET: Lista todos los cursos del perfil
router.get("/perfil/:perfilId", verificarToken, catchAsync(async (req, res) => {
    /* #swagger.tags = ['Cursos']
       #swagger.summary = 'Listar catálogo de cursos' */
    
    const authId = req.user.id; // Extraído de la misma forma que en perfilController
    const { perfilId } = req.params; 

    if (!perfilId) {
        throw new Error("El ID del perfil es requerido.");
    }
    
    // Al pasar authId, a futuro el service puede validar que el perfil le pertenezca a este usuario
    const datosCursos = await cursoService.listarCursos(authId, perfilId);

    return res.status(status.OK).json({
        success: true,
        message: "Cursos obtenidos exitosamente.",
        data: datosCursos
    });
}));

// GET: Resumen de progreso del perfil (XP, racha, lecciones y curso actual)
router.get("/perfil/:perfilId/progreso", verificarToken, catchAsync(async (req, res) => {
    /* #swagger.tags = ['Cursos']
       #swagger.summary = 'Resumen de progreso del perfil' */

    const authId = req.user.id;
    const { perfilId } = req.params;

    const progreso = await cursoService.obtenerProgreso(authId, perfilId);

    return res.status(status.OK).json({
        success: true,
        message: "Progreso obtenido exitosamente.",
        data: progreso
    });
}));

// GET: Detalle de un curso con sus lecciones
router.get("/perfil/:perfilId/curso/:cursoId", verificarToken, catchAsync(async (req, res) => {
    /* #swagger.tags = ['Cursos']
       #swagger.summary = 'Detalle de curso y lecciones' */
    
    const authId = req.user.id;
    const { perfilId, cursoId } = req.params; // Todo unificado en req.params

    if (!cursoId) throw new Error("El ID del curso es requerido.");
    if (!perfilId) throw new Error("El ID del perfil es requerido.");

    const detalleCurso = await cursoService.obtenerDetalleCurso(authId, cursoId, perfilId);

    if (!detalleCurso) {
        throw new Error("Curso no encontrado.");
    }
    return res.status(status.OK).json({
        success: true,
        message: "Detalle del curso obtenido exitosamente.",
        data: detalleCurso
    });
}));

// POST: Completar una lección
router.post("/perfil/:perfilId/curso/:cursoId/lecciones/:leccionId/completar", verificarToken, catchAsync(async (req, res) => {
    /* #swagger.tags = ['Cursos']
       #swagger.summary = 'Completar lección / ejercicio'
       #swagger.description = 'Body opcional: { "omitida": true } saltea la lección: desbloquea la siguiente sin dar XP. Si después se llama sin omitida, gana el XP una sola vez.' */
    
    const authId = req.user.id;
    const { perfilId, cursoId, leccionId } = req.params;

    if (!perfilId) throw new Error("Falta el ID del perfil.");

    // Express deja req.body en undefined cuando el POST no trae body
    const omitir = req.body?.omitida;
    if (omitir !== undefined && typeof omitir !== "boolean") throw new Error("El campo omitida debe ser true o false.");

    const resultado = await cursoService.completarLeccion(authId, perfilId, cursoId, leccionId, { omitir: omitir === true });

    return res.status(status.OK).json({
        success: true,
        message: resultado.omitida ? "Lección omitida." : "¡Ejercicio completado!",
        data: {
            xpGanada: resultado.xpGanada,
            xpTotal: resultado.xpTotal,
            cursoCompletado: resultado.cursoCompletado,
            omitida: resultado.omitida
        }
    });
}));

// POST: Completar un curso
router.post("/perfil/:perfilId/curso/:cursoId/completar", verificarToken, catchAsync(async (req, res) => {
    /* #swagger.tags = ['Cursos']
       #swagger.summary = 'Marcar curso como completado' */
    
    const authId = req.user.id;
    const { perfilId, cursoId } = req.params;

    if (!perfilId) throw new Error("Falta el ID del perfil.");

    

    const resultado = await cursoService.completarCurso(authId, perfilId, cursoId);
    
    return res.status(status.OK).json({
        success: true,
        message: resultado.mensaje,
        data: null
    });
}));

export default router;