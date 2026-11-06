import GrupoRepository from '../repositories/grupoRepository.js';
import perfilService from './perfilService.js';

const grupoRepository = new GrupoRepository();

const mismoPerfil = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

// Los campos se copian uno por uno: acá no viaja avatarUrl (hay fotos de más de 100 KB y el
// chat se consulta cada pocos segundos) ni cuentaId, fecha de nacimiento o género.
const aMensaje = (fila, perfilId) => ({
    id: fila.id,
    contenido: fila.contenido,
    createdAt: fila.created_at,
    remitente: fila.remitente_id
        ? { id: fila.remitente_id, nombre: fila.remitente_nombre, username: fila.remitente_username }
        : null,
    esMio: mismoPerfil(fila.remitente_id, perfilId),
});

class GrupoService {

    // La pertenencia se consulta en cada llamada: no depende de lo que recuerde el cliente
    async _obtenerGrupo(grupoId, perfilId) {
        const grupo = await grupoRepository.obtenerPorId(grupoId, perfilId);
        if (!grupo) {
            throw new Error("Grupo no encontrado");
        }
        return grupo;
    }

    async _exigirMembresia(grupoId, perfilId) {
        const grupo = await this._obtenerGrupo(grupoId, perfilId);
        if (!grupo.unido) {
            throw new Error("No sos miembro de este grupo");
        }
    }

    async _exigirMensaje(grupoId, mensajeId) {
        if (!await grupoRepository.existeMensaje(grupoId, mensajeId)) {
            throw new Error("Mensaje no encontrado");
        }
    }

    async _armarDetalle(grupoId, perfilId) {
        const grupo = await this._obtenerGrupo(grupoId, perfilId);
        const miembros = grupo.unido ? await grupoRepository.listarMiembros(grupoId) : [];
        return {
            id: grupo.id,
            nombre: grupo.nombre,
            descripcion: grupo.descripcion,
            totalMiembros: grupo.total_miembros,
            esCreador: mismoPerfil(grupo.creador_id, perfilId),
            unido: grupo.unido,
            miembros,
        };
    }

    async listarMisGrupos(authId, perfilId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        const filas = await grupoRepository.listarDePerfil(perfilId);
        return filas.map(fila => ({
            id: fila.id,
            nombre: fila.nombre,
            descripcion: fila.descripcion,
            totalMiembros: fila.total_miembros,
            esCreador: mismoPerfil(fila.creador_id, perfilId),
            ultimoMensaje: fila.ultimo_created_at
                ? {
                    contenido: fila.ultimo_contenido,
                    createdAt: fila.ultimo_created_at,
                    remitenteNombre: fila.ultimo_remitente_nombre,
                }
                : null,
        }));
    }

    async buscarGrupos(authId, perfilId, texto) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        const filas = await grupoRepository.buscar(perfilId, texto);
        return filas.map(fila => ({
            id: fila.id,
            nombre: fila.nombre,
            descripcion: fila.descripcion,
            totalMiembros: fila.total_miembros,
            unido: fila.unido,
        }));
    }

    async crearGrupo(authId, perfilId, nombre, descripcion) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        const grupoId = await grupoRepository.crear(perfilId, nombre, descripcion);
        if (!grupoId) {
            throw new Error("Ya existe un grupo con ese nombre");
        }
        return this._armarDetalle(grupoId, perfilId);
    }

    async obtenerGrupo(authId, perfilId, grupoId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        return this._armarDetalle(grupoId, perfilId);
    }

    async unirse(authId, perfilId, grupoId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        await this._obtenerGrupo(grupoId, perfilId);
        await grupoRepository.agregarMiembro(grupoId, perfilId);
        return { grupoId, unido: true };
    }

    async salir(authId, perfilId, grupoId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        await this._obtenerGrupo(grupoId, perfilId);
        await grupoRepository.quitarMiembro(grupoId, perfilId);
        return { grupoId, unido: false };
    }

    async listarMensajes(authId, perfilId, grupoId, { limite, despues, antes }) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        await this._exigirMembresia(grupoId, perfilId);

        if (despues) {
            await this._exigirMensaje(grupoId, despues);
            const [filas, anteriores] = await Promise.all([
                grupoRepository.listarMensajesPosteriores(grupoId, limite, despues),
                grupoRepository.listarMensajesRecientes(grupoId, 1, despues),
            ]);
            return {
                mensajes: filas.map(fila => aMensaje(fila, perfilId)),
                hayMasAnteriores: anteriores.length > 0,
            };
        }

        if (antes) {
            await this._exigirMensaje(grupoId, antes);
        }
        // Se pide uno de más para saber si quedan anteriores sin hacer otra consulta
        const filas = await grupoRepository.listarMensajesRecientes(grupoId, limite + 1, antes);
        return {
            mensajes: filas.slice(0, limite).reverse().map(fila => aMensaje(fila, perfilId)),
            hayMasAnteriores: filas.length > limite,
        };
    }

    async enviarMensaje(authId, perfilId, grupoId, contenido) {
        const { perfilExistente } = await perfilService.validarAccesoPerfil(authId, perfilId);
        await this._exigirMembresia(grupoId, perfilId);

        const fila = await grupoRepository.crearMensaje(grupoId, perfilId, contenido);
        return aMensaje({
            ...fila,
            remitente_nombre: perfilExistente.nombre,
            remitente_username: perfilExistente.username,
        }, perfilId);
    }
}

export default new GrupoService();
