import status from "http-status-codes";
import { Router } from "express";
import CuentaService from "../services/cuentaService.js";
import validarRegistro from "../middlewares/validadores/validarDatosRegistro.js";
import validarLogin from "../middlewares/validadores/validarDatosLogin.js";
import validarRefreshToken from "../middlewares/validadores/validarDatosRefresh.js";
import validarCambioPassword from "../middlewares/validadores/validarCambioPassword.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { catchAsync } from "../helpers/catchAsync.js";

const router = Router();
const cuentaService = new CuentaService();

router.get("/", verificarToken, catchAsync(async (req, res) => {
    /* #swagger.tags = ['Cuentas']
       #swagger.summary = 'Ruta protegida de prueba' */
    res.status(status.OK).json({
        success: true,
        message: "¡Entraste a la zona VIP protegida!",
        data: {
            user: {
                id: req.user.id,
                email: req.user.email
            }
        }
    });
}));

// Los datos de la cuenta que ve el frontend (los mismos en el login y en /yo)
const aCuentaPublica = (user) => ({
    id: user.id,
    email: user.email,
    metadata: user.user_metadata,
    proveedor: user.app_metadata?.provider ?? null,
    // true si la cuenta tiene contraseña propia (email); false si entra solo con Google u otro proveedor
    tienePassword: cuentaService.tieneContraseña(user),
});

router.get("/yo", verificarToken, catchAsync(async (req, res) => {
    /* #swagger.tags = ['Cuentas']
       #swagger.summary = 'Datos de la cuenta del token (para entrar con Google u otros proveedores sin pasar por /login)' */
    res.status(status.OK).json({
        success: true,
        message: "Cuenta obtenida correctamente.",
        data: {
            cuenta: aCuentaPublica(req.user)
        }
    });
}));

router.delete("/yo", verificarToken, catchAsync(async (req, res) => {
    /* #swagger.tags = ['Cuentas']
       #swagger.summary = 'Eliminar la cuenta propia con todos sus perfiles y datos (pide password si la cuenta es de email)'
       #swagger.requestBody = {
           content: { "application/json": { schema: { type: "object", properties: { password: { type: "string" } } } } }
       } */
    await cuentaService.eliminarCuenta(req.user, req.body?.password);

    res.status(status.OK).json({
        success: true,
        message: "Cuenta eliminada correctamente.",
        data: null
    });
}));

router.put("/yo/password", verificarToken, validarCambioPassword, catchAsync(async (req, res) => {
    /* #swagger.tags = ['Cuentas']
       #swagger.summary = 'Cambiar la contraseña estando logueado (solo cuentas de email)'
       #swagger.requestBody = {
           required: true,
           content: { "application/json": { schema: { type: "object", properties: { passwordActual: { type: "string" }, passwordNueva: { type: "string" } } } } }
       } */
    await cuentaService.cambiarPassword(req.user, req.body.passwordActual, req.body.passwordNueva);

    res.status(status.OK).json({
        success: true,
        message: "Contraseña actualizada correctamente.",
        data: null
    });
}));

router.post("/login", validarLogin, catchAsync(async (req, res) => {
    const cuentaIngresada = req.body;
    const resultado = await cuentaService.login(cuentaIngresada.email, cuentaIngresada.password);

    /* #swagger.tags = ['Cuentas']
       #swagger.summary = 'Iniciar sesión'
       #swagger.requestBody = {
           required: true,
           content: { "application/json": { schema: { $ref: "#/components/schemas/LoginUsuario" } } }
       } */
    
    res.status(status.OK).json({
        success: true,
        message: "logueado correctamente",
        data: {
            token: resultado.token,
            refreshToken: resultado.refreshToken,
            expiresAt: resultado.expiresAt,
            cuenta: aCuentaPublica(resultado.user)
        }
    });
}));

router.post("/refresh", validarRefreshToken, catchAsync(async (req, res) => {
    /* #swagger.tags = ['Cuentas']
       #swagger.summary = 'Renovar la sesión usando el refresh token'
       #swagger.requestBody = {
           required: true,
           content: { "application/json": { schema: { $ref: "#/components/schemas/RefreshToken" } } }
       } */
    const { refreshToken } = req.body;

    const resultado = await cuentaService.refrescarSesion(refreshToken.trim());

    res.status(status.OK).json({
        success: true,
        message: "sesión renovada",
        data: {
            token: resultado.token,
            refreshToken: resultado.refreshToken,
            expiresAt: resultado.expiresAt,
        }
    });
}));

router.post("/registrar", validarRegistro, catchAsync(async (req, res) => {
    const datosRegistro = req.body;
    const resultado = await cuentaService.registrar(datosRegistro);
    const usuarioSupabase = resultado.user;
    const cuentaCreada = resultado.cuenta;

    /* #swagger.tags = ['Cuentas']
       #swagger.summary = 'Registrar nueva cuenta'
       #swagger.requestBody = {
           required: true,
           content: { "application/json": { schema: { $ref: "#/components/schemas/RegistroUsuario" } } }
       } */

    res.status(status.CREATED).json({
        success: true,
        message: "¡Usuario registrado con éxito!",
        data: {
            usuario: {
                id: usuarioSupabase.id,
                email: usuarioSupabase.email,
            },
            cuenta: cuentaCreada
        }
    });
}));

export default router;