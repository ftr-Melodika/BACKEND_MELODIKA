import status from 'http-status-codes';
import RankingRepository from '../repositories/rankingRepository.js';
import perfilService from './perfilService.js';
import grupoService from './grupoService.js';

const rankingRepository = new RankingRepository();

const mismoPerfil = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

const errorConEstado = (mensaje, codigoEstado) => Object.assign(new Error(mensaje), { status: codigoEstado });

class RankingService {

    async _exigirRanking(grupoId) {
        if (!await rankingRepository.existe(grupoId)) {
            throw errorConEstado("El grupo todavía no tiene un ranking", status.NOT_FOUND);
        }
    }

    // activo: el grupo ya tiene ranking; unido: yo ya acepté
    async _armarDetalle(grupoId, perfilId) {
        if (!await rankingRepository.existe(grupoId)) {
            return { activo: false, unido: false, participantes: [] };
        }
        const participantes = await rankingRepository.listarParticipantes(grupoId);
        return {
            activo: true,
            unido: participantes.some(p => mismoPerfil(p.id, perfilId)),
            participantes,
        };
    }

    async listarMisRankings(authId, perfilId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        const filas = await rankingRepository.listarDePerfil(perfilId);
        return filas.map(fila => ({
            grupoId: fila.grupo_id,
            grupoNombre: fila.grupo_nombre,
            totalParticipantes: fila.total_participantes,
            miPosicion: fila.mi_posicion,
        }));
    }

    async obtenerRankingGrupo(authId, perfilId, grupoId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        await grupoService.exigirMembresia(grupoId, perfilId);
        return this._armarDetalle(grupoId, perfilId);
    }

    async invitar(authId, perfilId, grupoId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        await grupoService.exigirMembresia(grupoId, perfilId);

        if (!await rankingRepository.crearConInvitacion(grupoId, perfilId)) {
            throw errorConEstado("El grupo ya tiene un ranking", status.CONFLICT);
        }
        return this._armarDetalle(grupoId, perfilId);
    }

    async aceptar(authId, perfilId, grupoId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        await grupoService.exigirMembresia(grupoId, perfilId);
        await this._exigirRanking(grupoId);

        await rankingRepository.agregarParticipante(grupoId, perfilId);
        return this._armarDetalle(grupoId, perfilId);
    }

    async salir(authId, perfilId, grupoId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        await grupoService.exigirMembresia(grupoId, perfilId);

        await rankingRepository.quitarParticipante(grupoId, perfilId);
        return { grupoId, unido: false };
    }
}

export default new RankingService();
