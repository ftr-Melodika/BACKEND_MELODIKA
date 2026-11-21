import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

console.error = () => {};
const { instalarPoolFalso } = await import('../_ayudas/poolFalso.js');
const pool = instalarPoolFalso();
let liberados = 0;
const conectarOriginal = pool.connect;
pool.connect = async () => { const c = await conectarOriginal(); c.release = () => { liberados++; }; return c; };

const { default: GrupoRepository, CODIGO_REPETIDO } = await import('../../src/repositories/grupoRepository.js');
const { MENSAJES_ERROR_DB } = await import('../../src/helpers/manejoErrores/mensajesErrorDB.js');

const repo = new GrupoRepository();
const errorBD = (code = '08006', extra = {}) => Object.assign(new Error('boom'), { code, ...extra });
const verbos = () => pool.llamadas.map(l => l.sql.trim().split(/\s/)[0]);
const MSG = MENSAJES_ERROR_DB.GESTIONAR_GRUPOS;

beforeEach(() => { pool.reiniciar(); liberados = 0; });

describe('GrupoRepository.listarDePerfil', () => {
    test('devuelve las filas con $1 = perfil', async () => {
        const rows = [{ id: 'g1', nombre: 'G', total_miembros: 2 }];
        pool.responder(/FROM chat_participantes yo/, { rows });
        assert.deepEqual(await repo.listarDePerfil('p1'), rows);
        assert.deepEqual(pool.llamadas[0].params, ['p1']);
    });
    test('el total de miembros ignora perfiles dados de baja', async () => {
        await repo.listarDePerfil('p1');
        assert.match(pool.llamadas[0].sql, /p\.activo = true/);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/chat_participantes/, errorBD());
        await assert.rejects(() => repo.listarDePerfil('p1'), { message: MSG });
    });
});

describe('GrupoRepository.buscar', () => {
    test('con texto manda perfil y patron %texto% como parámetros', async () => {
        await repo.buscar('p1', 'rock');
        assert.deepEqual(pool.llamadas[0].params, ['p1', '%rock%']);
        assert.doesNotMatch(pool.llamadas[0].sql, /rock/);
    });
    test('escapa los comodines % _ \\ del texto buscado', async () => {
        await repo.buscar('p1', '50%_a\\b');
        assert.deepEqual(pool.llamadas[0].params, ['p1', '%50\\%\\_a\\\\b%']);
    });
    test('sin texto manda null (lista todo) y limita a 30 resultados', async () => {
        await repo.buscar('p1', '');
        assert.deepEqual(pool.llamadas[0].params, ['p1', null]);
        await repo.buscar('p1');
        assert.deepEqual(pool.llamadas[1].params, ['p1', null]);
        assert.match(pool.llamadas[0].sql, /LIMIT 30/);
    });
    test('devuelve las filas y traduce el error de BD', async () => {
        pool.responder(/FROM chats c/, { rows: [{ id: 'g1' }] });
        assert.deepEqual(await repo.buscar('p1', 'x'), [{ id: 'g1' }]);
        pool.responder(/FROM chats c/, errorBD());
        await assert.rejects(() => repo.buscar('p1', 'x'), { message: MSG });
    });
});

