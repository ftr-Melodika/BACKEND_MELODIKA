// Archivo: src/entities/Curso.js
class Curso {
    constructor(id, nombre, descripcion, instrumentoId, caminoId, nivel, orden, obligatorio) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.instrumentoId = instrumentoId;
        this.caminoId = caminoId;
        this.nivel = nivel;
        this.orden = orden;
        this.obligatorio = obligatorio;
    }
}

export default Curso;