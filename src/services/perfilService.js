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
                // Lanzamos el error literal para que lo ataje tu Helper
                throw new Error("Perfil no encontrado para racha");
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
            const top10 = await perfilRepository.obtenerTopRanking();
            return {
                total_jugadores: top10.length,
                ranking: top10
            };
        }
}


export default new PerfilService();
