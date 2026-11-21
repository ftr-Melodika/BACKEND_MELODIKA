import { test } from 'node:test';
import assert from 'node:assert/strict';
import validarRefreshToken from '../../../src/middlewares/validadores/validarDatosRefresh.js';
import { validarOmitida } from '../../../src/middlewares/validadores/validarDatosCurso.js';

function ejecutar(middleware, req) {
    let resultado = 'next';
    const res = { status: (codigo) => ({ json: (cuerpo) => { resultado = { codigo, ...cuerpo }; } }) };
    middleware(req, res, () => {});
    return resultado;
}

test('refresh: texto no vacío pasa', () => {
    assert.equal(ejecutar(validarRefreshToken, { body: { refreshToken: 'abc' } }), 'next');
});

test('refresh: falta, vacío, solo espacios o no es texto -> 400', () => {
    for (const body of [undefined, null, {}, { refreshToken: '' }, { refreshToken: '   ' }, { refreshToken: 123 }, { refreshToken: ['a'] }]) {
        assert.deepEqual(ejecutar(validarRefreshToken, { body }), { codigo: 400, success: false, message: 'refreshToken requerido' });
    }
});

test('curso/omitida: sin body, sin campo, true o false pasan', () => {
    for (const body of [undefined, {}, { omitida: true }, { omitida: false }, { otra: 1 }]) {
        assert.equal(ejecutar(validarOmitida, { body }), 'next');
    }
});

test('curso/omitida: valores que no son booleanos -> 400', () => {
    for (const omitida of ['true', 1, 0, null, {}, []]) {
        assert.deepEqual(ejecutar(validarOmitida, { body: { omitida } }),
            { codigo: 400, success: false, message: 'El campo omitida debe ser true o false.' });
    }
});
