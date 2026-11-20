import GrupoRepository, { CODIGO_REPETIDO } from '../repositories/grupoRepository.js';
import AmistadRepository from '../repositories/amistadRepository.js';
import perfilService from './perfilService.js';
import { generarCodigoGrupo } from '../helpers/codigoGrupo.js';

const grupoRepository = new GrupoRepository();
const amistadRepository = new AmistadRepository();

// Con 62^8 códigos posibles, que se repita dos veces seguidas es casi imposible
const INTENTOS_CODIGO = 3;

const mismoPerfil = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

// Los campos se copian uno por uno: acá no viaja avatarUrl (hay fotos de más de 100 KB y el
// chat se consulta cada pocos segundos) ni cuentaId, fecha de nacimiento o género.
const aMensaje = (fila, perfilId) => ({
    id: fila.id,
    tipo: fila.tipo,
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

    async exigirMembresia(grupoId, perfilId) {
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
            esPrivado: grupo.es_privado,
            // Solo quien ya está adentro ve el código, para poder pasárselo a otros
            codigo: grupo.unido ? grupo.codigo : null,
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
            esPrivado: fila.es_privado,
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
            esPrivado: fila.es_privado,
            unido: fila.unido,
        }));
    }

    // Solo se puede sumar directo a amigos aceptados (y con perfil activo)
    async _exigirQueSeanAmigos(perfilId, miembroIds) {
        if (miembroIds.length === 0) return;
        const amigos = await amistadRepository.filtrarAmigos(perfilId, miembroIds);
        if (amigos.length !== miembroIds.length) {
            throw new Error("Solo podés agregar a tus amigos");
        }
    }

    // Un grupo privado recibe un código al azar; si justo lo tiene otro grupo, se prueba con otro
    async _crearConCodigo(perfilId, nombre, descripcion, miembroIds, esPrivado) {
        for (let intento = 0; intento < INTENTOS_CODIGO; intento++) {
            const codigo = esPrivado ? generarCodigoGrupo() : null;
            const resultado = await grupoRepository.crear(perfilId, nombre, descripcion, miembroIds, codigo);
            if (resultado !== CODIGO_REPETIDO) return resultado;
        }
        throw new Error("No se pudo generar el código del grupo");
    }

    async crearGrupo(authId, perfilId, nombre, descripcion, miembroIds = [], esPrivado = false) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        await this._exigirQueSeanAmigos(perfilId, miembroIds);
        const grupoId = await this._crearConCodigo(perfilId, nombre, descripcion, miembroIds, esPrivado);
        if (!grupoId) {
            throw new Error("Ya existe un grupo con ese nombre");
        }
        return this._armarDetalle(grupoId, perfilId);
    }

    async obtenerGrupo(authId, perfilId, grupoId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        return this._armarDetalle(grupoId, perfilId);
    }

    // A un grupo público entra cualquiera. A uno privado, solo con su código exacto.
    // Quien ya es miembro no necesita código (unirse de nuevo no cambia nada).
    async unirse(authId, perfilId, grupoId, codigo = null) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        const grupo = await this._obtenerGrupo(grupoId, perfilId);
        if (grupo.es_privado && !grupo.unido) {
            if (!codigo) throw new Error("El grupo es privado");
            if (codigo !== grupo.codigo) throw new Error("Código de grupo incorrecto");
        }
        await grupoRepository.agregarMiembro(grupoId, perfilId);
        return { grupoId, unido: true, grupo: await this._armarDetalle(grupoId, perfilId) };
    }

    // Para quien solo tiene el código: busca el grupo privado que lo tiene y entra
    async unirseConCodigo(authId, perfilId, codigo) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        const grupoId = await grupoRepository.obtenerIdPorCodigo(codigo);
        if (!grupoId) {
            throw new Error("Código de grupo incorrecto");
        }
        await grupoRepository.agregarMiembro(grupoId, perfilId);
        return { grupoId, unido: true, grupo: await this._armarDetalle(grupoId, perfilId) };
    }

    async salir(authId, perfilId, grupoId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        await this._obtenerGrupo(grupoId, perfilId);
        await grupoRepository.quitarMiembro(grupoId, perfilId);
        return { grupoId, unido: false };
    }

    async listarMensajes(authId, perfilId, grupoId, { limite, despues, antes }) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        await this.exigirMembresia(grupoId, perfilId);

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
        await this.exigirMembresia(grupoId, perfilId);

        const fila = await grupoRepository.crearMensaje(grupoId, perfilId, contenido);
        return aMensaje({
            ...fila,
            remitente_nombre: perfilExistente.nombre,
            remitente_username: perfilExistente.username,
        }, perfilId);
    }
}

export default new GrupoService();
