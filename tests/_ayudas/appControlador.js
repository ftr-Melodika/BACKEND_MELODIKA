// Ayudas para probar controllers por HTTP real, sin base de datos ni Supabase.
// Uso (en un test, ANTES de importar el controller):
//   const { mock } = await import('node:test');
//   const h = await import('../_ayudas/appControlador.js');
//   const svc = h.servicioFalso(['listar']);
//   h.mockearModulo(mock, 'services/x.js', { defaultExport: svc });
//   h.mockearSupabase(mock);                      // token 'token-ok' => USUARIO
//   const router = (await import(h.rutaSrc('controllers/x.js'))).default;
//   const app = await h.levantarApp('/api/x', router);
//   const r = await app.pedir('GET', '/api/x/algo'); await app.cerrar();
import { mock as mockGlobal } from 'node:test';
import express from 'express';

export const rutaSrc = (rel) => new URL(`../../src/${rel}`, import.meta.url).href;

export const USUARIO = { id: 'auth-123', email: 'ana@correo.com', user_metadata: { nombre: 'Ana' }, app_metadata: { provider: 'email' } };
export const TOKEN_OK = 'token-ok';
export const PERFIL_ID = '11111111-1111-4111-8111-111111111111';
export const OTRO_ID = '22222222-2222-4222-8222-222222222222';
export const GRUPO_ID = '33333333-3333-4333-8333-333333333333';

export function mockearModulo(mock, relSrc, opciones) {
    return mock.module(rutaSrc(relSrc), opciones);
}

// Supabase falso: solo reconoce TOKEN_OK. Cuenta cuántas veces se le preguntó.
export function mockearSupabase(mock, usuario = USUARIO) {
    const estado = { consultas: [] };
    const getUser = async (token) => {
        estado.consultas.push(token);
        return token === TOKEN_OK
            ? { data: { user: usuario }, error: null }
            : { data: { user: null }, error: { message: 'invalid JWT' } };
    };
    mock.module(rutaSrc('database/supabase.js'), {
        namedExports: { supabase: { auth: { getUser } }, crearClienteAuth: () => ({ auth: {} }) },
    });
    return estado;
}

// Service falso: cada método es un mock.fn (guarda .mock.calls) que devuelve lo que se le configure.
export function servicioFalso(metodos) {
    const servicio = {};
    for (const m of metodos) servicio[m] = mockGlobal.fn(async () => undefined);
    return servicio;
}

// Clase falsa para controllers que hacen `new Service()`: todas las instancias son el mismo falso.
export const claseFalsa = (servicio) => class { constructor() { return servicio; } };

export async function levantarApp(prefijo, router) {
    const silencio = mockGlobal.method(console, 'log', () => {});
    const silencioErr = mockGlobal.method(console, 'error', () => {});
    const { errorHandler } = await import(rutaSrc('middlewares/errorHandler.js'));
    const app = express();
    app.use(express.json());
    app.use(prefijo, router);
    app.use(errorHandler);
    const servidor = await new Promise((ok) => { const s = app.listen(0, () => ok(s)); });
    const base = `http://127.0.0.1:${servidor.address().port}`;

    const pedir = async (metodo, ruta, { token = TOKEN_OK, body, headers = {} } = {}) => {
        const cab = { ...headers };
        if (token) cab.authorization = `Bearer ${token}`;
        let cuerpo;
        if (body !== undefined) { cab['content-type'] = 'application/json'; cuerpo = JSON.stringify(body); }
        const resp = await fetch(base + ruta, { method: metodo, headers: cab, body: cuerpo });
        let json = null;
        try { json = await resp.json(); } catch { /* sin cuerpo */ }
        return { status: resp.status, json };
    };
    const cerrar = () => new Promise((ok) => { servidor.close(() => { silencio.mock.restore(); silencioErr.mock.restore(); ok(); }); servidor.closeAllConnections?.(); });
    return { pedir, cerrar };
}
