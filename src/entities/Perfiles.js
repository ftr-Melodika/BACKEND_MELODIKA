class Perfil {
    constructor(id, cuentaId, nombre, username, avatarUrl, pais, fechaNacimiento, genero, xp, racha, instrumentoActualId, activo) {
        this.id = id;
        this.cuentaId = cuentaId;
        this.nombre = nombre;
        this.username = username;
        this.avatarUrl = avatarUrl;
        this.pais = pais;
        this.fechaNacimiento = fechaNacimiento;
        this.genero = genero;
        this.xp = xp;
        this.racha = racha;
        this.instrumentoActualId = instrumentoActualId;
        this.activo = activo;
    }
}

export default Perfil;