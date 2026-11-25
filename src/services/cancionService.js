import status from "http-status-codes";
import CancionRepository from "../repositories/cancionRepository.js";
import perfilService from "./perfilService.js";

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

    // Ids de las canciones que el perfil marcó como favoritas
    async listarFavoritas(authId, perfilId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        return cancionRepository.obtenerIdsFavoritas(perfilId);
    }

    async marcarFavorita(authId, perfilId, cancionId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        await this.obtenerCancion(cancionId); // 404 si la canción no existe
        await cancionRepository.agregarFavorita(perfilId, cancionId);
        return { cancionId, favorita: true };
    }

    async quitarFavorita(authId, perfilId, cancionId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        await cancionRepository.quitarFavorita(perfilId, cancionId);
        return { cancionId, favorita: false };
    }

    // Estrellas de cada canción tocada por el perfil: { "sera": 2 }
    async listarEstrellas(authId, perfilId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        return cancionRepository.obtenerEstrellas(perfilId);
    }

    // Se guarda solo si supera lo que ya tenía; devuelve el mejor resultado
    async guardarEstrellas(authId, perfilId, cancionId, estrellas) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        await this.obtenerCancion(cancionId); // 404 si la canción no existe
        const mejor = await cancionRepository.guardarMejorEstrellas(perfilId, cancionId, estrellas);
        return { cancionId, estrellas: mejor };
    }
}

export default CancionService;
