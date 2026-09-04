import httpStatus from "http-status-codes";
import { Router } from "express";
const { status } = httpStatus;
import CuentaService from "../services/cuentaService.js";
import Cuenta from "../entities/Cuenta.js";
import validarRegistro from "../middlewares/validarDatosRegistro.js";
import validarLogin from "../middlewares/validarDatosLogin.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { mapLoginError, mapRegisterError } from "../helpers/errores/cuentaErrores.js";

const router = Router();
const cuentaService = new CuentaService();

// AHORA SÍ: Ruta raíz protegida. Si no mandan Token válido en Postman, no entran.
router.get("/", verificarToken, (req, res) => {
    res.json({ 
        message: "¡Entraste a la zona VIP protegida!",
        user: {
            id: req.user.id,
            email: req.user.email
        }
    });
});

router.post("/login", validarLogin, async (req, res) => {
    try {
        const cuentaIngresada = req.body;
        
        // Llamamos al servicio (que ahora nos trae el token y el user)
        const resultado = await cuentaService.login(cuentaIngresada.email, cuentaIngresada.password);
        
        // Enviamos el Token y la cuenta en la respuesta HTTP
        res.status(status.OK).json({ 
            message: "logueado correctamente",
            token: resultado.token, //Postman ahora va a recibir esto 
            cuenta: {
                id: resultado.user.id,
                email: resultado.user.email,
                metadata: resultado.user.user_metadata,
            }
        });

    } catch (error) {
        const { codigoEstado, mensajeUsuario } = mapLoginError(error);

        res.status(codigoEstado).json({
            message: mensajeUsuario,
            codigoEstado: codigoEstado,
        });
    }
});

router.post("/registrar", validarRegistro, async (req, res) => {
    try {
        const datosRegistro = req.body;
        const resultado = await cuentaService.registrar(datosRegistro);
        const usuarioSupabase = resultado.user;
        const cuentaCreada = resultado.cuenta;

        res.status(status.CREATED).json({
            mensaje: "¡Usuario registrado con éxito!",
            usuario: {
                id: usuarioSupabase.id,
                email: usuarioSupabase.email,
            },
            cuenta: cuentaCreada
        });

    } catch (error) {
        const { codigoEstado, mensajeUsuario } = mapRegisterError(error);

        res.status(codigoEstado).json({
            message: mensajeUsuario,
            codigoEstado: codigoEstado,
        });
    }
});

export default router;