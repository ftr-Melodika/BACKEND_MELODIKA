import status from "http-status-codes";
import CancionRepository from "../repositories/cancionRepository.js";

const cancionRepository = new CancionRepository();

class CancionService {

    async listarCanciones() {
        return cancionRepository.obtenerCanciones();
    }

    async obtenerCancion(id) {
        const cancion = await cancionRepository.obtenerCancionPorId(id);
        if (!cancion) {
            const error = new Error("Canción no encontrada.");
            error.status = status.NOT_FOUND;
            throw error;
        }
        return cancion;
    }
}

export default CancionService;
