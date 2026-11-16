import { pool } from '../database/db.js';
import { manejarErrorDB } from '../helpers/manejoErrores/manejarErrorDB.js';

const COLUMNAS = 'id, titulo, artista, bpm, capo, progresion, formas, nota_rasgueo, consejo';

// De la fila de la base a lo que espera el frontend (camelCase)
const aCancion = (row) => ({
    id: row.id,
    titulo: row.titulo,
    artista: row.artista,
    bpm: row.bpm,
    capo: row.capo,
    progresion: row.progresion,
    formas: row.formas,
    notaRasgueo: row.nota_rasgueo,
    consejo: row.consejo,
});

class CancionRepository {

    async obtenerCanciones() {
        try {
            const resultado = await pool.query(`SELECT ${COLUMNAS} FROM canciones_practica ORDER BY orden ASC, titulo ASC`);
            return resultado.rows.map(aCancion);
        } catch (error) {
            manejarErrorDB(error, "Error al obtener las canciones.");
        }
    }

    async obtenerCancionPorId(id) {
        try {
            const resultado = await pool.query(`SELECT ${COLUMNAS} FROM canciones_practica WHERE id = $1`, [id]);
            return resultado.rows.length ? aCancion(resultado.rows[0]) : null;
        } catch (error) {
            manejarErrorDB(error, "Error al obtener la canción.");
        }
    }
}

export default CancionRepository;
