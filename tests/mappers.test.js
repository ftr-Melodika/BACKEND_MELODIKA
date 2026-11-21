import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapCursoError } from '../src/helpers/mapperErrores/cursoErrores.js';
import { mapCancionError } from '../src/helpers/mapperErrores/cancionErrores.js';
import { mapPerfilError } from '../src/helpers/mapperErrores/perfilErrores.js';
import { mapRankingError } from '../src/helpers/mapperErrores/rankingErrores.js';
import { mapLoginError, mapEliminarCuentaError, mapCambiarPasswordError } from '../src/helpers/mapperErrores/cuentaErrores.js';
import { traducirErrorDB } from '../src/helpers/mapperErrores/erroresComunes.js';

test('errores comunes de la base: conexión caída, ID inválido, sin código conocido', () => {
    assert.equal(traducirErrorDB({ code: 'ECONNREFUSED' }).codigoEstado, 503);
    assert.equal(traducirErrorDB({ cause: { code: 'ETIMEDOUT' } }).codigoEstado, 503);
    assert.equal(traducirErrorDB({ code: '22P02' }).codigoEstado, 400);
    assert.equal(traducirErrorDB({ code: '22P02' }, { mensajeIdInvalido: 'X' }).mensajeUsuario, 'X');
    assert.equal(traducirErrorDB({ code: '99999' }), null);
});

test('cursos: lección bloqueada, curso no encontrado y XP ya reclamado', () => {
    assert.deepEqual(mapCursoError(new Error('La lección todavía está bloqueada.')),
        { codigoEstado: 403, mensajeUsuario: 'Completá las lecciones anteriores antes de hacer esta.' });
    assert.equal(mapCursoError(new Error('Curso no encontrado.')).codigoEstado, 404);
    assert.equal(mapCursoError(new Error('Ya habías reclamado el XP de este ejercicio.')).codigoEstado, 400);
});

test('cursos: error desconocido sin status -> 500 con mensaje genérico (no expone el texto interno)', () => {
    const r = mapCursoError(new Error('algo interno raro'));
    assert.equal(r.codigoEstado, 500);
    assert.ok(!r.mensajeUsuario.includes('interno raro'));
});

test('canciones: no encontrada y error interno', () => {
    assert.equal(mapCancionError(Object.assign(new Error('Canción no encontrada.'), { status: 404 })).codigoEstado, 404);
    assert.equal(mapCancionError(new Error('boom')).codigoEstado, 500);
});

test('perfiles: acceso denegado y nombre de usuario repetido (23505)', () => {
    assert.equal(mapPerfilError(new Error('Acceso denegado al perfil')).codigoEstado, 403);
    assert.deepEqual(mapPerfilError({ code: '23505', message: 'x' }),
        { codigoEstado: 409, mensajeUsuario: 'El nombre de usuario ya está en uso.' });
});

test('ranking: reglas propias y pertenencia al grupo', () => {
    assert.equal(mapRankingError(new Error('El grupo ya tiene un ranking')).codigoEstado, 409);
    assert.equal(mapRankingError(new Error('No sos miembro de este grupo')).codigoEstado, 403);
    assert.equal(mapRankingError({ code: '23503', message: 'x' }).codigoEstado, 400);
});

test('login: credenciales incorrectas', () => {
    const r = mapLoginError(Object.assign(new Error('Invalid login credentials'), { status: 400 }));
    assert.equal(r.codigoEstado, 400);
    assert.equal(r.mensajeUsuario, 'El correo electrónico o la contraseña son incorrectos.');
});

test('eliminar cuenta y cambiar contraseña: faltante, incorrecta y sin contraseña (Google)', () => {
    assert.equal(mapEliminarCuentaError(new Error('Falta la contraseña para confirmar')).codigoEstado, 400);
    assert.equal(mapEliminarCuentaError(new Error('Contraseña incorrecta')).codigoEstado, 403);
    assert.equal(mapCambiarPasswordError(new Error('Contraseña incorrecta')).mensajeUsuario, 'La contraseña actual es incorrecta.');
    assert.equal(mapCambiarPasswordError(new Error('La cuenta no usa contraseña')).codigoEstado, 400);
    assert.equal(mapCambiarPasswordError(new Error('otra cosa')).codigoEstado, 500);
});
