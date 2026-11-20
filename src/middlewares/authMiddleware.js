import { supabase } from '../database/supabase.js';
import status from 'http-status-codes';
import { CacheTemporal } from '../helpers/cacheTemporal.js';

// Preguntarle a Supabase por el token en cada pedido sumaba un viaje de red a todas las rutas.
// Un token ya verificado se recuerda un minuto. Costo: un token revocado puede seguir sirviendo
// hasta ese minuto (igual que un JWT firmado, que sirve hasta que vence).
const SEGUNDOS_CACHE_TOKEN = 60;
const tokensVerificados = new CacheTemporal({ duracionMs: SEGUNDOS_CACHE_TOKEN * 1000, maximo: 1000 });

const verificarToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // 1. Verificamos que manden el header "Authorization" con el formato correcto
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(status.UNAUTHORIZED).json({ success: false, message: 'Acceso denegado. Token no provisto.' });
    }

    // 2. Cortamos el texto para quedarnos solo con el token puro
    const token = authHeader.split(' ')[1];

    // 3. Si ya lo verificamos hace poco, no hace falta volver a preguntar
    let user = tokensVerificados.obtener(token);

    // 4. Si no, le preguntamos a Supabase si el token es válido (solo los válidos se recuerdan)
    if (!user) {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data?.user) {
            return res.status(status.UNAUTHORIZED).json({ success: false, message: 'Token inválido o expirado' });
        }
        user = data.user;
        tokensVerificados.guardar(token, user);
    }

    // 5. Si está todo ok, guardamos el usuario en la request y pasamos al controller
    req.user = user;
    next();
};

export default verificarToken;
