    import PerfilRepository from '../repositories/perfilesRepository.js';
    import CuentaRepository from '../repositories/cuentaRepository.js';

    const perfilRepository = new PerfilRepository();
    const cuentaRepository = new CuentaRepository();

    class PerfilService {
        
        async obtenerPerfiles(authId) {
            // Usamos tu método exacto
            const cuenta = await cuentaRepository.encontrarPorAuthId(authId);
            
            if (!cuenta) {
                // Este texto exacto es el que tu helper va a atajar
                throw new Error("Cuenta no encontrada");
            }

            const perfiles = await perfilRepository.obtenerPorCuentaId(cuenta.id);
            

            if (perfiles.length === 0) {
                return null;
            }
            return perfiles;
        }
        //VERIFICAR ESTO
        async crearPerfil(authId, datosPerfil) {
            const cuenta = await cuentaRepository.encontrarPorAuthId(authId);
            const MAX_PERFILES = 4;

            if (!cuenta) {
                throw new Error("Cuenta no encontrada");
            }

            const perfilesActuales = await perfilRepository.obtenerPorCuentaId(cuenta.id);
            if (perfilesActuales.length >= MAX_PERFILES) {
                // Este texto exacto también lo ataja tu helper
                throw new Error("Límite de perfiles alcanzado");
            }

            const nombreDuplicado = perfilesActuales.some(
                perfil => perfil.nombre.toLowerCase() === datosPerfil.nombre.toLowerCase()
            );
            
            if (nombreDuplicado) {
                // Este error lo ataja tu helper (acordate de agregarlo al mapPerfilError)
                throw new Error("Ya tienes un perfil con este nombre");
            }

            // Deberíamos validar formato también, pero lo ideal es hacerlo en un middleware como hiciste con validarRegistro.
            const nuevoPerfil = await perfilRepository.crearPerfil(cuenta.id, datosPerfil);
            return nuevoPerfil;
        }
    

        async chequearRacha(perfilId) {
            const resultado = await perfilesRepository.actualizarRachaDiaria(perfilId);
            
            if (!resultado) {
                return { exito: false, mensaje: "Perfil no encontrado" };
            }

            let mensajeApp = "";
            if (resultado.dias_pasados === 0) {
                mensajeApp = "¡Ya habías sumado tu racha de hoy! 🔥";
            } else if (resultado.dias_pasados <= 3) {
                mensajeApp = `¡Excelente! Tu racha subió a ${resultado.racha} 🔥`;
            } else {
                mensajeApp = "¡Qué bueno verte de nuevo! Empezamos una nueva racha 🔥";
            }

            return { 
                exito: true, 
                rachaActual: resultado.racha, 
                mensaje: mensajeApp 
            };
        }

        // Lógica de Ranking
        async obtenerRanking() {
            const top10 = await perfilesRepository.obtenerTopRanking();
            return {
                total_jugadores: top10.length,
                ranking: top10
            };
        }
}


export default new PerfilService();
