import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    validarGrupoId, validarDatosCrearGrupo, validarBusquedaGrupos, validarConsultaMensajes,
    validarDatosMensajeGrupo, validarCodigoOpcional, validarCodigoObligatorio,
} from '../../../src/middlewares/validadores/validarDatosGrupo.js';

const U1 = '11111111-1111-4111-8111-111111111111';
const U2 = '22222222-2222-4222-8222-222222222222';
const U3 = '33333333-3333-4333-8333-333333333333';

// Devuelve { resultado: 'next' | {codigo, success, message}, req, res }
function ejecutar(middleware, req = {}) {
    const res = { locals: {} };
    let resultado = 'next';
    res.status = (codigo) => ({ json: (cuerpo) => { resultado = { codigo, ...cuerpo }; } });
    middleware(req, res, () => {});
    return { resultado, req, res };
}
const rechazo = (message) => ({ codigo: 400, success: false, message });

test('validarGrupoId: UUID pasa, otra cosa -> 400', () => {
    assert.equal(ejecutar(validarGrupoId, { params: { grupoId: U1 } }).resultado, 'next');
    assert.deepEqual(ejecutar(validarGrupoId, { params: { grupoId: 'x' } }).resultado, rechazo('El formato del ID del grupo no es válido.'));
    assert.deepEqual(ejecutar(validarGrupoId, { params: {} }).resultado, rechazo('El formato del ID del grupo no es válido.'));
});

test('crear grupo: normaliza nombre, descripción, miembros y esPrivado', () => {
    const { resultado, req } = ejecutar(validarDatosCrearGrupo, {
        params: { id: U1 }, body: { nombre: '  Rock  ', descripcion: '  desc  ', miembroIds: [U2.toUpperCase(), U3], esPrivado: true },
    });
    assert.equal(resultado, 'next');
    assert.deepEqual(req.body, { nombre: 'Rock', descripcion: 'desc', miembroIds: [U2, U3], esPrivado: true });
});

test('crear grupo: opcionales ausentes, null o vacíos', () => {
    let { req } = ejecutar(validarDatosCrearGrupo, { params: { id: U1 }, body: { nombre: 'Grupo' } });
    assert.deepEqual(req.body, { nombre: 'Grupo', descripcion: null, miembroIds: [], esPrivado: false });
    ({ req } = ejecutar(validarDatosCrearGrupo, { params: { id: U1 }, body: { nombre: 'Grupo', descripcion: '   ', miembroIds: null, esPrivado: null } }));
    assert.deepEqual(req.body, { nombre: 'Grupo', descripcion: null, miembroIds: [], esPrivado: false });
});

test('crear grupo: body ausente -> "nombre obligatorio"', () => {
    assert.deepEqual(ejecutar(validarDatosCrearGrupo, { params: { id: U1 } }).resultado, rechazo('El nombre del grupo es obligatorio.'));
});

test('crear grupo: nombre con NUL, número o fuera de 3-50 -> 400', () => {
    const ok = (nombre) => ejecutar(validarDatosCrearGrupo, { params: { id: U1 }, body: { nombre } }).resultado;
    assert.equal(ok('ab\u0000c').message, 'El nombre del grupo es obligatorio.');
    assert.equal(ok(5).message, 'El nombre del grupo es obligatorio.');
    assert.equal(ok(' ab ').message, 'El nombre del grupo debe tener entre 3 y 50 caracteres.');
    assert.equal(ok('x'.repeat(51)).message, 'El nombre del grupo debe tener entre 3 y 50 caracteres.');
    assert.equal(ok('x'.repeat(50)), 'next');
    assert.equal(ok('abc'), 'next');
});

test('crear grupo: descripción inválida o larga -> 400', () => {
    const ej = (descripcion) => ejecutar(validarDatosCrearGrupo, { params: { id: U1 }, body: { nombre: 'Grupo', descripcion } }).resultado;
    assert.equal(ej(5).message, 'La descripción no es válida.');
    assert.equal(ej('a\u0000').message, 'La descripción no es válida.');
    assert.equal(ej('x'.repeat(201)).message, 'La descripción puede tener hasta 200 caracteres.');
    assert.equal(ej('x'.repeat(200)), 'next');
});

test('crear grupo: esPrivado no booleano -> 400', () => {
    const r = ejecutar(validarDatosCrearGrupo, { params: { id: U1 }, body: { nombre: 'Grupo', esPrivado: 'true' } }).resultado;
    assert.equal(r.message, 'esPrivado debe ser verdadero o falso.');
});

test('crear grupo: reglas de miembroIds (tipo, máximo 49, UUID, repetidos, creador)', () => {
    const ej = (miembroIds) => ejecutar(validarDatosCrearGrupo, { params: { id: U1 }, body: { nombre: 'Grupo', miembroIds } }).resultado;
    assert.equal(ej('x').message, 'miembroIds debe ser una lista de IDs de perfil.');
    assert.equal(ej(Array(50).fill(U2)).message, 'Un grupo puede tener hasta 50 integrantes contándote a vos.');
    assert.equal(ej([U2, 5]).message, 'Alguno de los integrantes elegidos no tiene un ID válido.');
    assert.equal(ej([U2, U2.toUpperCase()]).message, 'Hay integrantes repetidos en la lista.');
    assert.equal(ej([U1]).message, 'No hace falta agregarte: ya sos parte del grupo como creador.');
    assert.equal(ej([U1.toUpperCase()]).message, 'No hace falta agregarte: ya sos parte del grupo como creador.');
    assert.equal(ej([]), 'next');
});