describe('GrupoRepository.crear', () => {
    const chatCreado = () => pool.responder(/INSERT INTO chats/, { rows: [{ id: 'g1' }] });

    test('grupo público sin miembros: BEGIN, chat, admin, COMMIT; devuelve el id', async () => {
        chatCreado();
        assert.equal(await repo.crear('p1', 'Nom', 'Desc'), 'g1');
        assert.deepEqual(verbos(), ['BEGIN', 'INSERT', 'INSERT', 'COMMIT']);
        assert.deepEqual(pool.llamadas[1].params, ['Nom', 'Desc', 'p1', false, null]);
        assert.deepEqual(pool.llamadas[2].params, ['g1', 'p1']);
        assert.match(pool.llamadas[2].sql, /'admin'/);
        assert.equal(liberados, 1);
    });
    test('grupo privado (con código) marca es_privado=true', async () => {
        chatCreado();
        await repo.crear('p1', 'Nom', 'Desc', [], 'ABC123');
        assert.deepEqual(pool.llamadas[1].params, ['Nom', 'Desc', 'p1', true, 'ABC123']);
    });
    test('con miembros hace un INSERT extra con unnest y la lista como parámetro', async () => {
        chatCreado();
        await repo.crear('p1', 'Nom', 'Desc', ['p2', 'p3']);
        assert.deepEqual(verbos(), ['BEGIN', 'INSERT', 'INSERT', 'INSERT', 'COMMIT']);
        assert.match(pool.llamadas[3].sql, /unnest\(\$2::uuid\[\]\)/);
        assert.match(pool.llamadas[3].sql, /'miembro'/);
        assert.deepEqual(pool.llamadas[3].params, ['g1', ['p2', 'p3']]);
    });
    test('nombre repetido (23505 de otro índice): ROLLBACK y null', async () => {
        pool.responder(/INSERT INTO chats/, errorBD('23505', { constraint: 'chats_nombre_unico' }));
        assert.equal(await repo.crear('p1', 'Nom', 'D'), null);
        assert.equal(verbos().at(-1), 'ROLLBACK');
        assert.equal(liberados, 1);
    });
    test('código repetido (23505 en chats_codigo_unico): devuelve CODIGO_REPETIDO', async () => {
        pool.responder(/INSERT INTO chats/, errorBD('23505', { constraint: 'chats_codigo_unico' }));
        assert.equal(await repo.crear('p1', 'Nom', 'D', [], 'X'), CODIGO_REPETIDO);
        assert.equal(CODIGO_REPETIDO, 'codigo-repetido');
    });
    test('otro error: ROLLBACK, libera y lanza el error traducido', async () => {
        chatCreado();
        pool.responder(/INSERT INTO chat_participantes/, errorBD());
        await assert.rejects(() => repo.crear('p1', 'N', 'D'), { message: MSG });
        assert.equal(verbos().at(-1), 'ROLLBACK');
        assert.ok(!verbos().includes('COMMIT'));
        assert.equal(liberados, 1);
    });
});

describe('GrupoRepository.obtenerPorId', () => {
    test('devuelve la fila con ($1 grupo, $2 perfil)', async () => {
        const f = { id: 'g1', unido: true };
        pool.responder(/c\.es_grupo = true/, { rows: [f] });
        assert.deepEqual(await repo.obtenerPorId('g1', 'p1'), f);
        assert.deepEqual(pool.llamadas[0].params, ['g1', 'p1']);
    });
    test('null si no existe o no es grupo', async () => {
        assert.equal(await repo.obtenerPorId('g1', 'p1'), null);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/FROM chats c/, errorBD());
        await assert.rejects(() => repo.obtenerPorId('g1', 'p1'), { message: MSG });
    });
});

describe('GrupoRepository.obtenerIdPorCodigo', () => {
    test('devuelve el id del grupo privado con $1 = código', async () => {
        pool.responder(/WHERE codigo = \$1/, { rows: [{ id: 'g1' }] });
        assert.equal(await repo.obtenerIdPorCodigo('ABC'), 'g1');
        assert.deepEqual(pool.llamadas[0].params, ['ABC']);
        assert.match(pool.llamadas[0].sql, /es_privado = true/);
    });
    test('null si ningún grupo tiene ese código', async () => {
        assert.equal(await repo.obtenerIdPorCodigo('zzz'), null);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/FROM chats/, errorBD());
        await assert.rejects(() => repo.obtenerIdPorCodigo('x'), { message: MSG });
    });
});

describe('GrupoRepository.listarMiembros', () => {
    test('devuelve las filas, solo perfiles activos, con $1 = grupo', async () => {
        const rows = [{ id: 'p1', nombre: 'A', username: 'a', rol: 'admin' }];
        pool.responder(/FROM chat_participantes cp/, { rows });
        assert.deepEqual(await repo.listarMiembros('g1'), rows);
        assert.deepEqual(pool.llamadas[0].params, ['g1']);
        assert.match(pool.llamadas[0].sql, /p\.activo = true/);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/chat_participantes/, errorBD());
        await assert.rejects(() => repo.listarMiembros('g1'), { message: MSG });
    });
});

