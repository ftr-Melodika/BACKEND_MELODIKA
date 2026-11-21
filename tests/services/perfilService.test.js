import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Repositorios y mail falsos: ninguno toca la base ni la red.
const perfiles = {};
const cuentas = {};
const mail = { enviados: [] };
const reset = () => {
    Object.assign(perfiles, {
        obtenerPorId: async () => null,
        obtenerPorCuentaId: async () => [],
        crearPerfil: async (cuentaId, datos) => ({ id: 1, cuentaId, ...datos }),
        eliminarPerfil: async () => true,
        actualizarPerfil: async (id, cuentaId, datos) => ({ id, ...datos }),
        actualizarRachaDiaria: async () => null,
        reiniciarRachasVencidas: async () => {},
    });
    Object.assign(cuentas, { encontrarPorAuthId: async () => null });
    mail.enviados = [];
};
reset();

class PerfilRepositoryFalso {
    obtenerPorId(...a) { return perfiles.obtenerPorId(...a); }
    obtenerPorCuentaId(...a) { return perfiles.obtenerPorCuentaId(...a); }
    crearPerfil(...a) { return perfiles.crearPerfil(...a); }
    eliminarPerfil(...a) { return perfiles.eliminarPerfil(...a); }
    actualizarPerfil(...a) { return perfiles.actualizarPerfil(...a); }
    actualizarRachaDiaria(...a) { return perfiles.actualizarRachaDiaria(...a); }
    reiniciarRachasVencidas(...a) { return perfiles.reiniciarRachasVencidas(...a); }
}
class CuentaRepositoryFalso {
    encontrarPorAuthId(...a) { return cuentas.encontrarPorAuthId(...a); }
}
const url = (p) => new URL(p, import.meta.url).href;
mock.module(url('../../src/repositories/PerfilesRepository.js'), {
    defaultExport: PerfilRepositoryFalso,
    namedExports: { DIAS_MAXIMOS_SIN_PRACTICAR: 1 },
});
mock.module(url('../../src/repositories/cuentaRepository.js'), { defaultExport: CuentaRepositoryFalso });
mock.module(url('../../src/helpers/enviarMail.js'), {
    namedExports: { enviarMail: async (datos) => { mail.enviados.push(datos); } },
});

const servicio = (await import('../../src/services/perfilService.js')).default;

let contador = 0;
const nuevoAuthId = () => `auth-${++contador}`; // la caché de cuentas es del módulo: un authId distinto por prueba
const CUENTA = { id: 10 };
const conCuenta = (authId = nuevoAuthId()) => {
    cuentas.encontrarPorAuthId = async () => CUENTA;
    return authId;
};

beforeEach(() => {
    reset();
    mock.method(console, 'warn', () => {});
});

// ---------- validarAccesoPerfil ----------
test('validarAccesoPerfil devuelve cuenta y perfil cuando el perfil es del usuario', async () => {
    const authId = conCuenta();
    const perfil = { id: 5, cuentaId: 10, activo: true };
    perfiles.obtenerPorId = async () => perfil;
    const r = await servicio.validarAccesoPerfil(authId, 5);
    assert.deepEqual(r, { cuenta: CUENTA, perfilExistente: perfil });
});

test('validarAccesoPerfil falla con "Cuenta no encontrada" si no hay cuenta local', async () => {
    await assert.rejects(() => servicio.validarAccesoPerfil(nuevoAuthId(), 5), { message: 'Cuenta no encontrada' });
});

test('validarAccesoPerfil falla con "El perfil no existe"', async () => {
    const authId = conCuenta();
    await assert.rejects(() => servicio.validarAccesoPerfil(authId, 5), { message: 'El perfil no existe' });
});

test('validarAccesoPerfil niega el acceso a un perfil de otra cuenta', async () => {
    const authId = conCuenta();
    perfiles.obtenerPorId = async () => ({ id: 5, cuentaId: 99, activo: true });
    await assert.rejects(() => servicio.validarAccesoPerfil(authId, 5), { message: 'Acceso denegado al perfil' });
});

test('validarAccesoPerfil rechaza un perfil eliminado (activo === false)', async () => {
    const authId = conCuenta();
    perfiles.obtenerPorId = async () => ({ id: 5, cuentaId: 10, activo: false });
    await assert.rejects(() => servicio.validarAccesoPerfil(authId, 5), { message: 'El perfil se encuentra eliminado' });
});

test('validarAccesoPerfil acepta un perfil sin campo activo definido', async () => {
    const authId = conCuenta();
    perfiles.obtenerPorId = async () => ({ id: 5, cuentaId: 10 });
    const r = await servicio.validarAccesoPerfil(authId, 5);
    assert.equal(r.perfilExistente.id, 5);
});

