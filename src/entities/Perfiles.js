class Perfil {
    constructor(id, cuentaId, nombre, username, avatarUrl, pais, xp, racha, instrumentoActualId, activo) {
        this.id = id;
        this.cuentaId = cuentaId;
        this.nombre = nombre;
        this.username = username;
        this.avatarUrl = avatarUrl;
        this.pais = pais;
        this.xp = xp;
        this.racha = racha;
        this.instrumentoActualId = instrumentoActualId;
        this.activo = activo;
    }
}

export default Perfil;