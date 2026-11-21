import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

console.error = () => {};
const { instalarPoolFalso } = await import('../_ayudas/poolFalso.js');
const pool = instalarPoolFalso();

const { default: CuentaRepository } = await import('../../src/repositories/cuentaRepository.js');
const { default: Cuenta } = await import('../../src/entities/Cuenta.js');
const { MENSAJES_ERROR_DB } = await import('../../src/helpers/manejoErrores/mensajesErrorDB.js');

const repo = new CuentaRepository();
const errorBD = (code = '08006') => Object.assign(new Error('boom'), { code });

beforeEach(() => pool.reiniciar());

describe('CuentaRepository.encontrarPorAuthId', () => {
    test('mapea la fila a la entidad Cuenta y consulta con $1', async () => {
        pool.responder(/FROM cuentas/, { rows: [{
            id: 'c1', auth_id: 'u1', nombre: 'Ana', apellido: 'P', telefono: '123', plan_premium: true, rol: 'admin',
        }] });
        const r = await repo.encontrarPorAuthId('u1');
        assert.ok(r instanceof Cuenta);
        assert.deepEqual({ ...r }, {
            id: 'c1', authId: 'u1', nombre: 'Ana', apellido: 'P', telefono: '123', planPremium: true, rol: 'admin',
        });
        assert.deepEqual(pool.llamadas[0].params, ['u1']);
        assert.match(pool.llamadas[0].sql, /WHERE auth_id = \$1/);
    });
    test('null si no hay cuenta', async () => {
        assert.equal(await repo.encontrarPorAuthId('u1'), null);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/FROM cuentas/, errorBD('XX'));
        await assert.rejects(() => repo.encontrarPorAuthId('u1'), e => {
            assert.equal(e.message, MENSAJES_ERROR_DB.BUSCAR_CUENTA_AUTH);
            assert.equal(e.code, 'XX');
            return true;
        });
    });
    test('un error con el texto "No hay usuarios asignados" se relanza tal cual', async () => {
        const original = new Error('No hay usuarios asignados');
        pool.responder(/FROM cuentas/, original);
        await assert.rejects(() => repo.encontrarPorAuthId('u1'), e => e === original);
    });
});

describe('CuentaRepository.eliminarPorAuthId', () => {
    test('borra de auth.users con $1 y no devuelve nada', async () => {
        assert.equal(await repo.eliminarPorAuthId('u1'), undefined);
        assert.match(pool.llamadas[0].sql, /DELETE FROM auth\.users WHERE id = \$1/);
        assert.deepEqual(pool.llamadas[0].params, ['u1']);
    });
    test('traduce el error de BD', async () => {
        pool.responder(/DELETE FROM auth\.users/, errorBD());
        await assert.rejects(() => repo.eliminarPorAuthId('u1'), { message: MENSAJES_ERROR_DB.ELIMINAR_CUENTA });
    });
});
