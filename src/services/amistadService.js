import AmistadRepository from '../repositories/amistadRepository.js';
import PerfilRepository from '../repositories/PerfilesRepository.js';
import CursoService from './cursoService.js';
import perfilService from './perfilService.js';

const amistadRepository = new AmistadRepository();
const perfilRepository = new PerfilRepository();
const cursoService = new CursoService();

const ESTADO_POR_ACCION = { aceptar: 'aceptada', rechazar: 'rechazada' };

const mismoPerfil = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

const aPerfilResumido = (fila) => ({
    amistadId: fila.amistad_id,
    perfil: { id: fila.id, nombre: fila.nombre, username: fila.username, avatarUrl: fila.avatar_url },
});

// Una solicitud rechazada no se le informa al emisor: para ambos cuenta como "ninguna".
function describirRelacion(amistad, perfilId) {
    if (!amistad || amistad.estado === 'rechazada') {
        return { estado: 'ninguna', amistadId: null };
    }
    if (amistad.estado === 'aceptada') {
        return { estado: 'amigos', amistadId: amistad.id };
    }
    const estado = mismoPerfil(amistad.perfil_1_id, perfilId) ? 'enviada' : 'recibida';
    return { estado, amistadId: amistad.id };
}

class AmistadService {

    async _obtenerPerfilActivo(perfilId) {
        const perfil = await perfilRepository.obtenerPorId(perfilId);
        if (!perfil || perfil.activo !== true) {
            throw new Error("El perfil no existe");
        }
        return perfil;
    }

    async _obtenerAmistad(amistadId) {
        const amistad = await amistadRepository.obtenerPorId(amistadId);
        if (!amistad) {
            throw new Error("Solicitud no encontrada");
        }
        return amistad;
    }

    // La privacidad se resuelve acá: sin permiso, estadisticas y pais no salen del servidor.
    // Los campos se copian uno por uno para no exponer cuentaId, fecha de nacimiento ni género.
    async obtenerPerfilSocial(authId, perfilId, otroId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        const otro = await this._obtenerPerfilActivo(otroId);

        const esPropio = mismoPerfil(perfilId, otro.id);
        const amistad = esPropio ? null : await amistadRepository.obtenerEntre(perfilId, otro.id);
        const relacion = describirRelacion(amistad, perfilId);
        const puedeVerEstadisticas = otro.esPublico || esPropio || relacion.estado === 'amigos';

        const datos = {
            id: otro.id,
            nombre: otro.nombre,
            username: otro.username,
            avatarUrl: otro.avatarUrl,
            esPublico: otro.esPublico,
            esPropio,
            totalAmigos: await amistadRepository.contarAmigos(otro.id),
            relacion,
            puedeVerEstadisticas,
            estadisticas: null,
        };

        if (puedeVerEstadisticas) {
            const progreso = await cursoService.resumirProgreso(otro.id);
            datos.pais = otro.pais;
            datos.estadisticas = {
                xp: otro.xp ?? 0,
                racha: otro.racha ?? 0,
                leccionesCompletadas: progreso.leccionesCompletadas,
                totalLecciones: progreso.totalLecciones,
                cursosCompletados: progreso.cursosCompletados,
                cursos: progreso.cursos.map(({ id, nombre, porcentaje, completado }) => ({ id, nombre, porcentaje, completado })),
            };
        }

        return datos;
    }

    async enviarSolicitud(authId, perfilId, destinoId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);

        if (mismoPerfil(perfilId, destinoId)) {
            throw new Error("No podés enviarte una solicitud a vos mismo");
        }
        const destino = await this._obtenerPerfilActivo(destinoId);

        const { amistad, existente } = await amistadRepository.enviarSolicitud(perfilId, destino.id);
        if (amistad) {
            return { amistadId: amistad.id, estado: amistad.estado };
        }

        if (existente?.estado === 'aceptada') {
            throw new Error("Ya son amigos");
        }
        if (existente && mismoPerfil(existente.perfil_1_id, perfilId)) {
            throw new Error("Ya le enviaste una solicitud a este perfil");
        }
        if (existente) {
            throw new Error("Este perfil ya te envió una solicitud");
        }
        throw new Error("Ya existe una solicitud o amistad con este perfil");
    }

    async listarSolicitudes(authId, perfilId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        const filas = await amistadRepository.listarSolicitudesPendientes(perfilId);

        const aSolicitud = (fila) => ({ ...aPerfilResumido(fila), createdAt: fila.created_at });
        return {
            recibidas: filas.filter(fila => fila.recibida).map(aSolicitud),
            enviadas: filas.filter(fila => !fila.recibida).map(aSolicitud),
        };
    }

    async responderSolicitud(authId, perfilId, amistadId, accion) {
        await perfilService.validarAccesoPerfil(authId, perfilId);

        const amistad = await this._obtenerAmistad(amistadId);
        if (!mismoPerfil(amistad.perfil_2_id, perfilId)) {
            throw new Error("No podés responder esta solicitud");
        }

        // El UPDATE vuelve a exigir 'pendiente', así dos respuestas simultáneas no se pisan
        const actualizada = await amistadRepository.responderSolicitud(amistadId, perfilId, ESTADO_POR_ACCION[accion]);
        if (!actualizada) {
            throw new Error("La solicitud ya fue respondida");
        }
        return { amistadId: actualizada.id, estado: actualizada.estado };
    }

    async eliminarAmistad(authId, perfilId, amistadId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);

        const fueEliminada = await amistadRepository.eliminar(amistadId, perfilId);
        if (fueEliminada) return;

        const amistad = await this._obtenerAmistad(amistadId);
        const participa = mismoPerfil(amistad.perfil_1_id, perfilId) || mismoPerfil(amistad.perfil_2_id, perfilId);
        // Una rechazada no se le informa al emisor, así que para él no existe
        if (participa && amistad.estado === 'rechazada') {
            throw new Error("Solicitud no encontrada");
        }
        throw new Error("No podés eliminar esta solicitud");
    }

    async listarAmigos(authId, perfilId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        const filas = await amistadRepository.listarAmigos(perfilId);
        return filas.map(aPerfilResumido);
    }
}

export default new AmistadService();
