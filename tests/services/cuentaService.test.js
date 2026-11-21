import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Supabase y repositorio falsos: nada sale a la red ni toca la base.
const auth = {};          // comportamiento del cliente de login/refresh (authClient)
const compartido = {};    // comportamiento del cliente compartido (supabase)
const repo = { eliminarPorAuthId: async () => {} };
const clientesCreados = [];

const resetAuth = () => {
    auth.signInWithPassword = async () => ({ data: { session: null, user: null }, error: null });
    auth.refreshSession = async () => ({ data: { session: null }, error: null });
    auth.updateUser = async () => ({ error: null });
    compartido.signUp = async () => ({ data: { user: null }, error: null });
    repo.eliminarPorAuthId = async () => {};
};
resetAuth();

const crearCliente = () => {
    const cliente = {
        auth: {
            signInWithPassword: (...a) => auth.signInWithPassword(...a),
            refreshSession: (...a) => auth.refreshSession(...a),
            updateUser: (...a) => auth.updateUser(...a),
        },
    };
    clientesCreados.push(cliente);
    return cliente;
};
const url = (p) => new URL(p, import.meta.url).href;
mock.module(url('../../src/database/supabase.js'), {
    namedExports: {
        supabase: { auth: { signUp: (...a) => compartido.signUp(...a) } },
        crearClienteAuth: crearCliente,
    },
});
class CuentaRepositoryFalso {
    eliminarPorAuthId(...a) { return repo.eliminarPorAuthId(...a); }
}
mock.module(url('../../src/repositories/cuentaRepository.js'), { defaultExport: CuentaRepositoryFalso });

const CuentaService = (await import('../../src/services/cuentaService.js')).default;
const servicio = new CuentaService();

const usuarioEmail = { id: 'u1', email: 'a@a.com', app_metadata: { providers: ['email'] } };
const usuarioGoogle = { id: 'u2', email: 'g@a.com', app_metadata: { provider: 'google', providers: ['google'] } };
const SESION = { access_token: 'AT', refresh_token: 'RT', expires_at: 123 };

beforeEach(() => {
    resetAuth();
    clientesCreados.length = 0;
});

// ---------- login ----------
test('login devuelve token, refreshToken, expiresAt y usuario, y manda email y password', async () => {
    let args;
    auth.signInWithPassword = async (a) => { args = a; return { data: { session: SESION, user: { id: 'u1' } }, error: null }; };
    const r = await servicio.login('a@a.com', 'clave');
    assert.deepEqual(args, { email: 'a@a.com', password: 'clave' });
    assert.deepEqual(r, { token: 'AT', refreshToken: 'RT', expiresAt: 123, user: { id: 'u1' } });
});

test('login con credenciales malas lanza el mensaje y el status de Supabase', async () => {
    auth.signInWithPassword = async () => ({ data: {}, error: { message: 'Invalid login credentials', status: 400 } });
    await assert.rejects(() => servicio.login('a@a.com', 'x'), (e) => {
        assert.equal(e.message, 'Invalid login credentials');
        assert.equal(e.status, 400);
        return true;
    });
});

// ---------- refrescarSesion ----------
test('refrescarSesion devuelve la sesión nueva', async () => {
    let args;
    auth.refreshSession = async (a) => { args = a; return { data: { session: SESION }, error: null }; };
    const r = await servicio.refrescarSesion('viejo');
    assert.deepEqual(args, { refresh_token: 'viejo' });
    assert.deepEqual(r, { token: 'AT', refreshToken: 'RT', expiresAt: 123 });
});

test('refrescarSesion con error lanza 401 con mensaje genérico', async () => {
    auth.refreshSession = async () => ({ data: {}, error: { message: 'detalle interno' } });
    await assert.rejects(() => servicio.refrescarSesion('x'), (e) => {
        assert.equal(e.message, 'Sesión inválida, iniciá sesión de nuevo');
        assert.equal(e.status, 401);
        return true;
    });
});

test('refrescarSesion sin sesión en la respuesta lanza 401', async () => {
    auth.refreshSession = async () => ({ data: { session: null }, error: null });
    await assert.rejects(() => servicio.refrescarSesion('x'), { status: 401 });
});

test('refrescarSesion con data indefinida lanza 401 (no revienta)', async () => {
    auth.refreshSession = async () => ({ data: undefined, error: null });
    await assert.rejects(() => servicio.refrescarSesion('x'), { status: 401 });
});

// ---------- registrar ----------
test('registrar envía email, password y metadatos y devuelve el usuario', async () => {
    let args;
    compartido.signUp = async (a) => { args = a; return { data: { user: { id: 'n1' } }, error: null }; };
    const r = await servicio.registrar({ email: 'n@n.com', password: 'p', nombre: 'N', apellido: 'A', telefono: '11' });
    assert.deepEqual(args, {
        email: 'n@n.com', password: 'p',
        options: { data: { nombre: 'N', apellido: 'A', telefono: '11' } },
    });
    assert.deepEqual(r, { user: { id: 'n1' } });
});

test('registrar con error de Supabase lanza mensaje y status', async () => {
    compartido.signUp = async () => ({ data: {}, error: { message: 'User already registered', status: 422 } });
    await assert.rejects(() => servicio.registrar({ email: 'n@n.com', password: 'p' }), (e) => {
        assert.equal(e.message, 'User already registered');
        assert.equal(e.status, 422);
        return true;
    });
});

// ---------- tieneContraseña ----------
test('tieneContraseña es true si entre los proveedores está email', () => {
    assert.equal(servicio.tieneContraseña(usuarioEmail), true);
    assert.equal(servicio.tieneContraseña({ app_metadata: { providers: ['google', 'email'] } }), true);
});

