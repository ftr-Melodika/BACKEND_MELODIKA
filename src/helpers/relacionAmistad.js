export const mismoPerfil = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

// Una solicitud rechazada no se le informa al emisor: para ambos cuenta como "ninguna".
export function describirRelacion(amistad, perfilId) {
    if (!amistad || amistad.estado === 'rechazada') {
        return { estado: 'ninguna', amistadId: null };
    }
    if (amistad.estado === 'aceptada') {
        return { estado: 'amigos', amistadId: amistad.id };
    }
    const estado = mismoPerfil(amistad.perfil_1_id, perfilId) ? 'enviada' : 'recibida';
    return { estado, amistadId: amistad.id };
}
