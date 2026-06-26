import status from "http-status-codes";
import { Router } from "express";
import CursoService from "../services/cursoService.js";
import verificarToken from "../middlewares/authMiddleware.js";

const router = Router();
const cursoService = new CursoService();

// Endpoint protegido para obtener la lista de cursos de un perfil
router.get("/perfil/:perfilId", verificarToken, async (req, res) => {
    try {
        const { perfilId } = req.params;

        if (!perfilId) {
            return res.status(status.BAD_REQUEST).json({ error: "El ID del perfil es requerido." });
        }

        // Llamamos al servicio que tiene la lógica del Mock
        const datosCursos = await cursoService.listarCursos(perfilId);
        
        return res.status(status.OK).json(datosCursos);
    } catch (error) {
        console.error("Error al obtener los cursos:", error);
        return res.status(status.INTERNAL_SERVER_ERROR).json({ 
            error: "Hubo un problema al cargar los cursos." 
        });
    }
});

router.get("/:cursoId", verificarToken, async (req, res) => {
    try {
        const { cursoId } = req.params;
        const { perfilId } = req.query; // Lo sacamos de la URL

        if (!cursoId) {
            return res.status(status.BAD_REQUEST).json({ error: "El ID del curso es requerido." });
        }

        if (!perfilId) {
            return res.status(status.BAD_REQUEST).json({ error: "El ID del perfil es requerido como parámetro de consulta (?perfilId=...)." });
        }

        const detalleCurso = await cursoService.obtenerDetalleCurso(cursoId, perfilId);
        
        if (!detalleCurso) {
            return res.status(status.NOT_FOUND).json({ error: "Curso no encontrado." });
        }

        return res.status(status.OK).json(detalleCurso);
    } catch (error) {
        console.error("Error al obtener detalle del curso:", error);
        return res.status(status.INTERNAL_SERVER_ERROR).json({ 
            error: "Hubo un problema al cargar el detalle del curso." 
        });
    }
});

// POST: Cuando el alumno toca el botón "Terminado"
router.post("/:cursoId/lecciones/:leccionId/completar", verificarToken, async (req, res) => {
    try {
        const { cursoId, leccionId } = req.params;
        const { perfilId } = req.body; // El frontend nos manda quién es el perfil en el body

        if (!perfilId) {
            return res.status(status.BAD_REQUEST).json({ error: "Falta el ID del perfil." });
        }

        // Llamamos al servicio
        const resultado = await cursoService.completarLeccion(perfilId, cursoId, leccionId);

        if (!resultado.exito) {
            return res.status(status.BAD_REQUEST).json({ error: resultado.mensaje });
        }

        return res.status(status.OK).json({
            mensaje: "¡Ejercicio completado!",
            xpGanada: resultado.xpGanada,
            xpTotal: resultado.xpTotal
        });

    } catch (error) {
        console.error("Error en POST completar:", error);
        return res.status(status.INTERNAL_SERVER_ERROR).json({ error: "Error al guardar el progreso." });
    }
});

export default router;