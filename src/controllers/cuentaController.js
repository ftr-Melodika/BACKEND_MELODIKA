import httpStatus from "http-status-codes";
import { Router } from "express";
const { status } = httpStatus;
import CuentaService from "../services/cuentaService.js";
import validarRegistro from "../middlewares/validarDatosRegistro.js";
import validarLogin from "../middlewares/validarDatosLogin.js";
import verificarToken from "../middlewares/authMiddleware.js";
import { catchAsync } from "../helpers/catchAsync.js";

const router = Router();
const cuentaService = new CuentaService();

router.get("/", verificarToken, catchAsync(async (req, res) => {
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

router.post("/login", validarLogin, catchAsync(async (req, res) => {
    const cuentaIngresada = req.body;
    const resultado = await cuentaService.login(cuentaIngresada.email, cuentaIngresada.password);

    res.status(status.OK).json({
        success: true,
        message: "logueado correctamente",
        data: {
            token: resultado.token,
            cuenta: {
                id: resultado.user.id,
                email: resultado.user.email,
                metadata: resultado.user.user_metadata,
            }
        }
    });
}));

router.post("/registrar", validarRegistro, catchAsync(async (req, res) => {
    const datosRegistro = req.body;
    const resultado = await cuentaService.registrar(datosRegistro);
    const usuarioSupabase = resultado.user;
    const cuentaCreada = resultado.cuenta;

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