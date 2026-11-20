// Memoria temporal con vencimiento: guarda un valor por clave durante unos segundos.
// Sirve para no repetir consultas lentas (ej. preguntarle a Supabase quién es el dueño de un token)
// que dan siempre lo mismo en ese lapso. Tiene un tope de entradas para no crecer sin límite.
export class CacheTemporal {
    constructor({ duracionMs, maximo = 500 }) {
        this.duracionMs = duracionMs;
        this.maximo = maximo;
        this.entradas = new Map();
    }

    obtener(clave) {
        const entrada = this.entradas.get(clave);
        if (!entrada) return undefined;
        if (entrada.vence <= Date.now()) {
            this.entradas.delete(clave);
            return undefined;
        }
        return entrada.valor;
    }

    guardar(clave, valor) {
        if (this.entradas.size >= this.maximo) this._liberarEspacio();
        this.entradas.set(clave, { valor, vence: Date.now() + this.duracionMs });
    }

    // Primero se tiran las vencidas; si no alcanza, la más vieja (los Map conservan el orden de inserción)
    _liberarEspacio() {
        const ahora = Date.now();
        for (const [clave, { vence }] of this.entradas) {
            if (vence <= ahora) this.entradas.delete(clave);
        }
        if (this.entradas.size >= this.maximo) {
            this.entradas.delete(this.entradas.keys().next().value);
        }
    }
}