// ---------- caché ----------
test('la cuenta encontrada se recuerda: la segunda vez no se consulta otra vez', async () => {
    let consultas = 0;
    cuentas.encontrarPorAuthId = async () => { consultas++; return CUENTA; };
    const authId = nuevoAuthId();
    await servicio._obtenerCuentaValidada(authId);
    await servicio._obtenerCuentaValidada(authId);
    assert.equal(consultas, 1);
});

test('una cuenta inexistente NO se recuerda: al aparecer después se encuentra', async () => {
    const authId = nuevoAuthId();
    await assert.rejects(() => servicio._obtenerCuentaValidada(authId), { message: 'Cuenta no encontrada' });
    cuentas.encontrarPorAuthId = async () => CUENTA;
    assert.deepEqual(await servicio._obtenerCuentaValidada(authId), CUENTA);
});

// ---------- obtenerPerfil / obtenerPerfiles ----------
test('obtenerPerfil devuelve el perfil validado', async () => {
    const authId = conCuenta();
    perfiles.obtenerPorId = async () => ({ id: 5, cuentaId: 10 });
    assert.deepEqual(await servicio.obtenerPerfil(authId, 5), { id: 5, cuentaId: 10 });
});

test('obtenerPerfiles devuelve la lista de la cuenta', async () => {
    const authId = conCuenta();
    let cuentaIdUsado;
    perfiles.obtenerPorCuentaId = async (id) => { cuentaIdUsado = id; return [{ id: 1 }]; };
    assert.deepEqual(await servicio.obtenerPerfiles(authId), [{ id: 1 }]);
    assert.equal(cuentaIdUsado, 10);
});

test('obtenerPerfiles devuelve null si la cuenta no tiene perfiles', async () => {
    const authId = conCuenta();
    assert.equal(await servicio.obtenerPerfiles(authId), null);
});

// ---------- crearPerfil ----------
test('crearPerfil crea el perfil con el id de la cuenta', async () => {
    const authId = conCuenta();
    perfiles.obtenerPorCuentaId = async () => [{ nombre: 'Ana' }];
    let args;
    perfiles.crearPerfil = async (...a) => { args = a; return { id: 2 }; };
    const datos = { nombre: 'Beto' };
    assert.deepEqual(await servicio.crearPerfil(authId, datos), { id: 2 });
    assert.deepEqual(args, [10, datos]);
});

test('crearPerfil rechaza al llegar al límite de 4 perfiles', async () => {
    const authId = conCuenta();
    perfiles.obtenerPorCuentaId = async () => [1, 2, 3, 4].map((n) => ({ nombre: `P${n}` }));
    let creado = false;
    perfiles.crearPerfil = async () => { creado = true; };
    await assert.rejects(() => servicio.crearPerfil(authId, { nombre: 'Nuevo' }), { message: 'Límite de perfiles alcanzado' });
    assert.equal(creado, false);
});

test('crearPerfil permite el cuarto perfil (3 existentes)', async () => {
    const authId = conCuenta();
    perfiles.obtenerPorCuentaId = async () => [1, 2, 3].map((n) => ({ nombre: `P${n}` }));
    const r = await servicio.crearPerfil(authId, { nombre: 'Nuevo' });
    assert.equal(r.nombre, 'Nuevo');
});

test('crearPerfil rechaza un nombre repetido sin importar mayúsculas', async () => {
    const authId = conCuenta();
    perfiles.obtenerPorCuentaId = async () => [{ nombre: 'Ana' }];
    await assert.rejects(() => servicio.crearPerfil(authId, { nombre: 'ANA' }), { message: 'Ya tienes un perfil con este nombre' });
});

// ---------- eliminar / actualizar ----------
test('eliminarPerfil devuelve exito y usa perfilId y cuentaId', async () => {
    const authId = conCuenta();
    perfiles.obtenerPorId = async () => ({ id: 5, cuentaId: 10 });
    let args;
    perfiles.eliminarPerfil = async (...a) => { args = a; return true; };
    assert.deepEqual(await servicio.eliminarPerfil(authId, 5), { exito: true });
    assert.deepEqual(args, [5, 10]);
});

test('eliminarPerfil falla si el repositorio no eliminó nada', async () => {
    const authId = conCuenta();
    perfiles.obtenerPorId = async () => ({ id: 5, cuentaId: 10 });
    perfiles.eliminarPerfil = async () => false;
    await assert.rejects(() => servicio.eliminarPerfil(authId, 5), { message: 'No se pudo completar la operación con los perfiles.' });
});

test('eliminarPerfil de un perfil ajeno es denegado y no elimina', async () => {
    const authId = conCuenta();
    perfiles.obtenerPorId = async () => ({ id: 5, cuentaId: 77 });
    let llamado = false;
    perfiles.eliminarPerfil = async () => { llamado = true; return true; };
    await assert.rejects(() => servicio.eliminarPerfil(authId, 5), { message: 'Acceso denegado al perfil' });
    assert.equal(llamado, false);
});

