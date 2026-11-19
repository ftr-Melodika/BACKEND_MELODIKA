import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE key in environment variables');
}

// Cliente compartido que usa todo el backend (verificar tokens, registrar cuentas)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente aparte solo para login/refresh: no guarda sesión ni auto-refresca en el servidor,
// así la sesión de un usuario no queda pegada al cliente compartido.
export const crearClienteAuth = () => createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});
