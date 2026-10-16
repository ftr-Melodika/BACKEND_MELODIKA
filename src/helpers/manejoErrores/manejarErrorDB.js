// Helper para estandarizar el manejo de errores en los repositories
export const manejarErrorDB = (error, mensajeUsuario = "Error al conectar con la base de datos") => {
    console.error("Error de Base de Datos:", error);
    const err = new Error(mensajeUsuario, { cause: error });
    err.code = error.code;
    if (error.constraint) {
        err.constraint = error.constraint;
    }
    throw err;
};
