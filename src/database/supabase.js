import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Creamos un único "cliente" de Supabase para que use todo el backend
export const supabase = createClient(supabaseUrl, supabaseKey);