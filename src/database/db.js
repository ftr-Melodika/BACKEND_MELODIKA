import pg from 'pg';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error adquiriendo el cliente', err.stack);
  }

  console.log('Conexión exitosa a Supabase PostgreSQL');
  release();
});

const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!process.env.SUPABASE_URL || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE key in environment variables');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  supabaseKey
);

export { pool, supabase };