test('tieneContraseña es false para cuentas solo de Google', () => {
    assert.equal(servicio.tieneContraseña(usuarioGoogle), false);
});

test('tieneContraseña usa "provider" si no hay lista "providers"', () => {
    assert.equal(servicio.tieneContraseña({ app_metadata: { provider: 'email' } }), true);
    assert.equal(servicio.tieneContraseña({ app_metadata: { provider: 'google' } }), false);
});

// ---------- confirmarPassword ----------
test('confirmarPassword rechaza una contraseña vacía, en blanco o no string con 400', async () => {
    for (const mala of ['', '   ', undefined, null, 123]) {
        await assert.rejects(() => servicio.confirmarPassword(usuarioEmail, mala), (e) => {
            assert.equal(e.message, 'Falta la contraseña para confirmar');
            assert.equal(e.status, 400);
            return true;
        });
    }
});

test('confirmarPassword con contraseña incorrecta lanza 403 sin exponer el detalle', async () => {
    auth.signInWithPassword = async () => ({ data: {}, error: { message: 'detalle', status: 400 } });
    await assert.rejects(() => servicio.confirmarPassword(usuarioEmail, 'mala'), (e) => {
        assert.equal(e.message, 'Contraseña incorrecta');
        assert.equal(e.status, 403);
        return true;
    });
});

test('confirmarPassword correcta devuelve la sesión y usa el email del usuario', async () => {
    let args;
    auth.signInWithPassword = async (a) => { args = a; return { data: { session: SESION }, error: null }; };
    assert.deepEqual(await servicio.confirmarPassword(usuarioEmail, 'ok'), SESION);
    assert.deepEqual(args, { email: 'a@a.com', password: 'ok' });
});

test('confirmarPassword usa el cliente que se le pase', async () => {
    let usado = false;
    const cliente = { auth: { signInWithPassword: async () => { usado = true; return { data: { session: SESION }, error: null }; } } };
    await servicio.confirmarPassword(usuarioEmail, 'ok', cliente);
    assert.equal(usado, true);
});

// ---------- eliminarCuenta ----------
test('eliminarCuenta de cuenta con contraseña la confirma y luego elimina por authId', async () => {
    const orden = [];
    auth.signInWithPassword = async () => { orden.push('confirmar'); return { data: { session: SESION }, error: null }; };
    repo.eliminarPorAuthId = async (id) => { orden.push(`eliminar:${id}`); };
    await servicio.eliminarCuenta(usuarioEmail, 'ok');
    assert.deepEqual(orden, ['confirmar', 'eliminar:u1']);
});

test('eliminarCuenta con contraseña incorrecta no elimina nada', async () => {
    auth.signInWithPassword = async () => ({ data: {}, error: { message: 'x' } });
    let eliminado = false;
    repo.eliminarPorAuthId = async () => { eliminado = true; };
    await assert.rejects(() => servicio.eliminarCuenta(usuarioEmail, 'mala'), { status: 403 });
    assert.equal(eliminado, false);
});

test('eliminarCuenta sin contraseña falla con 400 y no elimina', async () => {
    let eliminado = false;
    repo.eliminarPorAuthId = async () => { eliminado = true; };
    await assert.rejects(() => servicio.eliminarCuenta(usuarioEmail, undefined), { status: 400 });
    assert.equal(eliminado, false);
});

test('eliminarCuenta de cuenta Google elimina sin pedir contraseña', async () => {
    let pidioLogin = false;
    auth.signInWithPassword = async () => { pidioLogin = true; return { data: {}, error: null }; };
    let id;
    repo.eliminarPorAuthId = async (a) => { id = a; };
    await servicio.eliminarCuenta(usuarioGoogle);
    assert.equal(pidioLogin, false);
    assert.equal(id, 'u2');
});

// ---------- cambiarPassword ----------
test('cambiarPassword rechaza cuentas sin contraseña con 400', async () => {
    await assert.rejects(() => servicio.cambiarPassword(usuarioGoogle, 'a', 'b'), (e) => {
        assert.equal(e.message, 'La cuenta no usa contraseña');
        assert.equal(e.status, 400);
        return true;
    });
});

test('cambiarPassword confirma la actual con un cliente propio y actualiza la nueva', async () => {
    let nueva;
    auth.signInWithPassword = async () => ({ data: { session: SESION }, error: null });
    auth.updateUser = async (a) => { nueva = a; return { error: null }; };
    await servicio.cambiarPassword(usuarioEmail, 'actual', 'nueva');
    assert.deepEqual(nueva, { password: 'nueva' });
    assert.equal(clientesCreados.length, 1);
});

test('cambiarPassword con contraseña actual incorrecta no actualiza', async () => {
    auth.signInWithPassword = async () => ({ data: {}, error: { message: 'x' } });
    let actualizado = false;
    auth.updateUser = async () => { actualizado = true; return { error: null }; };
    await assert.rejects(() => servicio.cambiarPassword(usuarioEmail, 'mala', 'nueva'), { status: 403 });
    assert.equal(actualizado, false);
});

test('cambiarPassword propaga el error de Supabase al actualizar', async () => {
    auth.signInWithPassword = async () => ({ data: { session: SESION }, error: null });
    auth.updateUser = async () => ({ error: { message: 'Password too weak', status: 422 } });
    await assert.rejects(() => servicio.cambiarPassword(usuarioEmail, 'actual', 'x'), (e) => {
        assert.equal(e.message, 'Password too weak');
        assert.equal(e.status, 422);
        return true;
    });
});
