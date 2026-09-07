import status from "http-status-codes";
import { Router } from "express";
import CursoService from "../services/cursoService.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { mapCursoError } from "../helpers/errores/cursoErrores.js";
import { manejarErrorRespuesta } from "../helpers/manejarErrorRespuesta.js";

const router = Router();
const cursoService = new CursoService();

// GET: Lista todos los cursos del perfil
router.get("/perfil/:perfilId", verificarToken, async (req, res) => {
    try {
        const { perfilId } = req.params;

        if (!perfilId) {
            throw new Error("El ID del perfil es requerido.");
        }

        const datosCursos = await cursoService.listarCursos(perfilId);
        
        return res.status(status.OK).json({
            success: true,
            message: "Cursos obtenidos exitosamente.",
            data: datosCursos
        });
    } catch (error) {
        return manejarErrorRespuesta(res, error, mapCursoError);
    }
});

// GET: Detalle de un curso con sus lecciones
router.get("/:cursoId", verificarToken, async (req, res) => {
    try {
        const { cursoId } = req.params;
        const { perfilId } = req.query;

        if (!cursoId) {
            throw new Error("El ID del curso es requerido.");
        }
        if (!perfilId) {
            throw new Error("El ID del perfil es requerido como parámetro de consulta (?perfilId=...).");
        }

        const detalleCurso = await cursoService.obtenerDetalleCurso(cursoId, perfilId);
        
        if (!detalleCurso) {
            throw new Error("Curso no encontrado.");
        }

        return res.status(status.OK).json({
            success: true,
            message: "Detalle del curso obtenido exitosamente.",
            data: detalleCurso
        });
    } catch (error) {
        return manejarErrorRespuesta(res, error, mapCursoError);
    }
});

// POST: Completar una lección
router.post("/:cursoId/lecciones/:leccionId/completar", verificarToken, async (req, res) => {
    try {
        const { cursoId, leccionId } = req.params;
        const { perfilId } = req.body;

        if (!perfilId) {
            throw new Error("Falta el ID del perfil.");
        }

        const resultado = await cursoService.completarLeccion(perfilId, cursoId, leccionId);

        return res.status(status.OK).json({
            success: true,
            message: "¡Ejercicio completado!",
            data: {
                xpGanada: resultado.xpGanada,
                xpTotal: resultado.xpTotal
            }
        });

    } catch (error) {
        return manejarErrorRespuesta(res, error, mapCursoError);
    }
});

router.post("/:cursoId/completar", verificarToken, async (req, res) => {
    try {
        const { cursoId } = req.params;
        const { perfilId } = req.body;

        if (!perfilId) {
            throw new Error("Falta el ID del perfil.");
        }

        const resultado = await cursoService.completarCurso(perfilId, cursoId);

        return res.status(status.OK).json({
            success: true,
            message: resultado.mensaje,
            data: null
        });

    } catch (error) {
        return manejarErrorRespuesta(res, error, mapCursoError);
    }
});

export default router;