test('actualizarPerfil delega con perfilId, cuentaId y datos', async () => {
    const authId = conCuenta();
    perfiles.obtenerPorId = async () => ({ id: 5, cuentaId: 10 });
    let args;
    perfiles.actualizarPerfil = async (...a) => { args = a; return { ok: 1 }; };
    assert.deepEqual(await servicio.actualizarPerfil(authId, 5, { nombre: 'Z' }), { ok: 1 });
    assert.deepEqual(args, [5, 10, { nombre: 'Z' }]);
});

// ---------- chequearRacha ----------
const prepararRacha = (resultado) => {
    perfiles.obtenerPorId = async () => ({ id: 5, cuentaId: 10 });
    perfiles.actualizarRachaDiaria = async () => resultado;
    return conCuenta();
};

test('chequearRacha: ya sumada hoy (0 días) no anima', async () => {
    const authId = prepararRacha({ racha: 3, dias_pasados: 0 });
    const r = await servicio.chequearRacha(authId, 5);
    assert.equal(r.exito, true);
    assert.equal(r.mostrarAnimacion, false);
    assert.equal(r.rachaAnterior, 3);
    assert.equal(r.rachaActual, 3);
    assert.match(r.mensaje, /Ya habías sumado tu racha de hoy/);
});

test('chequearRacha: dentro del máximo de días sube la racha con animación', async () => {
    const authId = prepararRacha({ racha: 4, dias_pasados: 1 });
    const r = await servicio.chequearRacha(authId, 5);
    assert.equal(r.mostrarAnimacion, true);
    assert.equal(r.rachaAnterior, 3);
    assert.equal(r.rachaActual, 4);
    assert.match(r.mensaje, /Tu racha subió a 4/);
});

test('chequearRacha: pasado el máximo de días arranca una racha nueva', async () => {
    const authId = prepararRacha({ racha: 1, dias_pasados: 5 });
    const r = await servicio.chequearRacha(authId, 5);
    assert.equal(r.mostrarAnimacion, true);
    assert.equal(r.rachaAnterior, 0);
    assert.equal(r.rachaActual, 1);
    assert.match(r.mensaje, /Empezamos una nueva racha/);
});

test('chequearRacha falla si el repositorio no devuelve resultado', async () => {
    const authId = prepararRacha(null);
    await assert.rejects(() => servicio.chequearRacha(authId, 5), { message: 'Perfil no encontrado para racha' });
});

// ---------- registrarMensaje ----------
test('registrarMensaje arma y envía el mail completo', async () => {
    const authId = conCuenta();
    perfiles.obtenerPorId = async () => ({ id: 5, cuentaId: 10, nombre: 'Ana', username: 'ana_1' });
    const r = await servicio.registrarMensaje(authId, 5, 'feedback', {
        categoria: 'UI', mensaje: 'Hola', nombre: 'Anita', email: 'a@a.com',
    });
    assert.deepEqual(r, { enviado: true });
    assert.equal(mail.enviados.length, 1);
    const m = mail.enviados[0];
    assert.equal(m.asunto, '[Melodika] Feedback - UI');
    assert.equal(m.replyTo, 'a@a.com');
    assert.equal(m.texto, [
        'Tipo: Feedback', 'Categoría: UI', 'Nombre: Anita', 'Email: a@a.com', 'Perfil: ana_1 (id 5)', '', 'Hola',
    ].join('\n'));
});

test('registrarMensaje sin opcionales omite categoría y email, y usa el nombre del perfil', async () => {
    const authId = conCuenta();
    perfiles.obtenerPorId = async () => ({ id: 5, cuentaId: 10, nombre: 'Ana', username: 'ana_1' });
    await servicio.registrarMensaje(authId, 5, 'reporte_error', { mensaje: 'Falla' });
    const m = mail.enviados[0];
    assert.equal(m.asunto, '[Melodika] Reporte de error');
    assert.equal(m.texto, ['Tipo: Reporte de error', 'Nombre: Ana', 'Perfil: ana_1 (id 5)', '', 'Falla'].join('\n'));
    assert.equal(m.replyTo, undefined);
});

test('registrarMensaje no envía nada si el perfil no es del usuario', async () => {
    const authId = conCuenta();
    perfiles.obtenerPorId = async () => ({ id: 5, cuentaId: 77 });
    await assert.rejects(() => servicio.registrarMensaje(authId, 5, 'contacto', { mensaje: 'x' }), { message: 'Acceso denegado al perfil' });
    assert.equal(mail.enviados.length, 0);
});

// ---------- reiniciarRachasVencidas ----------
test('reiniciarRachasVencidas delega en el repositorio', async () => {
    let llamado = false;
    perfiles.reiniciarRachasVencidas = async () => { llamado = true; };
    await servicio.reiniciarRachasVencidas();
    assert.equal(llamado, true);
});
