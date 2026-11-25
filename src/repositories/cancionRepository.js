import { pool } from '../database/db.js';
import { manejarErrorDB } from '../helpers/manejoErrores/manejarErrorDB.js';
import { MENSAJES_ERROR_DB } from '../helpers/manejoErrores/mensajesErrorDB.js';

const COLUMNAS = 'id, titulo, artista, bpm, capo, progresion, formas, nota_rasgueo, consejo, genero, portada, dificultad';

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
    genero: row.genero,
    portada: row.portada,
    dificultad: row.dificultad,
});

class CancionRepository {

    async obtenerCanciones() {
        try {
            const resultado = await pool.query(`SELECT ${COLUMNAS} FROM canciones_practica ORDER BY orden ASC, titulo ASC`);
            return resultado.rows.map(aCancion);
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.OBTENER_CANCIONES);
        }
    }

    async obtenerCancionPorId(id) {
        try {
            const resultado = await pool.query(`SELECT ${COLUMNAS} FROM canciones_practica WHERE id = $1`, [id]);
            return resultado.rows.length ? aCancion(resultado.rows[0]) : null;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.OBTENER_CANCION);
        }
    }

    // Ids de las canciones favoritas del perfil, de la más nueva a la más vieja
    async obtenerIdsFavoritas(perfilId) {
        try {
            const resultado = await pool.query(
                'SELECT cancion_id FROM canciones_favoritas WHERE perfil_id = $1 ORDER BY creada_en DESC',
                [perfilId],
            );
            return resultado.rows.map((row) => row.cancion_id);
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.OBTENER_FAVORITAS);
        }
    }

    // Marcar dos veces la misma canción no falla: queda una sola fila
    async agregarFavorita(perfilId, cancionId) {
        try {
            await pool.query(
                'INSERT INTO canciones_favoritas (perfil_id, cancion_id) VALUES ($1, $2) ON CONFLICT (perfil_id, cancion_id) DO NOTHING',
                [perfilId, cancionId],
            );
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.AGREGAR_FAVORITA);
        }
    }

    // Quitar una que no estaba marcada tampoco falla
    async quitarFavorita(perfilId, cancionId) {
        try {
            await pool.query('DELETE FROM canciones_favoritas WHERE perfil_id = $1 AND cancion_id = $2', [perfilId, cancionId]);
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.QUITAR_FAVORITA);
        }
    }

    // Estrellas del perfil: { "sera": 2, "creep": 3 }, solo de las canciones que tocó
    async obtenerEstrellas(perfilId) {
        try {
            const resultado = await pool.query('SELECT cancion_id, estrellas FROM canciones_estrellas WHERE perfil_id = $1', [perfilId]);
            return Object.fromEntries(resultado.rows.map((row) => [row.cancion_id, row.estrellas]));
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.OBTENER_ESTRELLAS);
        }
    }

    // Guarda el mejor resultado: si ya había más estrellas, se queda con las que había. Devuelve las que quedaron.
    async guardarMejorEstrellas(perfilId, cancionId, estrellas) {
        try {
            const resultado = await pool.query(
                `INSERT INTO canciones_estrellas (perfil_id, cancion_id, estrellas) VALUES ($1, $2, $3)
                 ON CONFLICT (perfil_id, cancion_id) DO UPDATE
                 SET estrellas = GREATEST(canciones_estrellas.estrellas, EXCLUDED.estrellas),
                     actualizada_en = CASE WHEN EXCLUDED.estrellas > canciones_estrellas.estrellas THEN now() ELSE canciones_estrellas.actualizada_en END
                 RETURNING estrellas`,
                [perfilId, cancionId, estrellas],
            );
            return resultado.rows[0].estrellas;
        } catch (error) {
            manejarErrorDB(error, MENSAJES_ERROR_DB.GUARDAR_ESTRELLAS);
        }
    }
}

export default CancionRepository;
