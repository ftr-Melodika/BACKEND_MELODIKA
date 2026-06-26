class Cuenta {
    constructor(id, authId, nombre, apellido, telefono, planPremium, rol) {
        this.id = id;
        this.authId = authId;
        this.nombre = nombre;
        this.apellido = apellido;
        this.telefono = telefono;
        this.planPremium = planPremium;
        this.rol = rol;
    }
}

export default Cuenta;