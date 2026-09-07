// Archivo: src/entities/Ejercicio.js
class Ejercicio {
    constructor(
        id, 
        cursoId, 
        titulo, 
        descripcion, 
        tipo, 
        orden, 
        xpRecompensa, 
        youtubeId, 
        duracionSegundos, 
        cuerda, 
        trasteObjetivo, 
        notaEsperada, 
        dotLeft, 
        dotBottom, 
        textoTeoria, 
        textoDestacado, 
        instrucciones
    ) {
        this.id = id;
        this.cursoId = cursoId;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.tipo = tipo;
        this.orden = orden;
        this.xpRecompensa = xpRecompensa;
        this.youtubeId = youtubeId;
        this.duracionSegundos = duracionSegundos;
        this.cuerda = cuerda;
        this.trasteObjetivo = trasteObjetivo;
        this.notaEsperada = notaEsperada;
        this.dotLeft = dotLeft;
        this.dotBottom = dotBottom;
        this.textoTeoria = textoTeoria;
        this.textoDestacado = textoDestacado;
        this.instrucciones = instrucciones;
    }
}

export default Ejercicio;