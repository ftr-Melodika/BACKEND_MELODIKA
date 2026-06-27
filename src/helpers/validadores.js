// Revisa si el formato del email es correcto
const esEmailValido = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]{2,}\.[a-zA-Z]{2,}$/;
    return regex.test(email);
};

// Revisa la longitud mínima (6 caracteres)
const esPasswordLargo = (password) => {
    return password.length >= 6; 
};

// Revisa si tiene al menos una mayúscula
const tieneMayuscula = (password) => {
    // La expresión /[A-Z]/ busca cualquier letra mayúscula en el texto
    const regex = /[A-Z]/;
    return regex.test(password);
};

// Revisa si tiene al menos un signo/símbolo especial
const tieneSigno = (password) => {
    // La expresión /[^a-zA-Z0-9]/ busca cualquier cosa que NO (^) sea una letra o un número
    const regex = /[^a-zA-Z0-9]/;
    return regex.test(password);
};

const tieneEmail = (email) =>{
    return email !== undefined && email !== null && email.trim() !== '';
}

const tienePassword = (password) =>{
    return password !== undefined && password !== null && password.trim() !== '';
}

const esNombreValido = (texto) => {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,}$/;
    return regex.test(texto.trim());
};

const esTelefonoValido = (telefono) => {
    // ^\+? -> Permite que empiece con un "+" de forma opcional.
    // \d{10,15} -> Exige que haya entre 10 y 15 números (sin letras ni guiones).
    // $ -> Asegura que no haya nada más después de los números.
    const regex = /^\+?\d{10,15}$/;
    const telLimpio = String(telefono).trim();
    return regex.test(telLimpio);
};

function obtenerCodigoDb(error) {
    return error.code || error.cause?.code;
}

// Revisa que el username tenga entre 3 y 20 caracteres, sin espacios, solo alfanumérico y guion bajo
const esUsernameValido = (username) => {
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(username.trim());
};

// Revisa que el país tenga al menos 2 letras, permitiendo espacios
const esPaisValido = (pais) => {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
    return regex.test(pais.trim());
};

// Validar formato fecha simple YYYY-MM-DD
const esFechaValida = (fecha) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha);
}

// Validar que el género esté en nuestra lista permitida
const esGeneroValido = (genero) => {
    const generosPermitidos = ['Masculino', 'Femenino', 'No binario'];
    return generosPermitidos.includes(genero);
}   

// Exportamos todas las herramientas para que el middleware las pueda usar
export default { 
    esEmailValido, 
    esPasswordLargo, 
    tieneMayuscula, 
    tieneSigno,
    tieneEmail,
    tienePassword,
    esNombreValido,
    esTelefonoValido,
    obtenerCodigoDb,
    esUsernameValido,
    esPaisValido,
    esFechaValida,
    esGeneroValido
};