test('crear grupo: 49 invitados distintos es el máximo permitido', () => {
    const ids = Array.from({ length: 49 }, (_, i) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`);
    assert.equal(ejecutar(validarDatosCrearGrupo, { params: { id: U1 }, body: { nombre: 'Grupo', miembroIds: ids } }).resultado, 'next');
});

test('código opcional: ausente, null o vacío -> res.locals.codigo = null', () => {
    for (const body of [undefined, {}, { codigo: null }, { codigo: '' }]) {
        const { resultado, res } = ejecutar(validarCodigoOpcional, { body });
        assert.equal(resultado, 'next');
        assert.equal(res.locals.codigo, null);
    }
});

test('código opcional: válido se guarda; mal formado -> 400', () => {
    let { res, resultado } = ejecutar(validarCodigoOpcional, { body: { codigo: 'AbC12345' } });
    assert.equal(resultado, 'next');
    assert.equal(res.locals.codigo, 'AbC12345');
    for (const codigo of ['abc', 'AbC1234!', 'AbC123456', 12345678]) {
        ({ resultado } = ejecutar(validarCodigoOpcional, { body: { codigo } }));
        assert.deepEqual(resultado, rechazo('El código tiene 8 letras o números, sin espacios.'));
    }
});

test('código obligatorio: ausente o vacío -> 400; válido se guarda', () => {
    for (const body of [undefined, {}, { codigo: '' }, { codigo: null }]) {
        assert.equal(ejecutar(validarCodigoObligatorio, { body }).resultado.codigo, 400);
    }
    const { res, resultado } = ejecutar(validarCodigoObligatorio, { body: { codigo: 'Zz9Zz9Zz' } });
    assert.equal(resultado, 'next');
    assert.equal(res.locals.codigo, 'Zz9Zz9Zz');
});

test('búsqueda: recorta el texto; sin q -> cadena vacía', () => {
    assert.equal(ejecutar(validarBusquedaGrupos, { query: { q: '  rock ' } }).res.locals.textoBusqueda, 'rock');
    assert.equal(ejecutar(validarBusquedaGrupos, { query: {} }).res.locals.textoBusqueda, '');
});

test('búsqueda: q largo, con NUL o repetido (array) -> 400', () => {
    for (const q of ['a'.repeat(101), 'a\u0000', ['a', 'b']]) {
        assert.deepEqual(ejecutar(validarBusquedaGrupos, { query: { q } }).resultado, rechazo('El texto de búsqueda no es válido.'));
    }
    assert.equal(ejecutar(validarBusquedaGrupos, { query: { q: 'a'.repeat(100) } }).resultado, 'next');
});

test('mensajes (consulta): valores por defecto', () => {
    const { res, resultado } = ejecutar(validarConsultaMensajes, { query: {} });
    assert.equal(resultado, 'next');
    assert.deepEqual(res.locals.paginacion, { limite: 50, despues: null, antes: null });
});

test('mensajes (consulta): limit con tope 100 y cursores', () => {
    let { res } = ejecutar(validarConsultaMensajes, { query: { limit: '20', despues: U2 } });
    assert.deepEqual(res.locals.paginacion, { limite: 20, despues: U2, antes: null });
    ({ res } = ejecutar(validarConsultaMensajes, { query: { limit: '9999', antes: U3 } }));
    assert.deepEqual(res.locals.paginacion, { limite: 100, despues: null, antes: U3 });
});

test('mensajes (consulta): limit inválido, ambos cursores o cursor inválido -> 400', () => {
    for (const limit of ['0', '-1', '1.5', 'abc', '', '01', ['1', '2']]) {
        assert.equal(ejecutar(validarConsultaMensajes, { query: { limit } }).resultado.message, 'El límite debe ser un número mayor a cero.', String(limit));
    }
    assert.equal(ejecutar(validarConsultaMensajes, { query: { despues: U2, antes: U3 } }).resultado.message, "No se puede usar 'despues' y 'antes' a la vez.");
    assert.equal(ejecutar(validarConsultaMensajes, { query: { antes: 'x' } }).resultado.message, 'El formato del ID del mensaje no es válido.');
});

test('mensaje de grupo: se recorta y reemplaza el body por { contenido }', () => {
    const { resultado, req } = ejecutar(validarDatosMensajeGrupo, { body: { contenido: '  hola  ', otro: 1 } });
    assert.equal(resultado, 'next');
    assert.deepEqual(req.body, { contenido: 'hola' });
});

test('mensaje de grupo: inválido -> 400 con el mensaje que corresponde', () => {
    const ej = (body) => ejecutar(validarDatosMensajeGrupo, { body }).resultado.message;
    assert.equal(ej(undefined), 'El mensaje no es válido.');
    assert.equal(ej({ contenido: 5 }), 'El mensaje no es válido.');
    assert.equal(ej({ contenido: 'a\u0000' }), 'El mensaje no es válido.');
    assert.equal(ej({ contenido: '   ' }), 'El mensaje debe tener entre 1 y 1000 caracteres.');
    assert.equal(ej({ contenido: 'x'.repeat(1001) }), 'El mensaje debe tener entre 1 y 1000 caracteres.');
    assert.equal(ejecutar(validarDatosMensajeGrupo, { body: { contenido: 'x'.repeat(1000) } }).resultado, 'next');
});
