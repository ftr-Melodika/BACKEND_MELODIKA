import { test } from 'node:test';
import assert from 'node:assert/strict';
import validadores from '../src/helpers/validadores.js';

test('mensajeErrorPassword: devuelve el primer requisito que falta, en orden', () => {
    assert.equal(validadores.mensajeErrorPassword('Ab!'), 'La contraseña debe tener al menos 6 caracteres.');
    assert.equal(validadores.mensajeErrorPassword('abcdef!'), 'La contraseña debe incluir al menos una letra mayúscula.');
    assert.equal(validadores.mensajeErrorPassword('Abcdef1'), 'La contraseña debe incluir al menos un caracter especial ');
    assert.equal(validadores.mensajeErrorPassword('Abcde!'), null);
});

test('esEmailValido', () => {
    assert.ok(validadores.esEmailValido('ana@correo.com'));
    assert.ok(!validadores.esEmailValido('ana@correo'));
    assert.ok(!validadores.esEmailValido('sin-arroba.com'));
});

test('esNombreValido: mínimo 3 letras, sin números ni símbolos', () => {
    assert.ok(validadores.esNombreValido('María José'));
    assert.ok(!validadores.esNombreValido('Al'));
    assert.ok(!validadores.esNombreValido('Ana3'));
});

test('esTelefonoValido: 10 a 15 números, + opcional', () => {
    assert.ok(validadores.esTelefonoValido('1122334455'));
    assert.ok(validadores.esTelefonoValido('+5491122334455'));
    assert.ok(!validadores.esTelefonoValido('12345'));
    assert.ok(!validadores.esTelefonoValido('11-2233-4455'));
});

test('esUsernameValido, esPaisValido, esFechaValida, esGeneroValido', () => {
    assert.ok(validadores.esUsernameValido('ana_99'));
    assert.ok(!validadores.esUsernameValido('a b'));
    assert.ok(!validadores.esUsernameValido('ab'));
    assert.ok(validadores.esPaisValido('Argentina'));
    assert.ok(!validadores.esPaisValido('A'));
    assert.ok(validadores.esFechaValida('2000-01-31'));
    assert.ok(!validadores.esFechaValida('31/01/2000'));
    assert.ok(validadores.esGeneroValido('No binario'));
    assert.ok(!validadores.esGeneroValido('otro'));
});

test('esIdValido: solo UUID', () => {
    assert.ok(validadores.esIdValido('439d91de-87a2-4ef8-9eba-f8135d63f554'));
    assert.ok(!validadores.esIdValido('123'));
});

test('obtenerCodigoDb lee el código del error o de su causa', () => {
    assert.equal(validadores.obtenerCodigoDb({ code: '23505' }), '23505');
    assert.equal(validadores.obtenerCodigoDb({ cause: { code: 'ECONNREFUSED' } }), 'ECONNREFUSED');
});
