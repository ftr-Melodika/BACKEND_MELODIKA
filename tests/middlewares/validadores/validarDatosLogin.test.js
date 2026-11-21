import { test } from 'node:test';
import assert from 'node:assert/strict';
import validarLogin from '../../../src/middlewares/validadores/validarDatosLogin.js';

function ejecutar(body) {
    let resultado = 'next';
    const res = { status: (codigo) => ({ json: (cuerpo) => { resultado = { codigo, ...cuerpo }; } }) };
    validarLogin({ body }, res, () => {});
    return resultado;
}

test('login: email y contraseña presentes pasan', () => {
    assert.equal(ejecutar({ email: 'a@b.com', password: 'x' }), 'next');
});

test('login: sin email, email vacío o solo espacios -> 400 "Email mal ingresado"', () => {
    for (const email of [undefined, null, '', '   ']) {
        const r = ejecutar({ email, password: 'x' });
        assert.deepEqual(r, { codigo: 400, success: false, message: 'Email mal ingresado' });
    }
});

test('login: sin contraseña, vacía o solo espacios -> 400 "Contraseña mal ingresada"', () => {
    for (const password of [undefined, null, '', '  ']) {
        const r = ejecutar({ email: 'a@b.com', password });
        assert.deepEqual(r, { codigo: 400, success: false, message: 'Contraseña mal ingresada' });
    }
});

test('login: si faltan ambos, se informa primero el email', () => {
    assert.equal(ejecutar({}).message, 'Email mal ingresado');
});

test('login: no valida el formato del email (solo que no esté vacío)', () => {
    assert.equal(ejecutar({ email: 'no-es-email', password: 'x' }), 'next');
});

test('login: email o contraseña que no son texto (número) lanza TypeError en vez de responder 400', () => {
    assert.throws(() => ejecutar({ email: 123, password: 'x' }), TypeError);
    assert.throws(() => ejecutar({ email: 'a@b.com', password: 123 }), TypeError);
});

test('login: body undefined lanza TypeError (Express lo convierte en 500)', () => {
    assert.throws(() => ejecutar(undefined), TypeError);
});
