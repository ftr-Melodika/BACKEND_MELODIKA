    import PerfilRepository from '../repositories/perfilesRepository.js';
    import CuentaRepository from '../repositories/cuentaRepository.js';

    const perfilRepository = new PerfilRepository();
    const cuentaRepository = new CuentaRepository();

    class PerfilService {
        
        async obtenerPerfiles(authId) {
            // Usamos tu método exacto
            console.log('PerfilService.obtenerPerfiles - authId recibido:', authId);
            const cuenta = await cuentaRepository.encontrarPorAuthId(authId);

            if (!cuenta) {
                // Este texto exacto es el que tu helper va a atajar
                console.warn('PerfilService: no se encontró cuenta local para authId:', authId);
                throw new Error("Cuenta no encontrada");
            }

            console.log('PerfilService: cuenta encontrada id=', cuenta.id);

            const perfiles = await perfilRepository.obtenerPorCuentaId(cuenta.id);

            console.log('PerfilService: perfiles encontrados count=', perfiles ? perfiles.length : 0);

            if (perfiles.length === 0) {
                return null;
            }
            return perfiles;
        }
        
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

            const nuevoPerfil = await perfilRepository.crearPerfil(cuenta.id, datosPerfil);
            return nuevoPerfil;
        }
    

        async chequearRacha(perfilId) {
    const resultado = await perfilRepository.actualizarRachaDiaria(perfilId);

    if (!resultado) {
        throw new Error("Perfil no encontrado para racha");
    }

    let mensajeApp = "";
    let mostrarAnimacion = false;
    let rachaAnterior = resultado.racha;

    if (resultado.dias_pasados === 0) {

        mensajeApp = "¡Ya habías sumado tu racha de hoy! 🔥";

    } else if (resultado.dias_pasados <= 3) {

        mensajeApp = `¡Excelente! Tu racha subió a ${resultado.racha} 🔥`;

        mostrarAnimacion = true;

        rachaAnterior = resultado.racha - 1;

    } else {

        mensajeApp = "¡Qué bueno verte de nuevo! Empezamos una nueva racha 🔥";

        mostrarAnimacion = true;

        // Venía de una racha perdida, la nueva empieza en 1.
        // Para la animación podemos mostrar 0 → 1.
        rachaAnterior = 0;

    }

    return {
        exito: true,
        mostrarAnimacion,
        rachaAnterior,
        rachaActual: resultado.racha,
        mensaje: mensajeApp
    };
}

        // Lógica de Ranking
        async obtenerRanking() {
            const top10 = await perfilRepository.obtenerTopRanking();
            return {
                total_jugadores: top10.length,
                ranking: top10
            };
        }
        
        async eliminarPerfil(authId, perfilId) {
            const cuenta = await cuentaRepository.encontrarPorAuthId(authId);
            if (!cuenta) {
                throw new Error("Cuenta no encontrada");
            }
            const fueEliminado = await perfilRepository.eliminarPerfil(perfilId, cuenta.id);
            if (!fueEliminado) {
                throw new Error("Perfil no encontrado o no autorizado");
            }   
            return { exito: true };
        }

    }


export default new PerfilService();