describe('GrupoRepository.agregarMiembro / quitarMiembro', () => {
    test('agregar es idempotente (ON CONFLICT DO NOTHING) con ($1, $2)', async () => {
        assert.equal(await repo.agregarMiembro('g1', 'p1'), undefined);
        assert.match(pool.llamadas[0].sql, /ON CONFLICT \(chat_id, perfil_id\) DO NOTHING/);
        assert.deepEqual(pool.llamadas[0].params, ['g1', 'p1']);
    });
    test('quitar borra con ($1 grupo, $2 perfil)', async () => {
        assert.equal(await repo.quitarMiembro('g1', 'p1'), undefined);
        assert.match(pool.llamadas[0].sql, /DELETE FROM chat_participantes/);
        assert.deepEqual(pool.llamadas[0].params, ['g1', 'p1']);
    });
    test('ambos traducen el error de BD', async () => {
        pool.responder(/chat_participantes/, errorBD());
        await assert.rejects(() => repo.agregarMiembro('g1', 'p1'), { message: MSG });
        await assert.rejects(() => repo.quitarMiembro('g1', 'p1'), { message: MSG });
    });
});

describe('GrupoRepository.existeMensaje', () => {
    test('filtra por mensaje y por chat: params (mensajeId, grupoId)', async () => {
        pool.responder(/FROM mensajes WHERE id = \$1 AND chat_id = \$2/, { rows: [{ '?column?': 1 }] });
        assert.equal(await repo.existeMensaje('g1', 'm1'), true);
        assert.deepEqual(pool.llamadas[0].params, ['m1', 'g1']);
    });
    test('false si no existe', async () => {
        assert.equal(await repo.existeMensaje('g1', 'm1'), false);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/FROM mensajes/, errorBD());
        await assert.rejects(() => repo.existeMensaje('g1', 'm1'), { message: MSG });
    });
});

describe('GrupoRepository mensajes', () => {
    test('listarMensajesRecientes usa ($1 grupo, $2 límite, $3 cursor) y orden descendente', async () => {
        const rows = [{ id: 'm2' }, { id: 'm1' }];
        pool.responder(/FROM mensajes m/, { rows });
        assert.deepEqual(await repo.listarMensajesRecientes('g1', 20, 'm5'), rows);
        assert.deepEqual(pool.llamadas[0].params, ['g1', 20, 'm5']);
        assert.match(pool.llamadas[0].sql, /ORDER BY m\.created_at DESC, m\.id DESC/);
    });
    test('listarMensajesRecientes sin cursor manda null', async () => {
        await repo.listarMensajesRecientes('g1', 20);
        assert.deepEqual(pool.llamadas[0].params, ['g1', 20, null]);
    });
    test('listarMensajesPosteriores usa ($1, $2, $3) y orden ascendente', async () => {
        pool.responder(/FROM mensajes m/, { rows: [{ id: 'm6' }] });
        assert.deepEqual(await repo.listarMensajesPosteriores('g1', 10, 'm5'), [{ id: 'm6' }]);
        assert.deepEqual(pool.llamadas[0].params, ['g1', 10, 'm5']);
        assert.match(pool.llamadas[0].sql, /ORDER BY m\.created_at ASC, m\.id ASC/);
    });
    test('crearMensaje inserta (grupo, remitente, contenido) y devuelve la fila creada', async () => {
        const f = { id: 'm1', tipo: 'texto', contenido: 'hola', created_at: 'x', remitente_id: 'p1' };
        pool.responder(/INSERT INTO mensajes/, { rows: [f] });
        assert.deepEqual(await repo.crearMensaje('g1', 'p1', 'hola'), f);
        assert.deepEqual(pool.llamadas[0].params, ['g1', 'p1', 'hola']);
        assert.doesNotMatch(pool.llamadas[0].sql, /hola/);
    });
    test('los tres traducen el error de BD', async () => {
        pool.responder(/mensajes/, errorBD());
        await assert.rejects(() => repo.listarMensajesRecientes('g', 1), { message: MSG });
        await assert.rejects(() => repo.listarMensajesPosteriores('g', 1, 'm'), { message: MSG });
        await assert.rejects(() => repo.crearMensaje('g', 'p', 'c'), { message: MSG });
    });
});
