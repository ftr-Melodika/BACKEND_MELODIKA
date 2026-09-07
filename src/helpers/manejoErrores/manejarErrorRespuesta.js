// Función auxiliar privada para manejar respuestas de error uniformes

export const manejarErrorRespuesta = (res, error, mapError) => {
    const { codigoEstado = 500, mensajeUsuario = "Hubo un error inesperado." } =
        mapError(error);

    return res.status(codigoEstado).json({
        success: false,
        message: mensajeUsuario,
    });
};