import { test } from 'node:test';
import assert from 'node:assert/strict';
import validarRegistro from '../src/middlewares/validadores/validarDatosRegistro.js';
import validarCambioPassword from '../src/middlewares/validadores/validarCambioPassword.js';

// Ejecuta un middleware con una respuesta falsa y dice si respondió con error o siguió
function ejecutar(middleware, body) {
    let resultado = 'next';
    const res = { status: (codigo) => ({ json: (cuerpo) => { resultado = { codigo, ...cuerpo }; } }) };
    middleware({ body }, res, () => {});
    return resultado;
}

const registroOk = { email: 'ana@correo.com', password: 'Abcde!', nombre: 'Ana', apellido: 'Pérez', telefono: '1122334455' };

test('registro: datos válidos pasan', () => {
    assert.equal(ejecutar(validarRegistro, registroOk), 'next');
});

test('registro: falta un campo -> 400', () => {
    const r = ejecutar(validarRegistro, { ...registroOk, telefono: undefined });
    assert.equal(r.codigo, 400);
    assert.equal(r.success, false);
    assert.equal(r.message, 'Todos los campos son obligatorios.');
});

test('registro: contraseña débil -> 400 con el mensaje del requisito', () => {
    assert.equal(ejecutar(validarRegistro, { ...registroOk, password: 'abcdef!' }).message,
        'La contraseña debe incluir al menos una letra mayúscula.');
});

test('registro: email inválido -> 400', () => {
    assert.equal(ejecutar(validarRegistro, { ...registroOk, email: 'x' }).message, 'El formato del email no es válido.');
});

test('cambio de contraseña: válido pasa', () => {
    assert.equal(ejecutar(validarCambioPassword, { passwordActual: 'Vieja1!', passwordNueva: 'Nueva1!' }), 'next');
});

test('cambio de contraseña: faltan datos, body vacío o tipos incorrectos -> 400', () => {
    const esperado = 'Tenés que enviar la contraseña actual y la nueva.';
    assert.equal(ejecutar(validarCambioPassword, {}).message, esperado);
    assert.equal(ejecutar(validarCambioPassword, undefined).message, esperado);
    assert.equal(ejecutar(validarCambioPassword, { passwordActual: 1, passwordNueva: 2 }).message, esperado);
    assert.equal(ejecutar(validarCambioPassword, { passwordActual: 'a', passwordNueva: '  ' }).message, esperado);
});

test('cambio de contraseña: la nueva debe cumplir las reglas y ser distinta', () => {
    assert.equal(ejecutar(validarCambioPassword, { passwordActual: 'Vieja1!', passwordNueva: 'nueva' }).codigo, 400);
    assert.equal(ejecutar(validarCambioPassword, { passwordActual: 'Igual1!', passwordNueva: 'Igual1!' }).message,
        'La contraseña nueva debe ser distinta de la actual.');
});
