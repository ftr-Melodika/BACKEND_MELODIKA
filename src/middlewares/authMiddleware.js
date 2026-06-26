import { supabase } from '../database/supabase.js';
import status from 'http-status-codes';

const verificarToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // 1. Verificamos que manden el header "Authorization" con el formato correcto
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(status.UNAUTHORIZED).json({ error: 'Acceso denegado. Token no provisto.' });
    }

    // 2. Cortamos el texto para quedarnos solo con el token puro
    const token = authHeader.split(' ')[1];

    // 3. Le preguntamos a Supabase si el token es válido
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return res.status(status.UNAUTHORIZED).json({ error: 'Token inválido o expirado' });
    }

    // 4. Si está todo ok, guardamos el usuario en la request y pasamos al controller
    req.user = user; 
    next(); 
};

export default verificarToken;