// Pool de base de datos falso para las pruebas: nunca se conecta a nada.
// Uso (en un test, ANTES de importar el repository):
//   const { instalarPoolFalso } = await import('./_ayudas/poolFalso.js');
//   const pool = instalarPoolFalso(mock);       // mock viene de 'node:test'
//   pool.responder(/SELECT .* FROM cursos/, { rows: [...] });
//   const Repo = (await import('../src/repositories/x.js')).default;
//   pool.llamadas -> [{ sql, params }]
import { mock } from 'node:test';

export function crearPoolFalso() {
    const reglas = [];
    const llamadas = [];
    const ejecutar = async (sql, params = []) => {
        llamadas.push({ sql: String(sql), params });
        for (const r of reglas) {
            if (r.patron.test(String(sql))) {
                const v = typeof r.respuesta === 'function' ? r.respuesta(sql, params) : r.respuesta;
                if (v instanceof Error) throw v;
                return v;
            }
        }
        return { rows: [], rowCount: 0 };
    };
    const client = { query: ejecutar, release() {} };
    return {
        query: ejecutar,
        connect: async () => client,
        on() {},
        llamadas,
        responder(patron, respuesta) { reglas.unshift({ patron, respuesta }); },
        reiniciar() { reglas.length = 0; llamadas.length = 0; },
    };
}

export function instalarPoolFalso() {
    const pool = crearPoolFalso();
    mock.module(new URL('../../src/database/db.js', import.meta.url).href, { namedExports: { pool } });
    return pool;
}
