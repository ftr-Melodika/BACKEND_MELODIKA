// Código de los grupos privados: 8 caracteres entre letras mayúsculas, minúsculas y números.
// Distingue mayúsculas: "AbC12345" y "abc12345" son códigos distintos (62^8 combinaciones).
import { randomInt } from 'node:crypto';

const CARACTERES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export const LARGO_CODIGO_GRUPO = 8;
const FORMATO = new RegExp(`^[A-Za-z0-9]{${LARGO_CODIGO_GRUPO}}$`);

export const esCodigoGrupoValido = (codigo) => typeof codigo === 'string' && FORMATO.test(codigo);

// randomInt usa el generador criptográfico: el código no se puede adivinar a partir de otros
export function generarCodigoGrupo() {
    let codigo = '';
    for (let i = 0; i < LARGO_CODIGO_GRUPO; i++) {
        codigo += CARACTERES[randomInt(CARACTERES.length)];
    }
    return codigo;
}
