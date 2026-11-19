// Log de depuración: muestra en consola el error real, que el usuario nunca ve.
// Lo llama errorHandler una sola vez por error.
export const registrarErrorOculto = (error) => {
    console.log("======= ERROR OCULTO =======");
    console.log("Mensaje original:", error?.message);
    console.log("Status original:", error?.status);
    console.log("============================");
};
