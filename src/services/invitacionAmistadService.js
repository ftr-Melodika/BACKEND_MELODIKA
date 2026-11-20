import { randomBytes } from 'node:crypto';
import InvitacionAmistadRepository from '../repositories/invitacionAmistadRepository.js';
import AmistadRepository from '../repositories/amistadRepository.js';
import perfilService from './perfilService.js';
import { mismoPerfil, describirRelacion } from '../helpers/relacionAmistad.js';

const invitacionRepository = new InvitacionAmistadRepository();
const amistadRepository = new AmistadRepository();

const BYTES_TOKEN = 16; // 16 bytes en base64url = 22 caracteres
const PREFIJO_LINK = 'melodika://invitar/';

const generarToken = () => randomBytes(BYTES_TOKEN).toString('base64url');

const aInvitacion = (token) => ({ token, url: `${PREFIJO_LINK}${token}` });

const aPerfilPublico = (fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    username: fila.username,
    avatarUrl: fila.avatar_url,
});

class InvitacionAmistadService {

    // Si dos pedidos llegan juntos, uno crea el token y el otro lo lee
    async _obtenerOCrearToken(perfilId) {
        const existente = await invitacionRepository.obtenerTokenActivo(perfilId);
        if (existente) return existente;

        const creado = await invitacionRepository.crear(perfilId, generarToken());
        return creado ?? invitacionRepository.obtenerTokenActivo(perfilId);
    }

    // Usado también por amistadService para enviar una solicitud desde un link
    async obtenerDuenoDelToken(token) {
        const dueno = await invitacionRepository.obtenerPerfilPorToken(token);
        if (!dueno) {
            throw new Error("Invitación no válida");
        }
        return dueno;
    }

    async obtenerMiInvitacion(authId, perfilId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        return aInvitacion(await this._obtenerOCrearToken(perfilId));
    }

    async regenerarInvitacion(authId, perfilId) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        const nuevo = await invitacionRepository.reemplazar(perfilId, generarToken());
        // Si otra regeneración simultánea ganó, se devuelve la que quedó vigente
        return aInvitacion(nuevo ?? await invitacionRepository.obtenerTokenActivo(perfilId));
    }

    async verInvitacion(authId, perfilId, token) {
        await perfilService.validarAccesoPerfil(authId, perfilId);
        const dueno = await this.obtenerDuenoDelToken(token);

        const esPropio = mismoPerfil(perfilId, dueno.id);
        const relacion = esPropio
            ? { estado: 'propia', amistadId: null }
            : describirRelacion(await amistadRepository.obtenerEntre(perfilId, dueno.id), perfilId);

        return { perfil: aPerfilPublico(dueno), relacion, esPropio };
    }
}

export default new InvitacionAmistadService();
